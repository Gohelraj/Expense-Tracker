import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getCategoryIcon, getCategoryColor, CATEGORY_NAMES } from "@/lib/categoryConfig";
import type { Expense, Budget } from "@shared/schema";
import { Edit } from "lucide-react";

export default function Categories() {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const { toast } = useToast();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const saveBudgetMutation = useMutation({
    mutationFn: async (data: { category: string; amount: string }) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save budget");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Budget Updated",
        description: "Category budget has been saved successfully.",
      });
      setEditingCategory(null);
      setBudgetAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const categoryStats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart);

    const stats: Record<string, { amount: number; count: number }> = {};
    
    thisMonthExpenses.forEach(expense => {
      if (!stats[expense.category]) {
        stats[expense.category] = { amount: 0, count: 0 };
      }
      stats[expense.category].amount += parseFloat(expense.amount);
      stats[expense.category].count += 1;
    });

    return stats;
  }, [expenses]);

  const categoryList = useMemo(() => {
    const budgetMap = new Map(budgets.map(b => [b.category, parseFloat(b.amount)]));
    
    return CATEGORY_NAMES.map(category => {
      const stat = categoryStats[category] || { amount: 0, count: 0 };
      const budget = budgetMap.get(category) || 0;
      
      return {
        name: category,
        amount: stat.amount,
        count: stat.count,
        budget,
        percentage: budget > 0 ? (stat.amount / budget) * 100 : 0,
      };
    }).filter(c => c.amount > 0 || c.budget > 0);
  }, [categoryStats, budgets]);

  const handleEditBudget = (category: string, currentBudget: number) => {
    setEditingCategory(category);
    setBudgetAmount(currentBudget > 0 ? currentBudget.toString() : "");
  };

  const handleSaveBudget = () => {
    if (!editingCategory || !budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    saveBudgetMutation.mutate({
      category: editingCategory,
      amount: parseFloat(budgetAmount).toFixed(2),
    });
  };

  const isLoading = expensesLoading || budgetsLoading;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Track spending and manage budgets by category</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : categoryList.length > 0 ? (
          <div className="grid gap-4">
            {categoryList.map((category) => {
              const Icon = getCategoryIcon(category.name);
              const color = getCategoryColor(category.name);
              
              return (
                <Card key={category.name} className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} {category.count === 1 ? 'transaction' : 'transactions'} this month
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-mono font-bold">
                        ₹{category.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      {category.budget > 0 && (
                        <p className="text-sm text-muted-foreground">
                          of ₹{category.budget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditBudget(category.name, category.budget)}
                      data-testid={`button-edit-budget-${category.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {category.budget > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Budget usage</span>
                        <span className="font-medium">
                          {Math.round(category.percentage)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(category.percentage, 100)} 
                        className="h-2"
                        style={{
                          // @ts-ignore
                          '--progress-background': color
                        }}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No expenses yet. Start adding expenses to see category breakdowns.
            </p>
          </Card>
        )}

        <Dialog open={editingCategory !== null} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Budget for {editingCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget-amount">Monthly Budget (₹)</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="100"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="5000"
                  data-testid="input-budget-amount"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setEditingCategory(null)} data-testid="button-cancel-budget">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveBudget} 
                  disabled={saveBudgetMutation.isPending}
                  data-testid="button-save-budget"
                >
                  {saveBudgetMutation.isPending ? "Saving..." : "Save Budget"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
