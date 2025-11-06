import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import type { IStorage } from './storage';

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
}

export class GmailService {
  private gmail: gmail_v1.Gmail | null = null;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async initialize(): Promise<boolean> {
    try {
      // Use standard Gmail API OAuth (works on both local and Replit)
      const credentials = {
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      };

      if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
        console.log('Gmail API credentials not found. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN environment variables.');
        console.log('See GMAIL_SETUP.md for setup instructions.');
        return false;
      }

      const oauth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        'http://localhost:5000/auth/gmail/callback'
      );

      oauth2Client.setCredentials({
        refresh_token: credentials.refresh_token,
      });

      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      console.log('Gmail service initialized successfully');

      return true;
    } catch (error) {
      console.error('Failed to initialize Gmail service:', error);
      return false;
    }
  }

  async getRecentEmails(maxResults?: number, isInitialSync: boolean = false): Promise<EmailMessage[]> {
    if (!this.gmail) {
      throw new Error('Gmail service not initialized');
    }

    try {
      // Get configuration from environment variables
      const initialDays = parseInt(process.env.EMAIL_SYNC_INITIAL_DAYS || '30');
      const batchSize = parseInt(process.env.EMAIL_SYNC_BATCH_SIZE || '50');
      const initialBatchSize = parseInt(process.env.EMAIL_SYNC_INITIAL_BATCH_SIZE || '200');

      // Get bank domains from database
      const bankPatterns = await this.storage.getBankPatterns();
      const activePatterns = bankPatterns.filter(p => p.isActive === 'true');

      let bankDomains: string[];
      if (activePatterns.length > 0) {
        // Use domains from database
        bankDomains = activePatterns.map(p => p.domain);
      } else {
        // Fallback to hardcoded domains
        bankDomains = [
          'hdfcbank.com',
          'icicibank.com',
          'sbi.co.in',
          'axisbank.com',
          'yesbank.in',
          'kotak.com',
          'indusind.com',
          'pnb.co.in',
          'bankofindia.com',
          'paytm.com',
          'phonepe.com',
        ];
      }

      const query = bankDomains.map(domain => `from:${domain}`).join(' OR ');

      // Smart date filtering based on configuration
      let dateFilter = '';
      let emailLimit = maxResults;

      if (isInitialSync) {
        // For initial sync: get emails from configured days ago
        const daysAgo = Math.floor(Date.now() / 1000) - (initialDays * 24 * 60 * 60);
        dateFilter = `after:${daysAgo}`;
        emailLimit = emailLimit || initialBatchSize;
        console.log(`Initial sync: fetching emails from last ${initialDays} days`);
      } else {
        // For regular sync: get emails from last 24 hours
        const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        dateFilter = `after:${oneDayAgo}`;
        emailLimit = emailLimit || batchSize;
      }

      const fullQuery = `${query} ${dateFilter}`;

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: fullQuery,
        maxResults: emailLimit,
      });

      const messages = response.data.messages || [];
      const emailMessages: EmailMessage[] = [];

      for (const message of messages) {
        if (!message.id) continue;

        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const parsed = this.parseEmailMessage(fullMessage.data);
        if (parsed) {
          emailMessages.push(parsed);
        }
      }

      return emailMessages;
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      return [];
    }
  }

  private parseEmailMessage(message: gmail_v1.Schema$Message): EmailMessage | null {
    try {
      const headers = message.payload?.headers || [];
      const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
      const dateStr = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

      let body = '';
      if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload?.parts) {
        const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      return {
        id: message.id || '',
        threadId: message.threadId || '',
        from,
        subject,
        body,
        date: new Date(dateStr),
      };
    } catch (error) {
      console.error('Failed to parse email message:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.gmail !== null;
  }
}

// Export factory function for dependency injection
export function createGmailService(storage: IStorage): GmailService {
  return new GmailService(storage);
}
