import { google } from 'googleapis';

export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export class EmailService {
    private gmail: any = null;

    async initialize(): Promise<boolean> {
        try {
            const credentials = {
                client_id: process.env.GMAIL_CLIENT_ID,
                client_secret: process.env.GMAIL_CLIENT_SECRET,
                refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            };

            if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
                console.log('Email service: Gmail credentials not configured');
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
            console.log('Email service initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize email service:', error);
            return false;
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.gmail) {
            console.error('Email service not initialized');
            return false;
        }

        try {
            const message = [
                `To: ${options.to}`,
                `Subject: ${options.subject}`,
                'Content-Type: text/html; charset=utf-8',
                '',
                options.html || options.text,
            ].join('\n');

            const encodedMessage = Buffer.from(message)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                },
            });

            console.log(`Email sent successfully to ${options.to}`);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Expense Tracker account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return await this.sendEmail({
            to: email,
            subject: 'Reset Your Password - Expense Tracker',
            text: `Reset your password by visiting: ${resetUrl}\n\nThis link will expire in 1 hour.`,
            html,
        });
    }

    isInitialized(): boolean {
        return this.gmail !== null;
    }
}

// Export factory function for dependency injection
export function createEmailService(storage?: any): EmailService {
  return new EmailService();
}
