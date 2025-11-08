import { storage } from "./storage";

interface BudgetAlert {
    category: string;
    budgetAmount: number;
    currentSpending: number;
    percentage: number;
    severity: 'warning' | 'danger' | 'exceeded';
}

export class BudgetAlertsService {
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
}

export const budgetAlertsService = new BudgetAlertsService();
