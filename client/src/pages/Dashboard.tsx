import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import TransactionCard from "@/components/TransactionCard";
import ExpenseChart from "@/components/ExpenseChart";
import CategoryCard from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wallet, TrendingDown, DollarSign, PiggyBank, Search } from "lucide-react";
import AddExpenseModal from "@/components/AddExpenseModal";
import BudgetAlerts from "@/components/BudgetAlerts";
import KeyboardShortcutsBanner from "@/components/KeyboardShortcutsBanner";
import { getCategoryIcon, getCategoryColor } from "@/lib/categoryConfig";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Expense } from "@shared/schema";

export default function Dashboard() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => setShowAddExpense(true),
      description: 'Add new expense',
    },
    {
      key: 'k',
      ctrl: true,
      callback: () => searchInputRef.current?.focus(),
      description: 'Focus search',
    },
    {
      key: 'Escape',
      callback: () => {
        setShowAddExpense(false);
        setSelectedCategory(null);
      },
      description: 'Close modal',
    },
  ]);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    thisMonth: number;
    lastMonth: number;
    average: number;
    byCategory: Record<string, number>;
  }>({
    queryKey: ["/api/expenses/stats/summary"],
  });

  const recentExpenses = expenses.slice(0, 5);

  const categoryData: Record<string, { amount: number; count: number }> = {};
  expenses.forEach(expense => {
    if (!categoryData[expense.category]) {
      categoryData[expense.category] = { amount: 0, count: 0 };
    }
    categoryData[expense.category].amount += parseFloat(expense.amount);
    categoryData[expense.category].count += 1;
  });

  const totalSpending = Object.values(categoryData).reduce((sum, cat) => sum + cat.amount, 0);

  const categories = Object.entries(categoryData).map(([name, data]) => ({
    name,
    icon: getCategoryIcon(name),
    amount: data.amount,
    percentage: totalSpending > 0 ? Math.round((data.amount / totalSpending) * 100) : 0,
    color: getCategoryColor(name),
  }));

  const chartData = categories.map(cat => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color,
  }));

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return undefined;
    const change = Math.abs(((current - previous) / previous) * 100);
    return {
      value: `${change.toFixed(0)}% from last month`,
      isPositive: current < previous,
    };
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <KeyboardShortcutsBanner />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your spending</p>
          </div>
          <Button
            onClick={() => setShowAddExpense(true)}
            data-testid="button-add-expense"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {statsLoading || expensesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="This Month"
              value={formatCurrency(stats?.thisMonth || 0)}
              icon={Wallet}
              trend={stats && calculateTrend(stats.thisMonth, stats.lastMonth)}
            />
            <StatCard
              title="Last Month"
              value={formatCurrency(stats?.lastMonth || 0)}
              icon={TrendingDown}
            />
            <StatCard
              title="Average"
              value={formatCurrency(stats?.average || 0)}
              icon={DollarSign}
            />
            <StatCard
              title="Total"
              value={formatCurrency(totalSpending)}
              icon={PiggyBank}
            />
          </div>
        )}

        <BudgetAlerts />

        <div className="grid md:grid-cols-2 gap-6">
          {expensesLoading ? (
            <Skeleton className="h-96" />
          ) : chartData.length > 0 ? (
            <ExpenseChart data={chartData} />
          ) : (
            <div className="flex items-center justify-center h-96 border rounded-lg">
              <p className="text-muted-foreground">No expenses yet. Add your first expense to see the chart.</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Categories</h3>
            {expensesLoading ? (
              <Skeleton className="h-64" />
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard
                  key={category.name}
                  {...category}
                  isSelected={selectedCategory === category.name}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.name ? null : category.name
                  )}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-64 border rounded-lg">
                <p className="text-muted-foreground">No categories yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search transactions (Ctrl+K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {expensesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : recentExpenses.length > 0 ? (
            <>
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <TransactionCard
                    key={expense.id}
                    id={expense.id}
                    merchant={expense.merchant}
                    amount={parseFloat(expense.amount)}
                    category={expense.category}
                    categoryIcon={getCategoryIcon(expense.category)}
                    date={new Date(expense.date)}
                    paymentMethod={expense.paymentMethod}
                  />
                ))}
              </div>
              <Button variant="outline" className="w-full" data-testid="button-view-all">
                View All Transactions
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border rounded-lg gap-4">
              <p className="text-muted-foreground">No transactions yet</p>
              <Button onClick={() => setShowAddExpense(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          )}
        </div>
      </div>

      <AddExpenseModal open={showAddExpense} onOpenChange={setShowAddExpense} />
    </div>
  );
}
