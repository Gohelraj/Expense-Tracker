import type { IStorage } from './storage';
import type { GmailService } from './gmail-service';
import type { EmailParser } from './email-parser';
import { insertExpenseSchema } from '@shared/schema';

export class EmailPollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private lastSyncTime: Date | null = null;
  private hasPerformedInitialSync: boolean = false;
  private storage: IStorage;
  private gmailService: GmailService;
  private emailParser: EmailParser;
  // For single-user mode: store the user ID for automatic expense creation
  private defaultUserId: string | null = null;

  constructor(storage: IStorage, gmailService: GmailService, emailParser: EmailParser) {
    this.storage = storage;
    this.gmailService = gmailService;
    this.emailParser = emailParser;
  }

  async start(intervalMinutes?: number): Promise<void> {
    if (this.pollingInterval) {
      console.log('Email polling is already running');
      return;
    }

    // Initialize Gmail service
    const initialized = await this.gmailService.initialize();
    if (!initialized) {
      console.log('Gmail service not initialized. Skipping email polling.');
      return;
    }

    // Get configuration from environment variables
    const syncInterval = intervalMinutes || parseInt(process.env.EMAIL_SYNC_INTERVAL_MINUTES || '5');
    const initialDays = parseInt(process.env.EMAIL_SYNC_INITIAL_DAYS || '30');
    const batchSize = parseInt(process.env.EMAIL_SYNC_BATCH_SIZE || '50');
    const initialBatchSize = parseInt(process.env.EMAIL_SYNC_INITIAL_BATCH_SIZE || '200');

    console.log(`Starting email polling service with configuration:`);
    console.log(`  - Sync interval: ${syncInterval} minutes`);
    console.log(`  - Initial sync: ${initialDays} days`);
    console.log(`  - Regular batch size: ${batchSize} emails`);
    console.log(`  - Initial batch size: ${initialBatchSize} emails`);

    // Run immediately on start
    await this.pollEmails();

    // Then run periodically
    this.pollingInterval = setInterval(async () => {
      await this.pollEmails();
    }, syncInterval * 60 * 1000);

    this.isPolling = true;
  }

  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('Email polling service stopped');
    }
  }

  // Set the default user ID for expense creation (for single-user deployments)
  setDefaultUserId(userId: string): void {
    this.defaultUserId = userId;
    console.log(`Email polling will create expenses for user: ${userId}`);
  }

  private async pollEmails(): Promise<void> {
    try {
      const isInitialSync = !this.hasPerformedInitialSync;
      const syncType = isInitialSync ? 'Initial sync' : 'Regular sync';

      console.log(`${syncType}: Polling for bank transaction emails...`);

      const emails = await this.gmailService.getRecentEmails(undefined, isInitialSync);
      console.log(`Found ${emails.length} potential bank emails`);

      let processedCount = 0;
      let createdCount = 0;
      let skippedCount = 0;

      for (const email of emails) {
        // Check if we've already processed this email
        const alreadyProcessed = await this.storage.isEmailProcessed(email.id);
        if (alreadyProcessed) {
          continue;
        }

        processedCount++;

        // Try to parse the email (only debits/expenses)
        const parsed = await this.emailParser.parseEmail(email.subject, email.body, email.from, email.date);

        if (parsed) {
          // Mark email as processed first to avoid reprocessing
          await this.storage.markEmailAsProcessed(email.id);

          // Create expense if we have a default user ID configured
          if (this.defaultUserId) {
            try {
              const expenseData = {
                ...this.emailParser.toExpense(parsed),
                source: 'email' as const,
                emailId: email.id,
              };

              const result = insertExpenseSchema.safeParse(expenseData);
              if (result.success) {
                await this.storage.createExpense(result.data, this.defaultUserId);
                createdCount++;
                console.log(`💳 Created expense: ${parsed.merchant} - ₹${parsed.amount}`);
              } else {
                console.error(`Invalid expense data for email ${email.id}:`, result.error);
                skippedCount++;
              }
            } catch (error) {
              console.error(`Failed to create expense from email ${email.id}:`, error);
              skippedCount++;
            }
          } else {
            console.warn(`Skipping expense creation - no default user ID configured`);
            skippedCount++;
          }
        } else {
          // Email didn't parse to a transaction
          await this.storage.markEmailAsProcessed(email.id);
        }
      }

      this.lastSyncTime = new Date();
      if (isInitialSync) {
        this.hasPerformedInitialSync = true;
      }

      console.log(`${syncType} complete. Processed ${processedCount} new emails, created ${createdCount} expenses, skipped ${skippedCount}.`);

      if (!this.defaultUserId && processedCount > 0) {
        console.log(`⚠️  Email polling is running but no default user is configured for expense creation.`);
        console.log(`   Set EXPENSE_DEFAULT_USER_ID environment variable or use setDefaultUserId() to enable automatic expense creation.`);
      }
    } catch (error) {
      console.error('Error during email polling:', error);
    }
  }

  getStatus(): { isPolling: boolean; lastSyncTime: Date | null } {
    return {
      isPolling: this.isPolling,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

// Export factory function for dependency injection
export function createEmailPollingService(storage: IStorage, gmailService: GmailService, emailParser: EmailParser): EmailPollingService {
  const service = new EmailPollingService(storage, gmailService, emailParser);

  // Check for default user ID from environment variable
  const defaultUserId = process.env.EXPENSE_DEFAULT_USER_ID;
  if (defaultUserId) {
    service.setDefaultUserId(defaultUserId);
  }

  return service;
}
