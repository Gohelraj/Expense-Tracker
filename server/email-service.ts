import { smtpService } from './smtp-service';

export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export class EmailService {
    async initialize(): Promise<boolean> {
        // Initialize SMTP service
        return await smtpService.initialize();
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        return await smtpService.sendEmail(options);
    }

    async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
        return await smtpService.sendPasswordResetEmail(email, resetToken);
    }

    async sendBudgetAlertEmail(email: string, alerts: Array<{
        category: string;
        budgetAmount: number;
        currentSpending: number;
        percentage: number;
        severity: 'warning' | 'danger' | 'exceeded';
    }>): Promise<boolean> {
        return await smtpService.sendBudgetAlertEmail(email, alerts);
    }

    isInitialized(): boolean {
        return smtpService.isInitialized();
    }
}

export const emailService = new EmailService();
