import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class SMTPService {
  private transporter: Transporter | null = null;
  private fromEmail: string = '';

  async initialize(): Promise<boolean> {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpFromEmail = process.env.SMTP_FROM_EMAIL;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFromEmail) {
        console.log('SMTP service: Credentials not configured');
        return false;
      }

      this.fromEmail = smtpFromEmail;

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log('SMTP service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SMTP service:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('SMTP service not initialized');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"Expense Tracker" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
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

  async sendBudgetAlertEmail(email: string, alerts: Array<{
    category: string;
    budgetAmount: number;
    currentSpending: number;
    percentage: number;
    severity: 'warning' | 'danger' | 'exceeded';
  }>): Promise<boolean> {
    const alertRows = alerts.map(alert => {
      const color = alert.severity === 'exceeded' ? '#dc2626' : alert.severity === 'danger' ? '#ea580c' : '#f59e0b';
      return `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${alert.category}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">$${alert.budgetAmount.toFixed(2)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">$${alert.currentSpending.toFixed(2)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: ${color}; font-weight: bold;">${alert.percentage.toFixed(1)}%</td>
                </tr>
            `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Budget Alert</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have budget alerts that need your attention:</p>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Budget</th>
                    <th>Spent</th>
                    <th>Usage</th>
                  </tr>
                </thead>
                <tbody>
                  ${alertRows}
                </tbody>
              </table>
              <p><strong>Legend:</strong></p>
              <ul>
                <li><span style="color: #f59e0b;">⚠️ Warning:</span> 80-94% of budget used</li>
                <li><span style="color: #ea580c;">🔥 Danger:</span> 95-99% of budget used</li>
                <li><span style="color: #dc2626;">❌ Exceeded:</span> Over budget</li>
              </ul>
              <p>Consider reviewing your spending in these categories.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `Budget Alert\n\n` +
      `You have ${alerts.length} budget alert(s):\n\n` +
      alerts.map(a =>
        `${a.category}: $${a.currentSpending.toFixed(2)} / $${a.budgetAmount.toFixed(2)} (${a.percentage.toFixed(1)}%)`
      ).join('\n');

    return await this.sendEmail({
      to: email,
      subject: '⚠️ Budget Alert - Expense Tracker',
      text: textContent,
      html,
    });
  }

  isInitialized(): boolean {
    return this.transporter !== null;
  }
}

export const smtpService = new SMTPService();
