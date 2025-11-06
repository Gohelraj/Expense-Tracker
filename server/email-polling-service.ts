import { gmailService } from './gmail-service';
import { emailParser } from './email-parser';
import { storage } from './storage';

export class EmailPollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private lastSyncTime: Date | null = null;
  private hasPerformedInitialSync: boolean = false;

  async start(intervalMinutes?: number): Promise<void> {
    if (this.pollingInterval) {
      console.log('Email polling is already running');
      return;
    }

    // Initialize Gmail service
    const initialized = await gmailService.initialize();
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

  private async pollEmails(): Promise<void> {
    try {
      const isInitialSync = !this.hasPerformedInitialSync;
      const syncType = isInitialSync ? 'Initial sync' : 'Regular sync';

      console.log(`${syncType}: Polling for bank transaction emails...`);

      const emails = await gmailService.getRecentEmails(undefined, isInitialSync);
      console.log(`Found ${emails.length} potential bank emails`);

      let processedCount = 0;
      let createdCount = 0;

      for (const email of emails) {
        // Check if we've already processed this email
        const alreadyProcessed = await storage.isEmailProcessed(email.id);
        if (alreadyProcessed) {
          continue;
        }

        processedCount++;

        // Try to parse the email (only debits/expenses)
        const parsed = emailParser.parseEmail(email.subject, email.body, email.from, email.date);

        if (parsed) {
          // TODO: Email polling needs to be user-specific
          // For now, skip automatic expense creation from polling
          // Users can manually parse emails via the parse-and-create endpoint

          // Mark email as processed to avoid reprocessing
          try {
            await storage.markEmailAsProcessed(email.id);
            createdCount++;

            console.log(`💳 Created expense: ${parsed.merchant} - ₹${parsed.amount}`);
          } catch (error) {
            console.error(`Failed to create expense from email ${email.id}:`, error);
          }
        }
      }

      this.lastSyncTime = new Date();
      if (isInitialSync) {
        this.hasPerformedInitialSync = true;
      }

      console.log(`${syncType} complete. Processed ${processedCount} new emails, created ${createdCount} expenses.`);
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

export const emailPollingService = new EmailPollingService();
