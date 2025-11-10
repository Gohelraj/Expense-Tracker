import { storage } from "./storage";
import { emailService } from "./email-service";

interface BudgetAlert {
    category: string;
    budgetAmount: number;
    currentSpending: number;
    percentage: number;
    severity: 'warning' | 'danger' | 'exceeded';
}

export class BudgetAlertsService {
    private lastAlertSent: Date | null = null;
    private readonly ALERT_COOLDOWN_HOURS = 24; // Send alerts max once per day

    async checkBudgetAlerts(): Promise<BudgetAlert[]> {
        const alerts: BudgetAlert[] = [];

        try {
            const budgets = await storage.getBudgets();
            const expenses = await storage.getExpenses();

            // Calculate current month spending by category
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart);

            const categorySpending: Record<string, number> = {};
            thisMonthExpenses.forEach(expense => {
                const amount = parseFloat(expense.amount);
                categorySpending[expense.category] = (categorySpending[expense.category] || 0) + amount;
            });

            // Check each budget
            for (const budget of budgets) {
                const spending = categorySpending[budget.category] || 0;
                const budgetAmount = parseFloat(budget.amount);
                const percentage = (spending / budgetAmount) * 100;

                // Alert thresholds: 80% warning, 95% danger, 100%+ exceeded
                if (percentage >= 80) {
                    let severity: 'warning' | 'danger' | 'exceeded' = 'warning';
                    if (percentage >= 100) {
                        severity = 'exceeded';
                    } else if (percentage >= 95) {
                        severity = 'danger';
                    }

                    alerts.push({
                        category: budget.category,
                        budgetAmount,
                        currentSpending: spending,
                        percentage,
                        severity,
                    });
                }
            }

            return alerts;
        } catch (error) {
            console.error('Error checking budget alerts:', error);
            return [];
        }
    }

    async getBudgetStatus() {
        const alerts = await this.checkBudgetAlerts();

        return {
            hasAlerts: alerts.length > 0,
            alerts,
            summary: {
                warning: alerts.filter(a => a.severity === 'warning').length,
                danger: alerts.filter(a => a.severity === 'danger').length,
                exceeded: alerts.filter(a => a.severity === 'exceeded').length,
            },
        };
    }

    async sendBudgetAlerts(userEmail: string): Promise<boolean> {
        // Check cooldown
        if (this.lastAlertSent) {
            const hoursSinceLastAlert = (Date.now() - this.lastAlertSent.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastAlert < this.ALERT_COOLDOWN_HOURS) {
                console.log(`Budget alert cooldown active. ${this.ALERT_COOLDOWN_HOURS - hoursSinceLastAlert} hours remaining.`);
                return false;
            }
        }

        const alerts = await this.checkBudgetAlerts();

        if (alerts.length === 0) {
            console.log('No budget alerts to send');
            return false;
        }

        if (!emailService.isInitialized()) {
            console.error('Email service not initialized. Cannot send budget alerts.');
            return false;
        }

        try {
            const sent = await emailService.sendBudgetAlertEmail(userEmail, alerts);
            if (sent) {
                this.lastAlertSent = new Date();
                console.log(`Budget alerts sent to ${userEmail}`);
            }
            return sent;
        } catch (error) {
            console.error('Failed to send budget alerts:', error);
            return false;
        }
    }

    async checkAndSendAlerts(userEmail: string): Promise<void> {
        await this.sendBudgetAlerts(userEmail);
    }
}

export const budgetAlertsService = new BudgetAlertsService();
