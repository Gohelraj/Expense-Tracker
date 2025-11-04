import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BudgetAlert {
    category: string;
    budgetAmount: number;
    currentSpending: number;
    percentage: number;
    severity: 'warning' | 'danger' | 'exceeded';
}

interface BudgetStatus {
    hasAlerts: boolean;
    alerts: BudgetAlert[];
    summary: {
        warning: number;
        danger: number;
        exceeded: number;
    };
}

export default function BudgetAlerts() {
    const { data: budgetStatus } = useQuery<BudgetStatus>({
        queryKey: ["/api/budgets/alerts/status"],
        refetchInterval: 60000, // Refetch every minute
    });

    if (!budgetStatus || !budgetStatus.hasAlerts) {
        return null;
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'warning':
                return <AlertTriangle className="h-4 w-4" />;
            case 'danger':
                return <AlertCircle className="h-4 w-4" />;
            case 'exceeded':
                return <XCircle className="h-4 w-4" />;
            default:
                return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'warning':
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
            case 'danger':
                return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
            case 'exceeded':
                return 'border-red-500 bg-red-50 dark:bg-red-950';
            default:
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Alerts</h3>
            <div className="space-y-3">
                {budgetStatus.alerts.map((alert) => (
                    <Alert key={alert.category} className={getSeverityColor(alert.severity)}>
                        <div className="flex items-start gap-3">
                            {getSeverityIcon(alert.severity)}
                            <div className="flex-1 space-y-2">
                                <AlertTitle className="text-sm font-semibold">
                                    {alert.category}
                                </AlertTitle>
                                <AlertDescription className="text-xs">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>
                                                ₹{formatCurrency(alert.currentSpending)} of ₹{formatCurrency(alert.budgetAmount)}
                                            </span>
                                            <span className="font-semibold">
                                                {Math.round(alert.percentage)}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.min(alert.percentage, 100)}
                                            className="h-2"
                                        />
                                        {alert.severity === 'exceeded' && (
                                            <p className="text-red-700 dark:text-red-300 font-medium">
                                                Budget exceeded by ₹{formatCurrency(alert.currentSpending - alert.budgetAmount)}
                                            </p>
                                        )}
                                    </div>
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                ))}
            </div>
        </Card>
    );
}
