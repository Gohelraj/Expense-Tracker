import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Calendar } from "lucide-react";

interface Expense {
    id: string;
    amount: string;
    merchant: string;
    category: string;
    date: string;
    paymentMethod: string;
    notes: string | null;
    source: string;
}

const categories = [
    "Food & Dining",
    "Transport",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Groceries",
    "Other",
];

const paymentMethods = ["Credit Card", "Debit Card", "UPI", "Cash", "Net Banking", "Wallet", "Other"];

export default function TransactionDetails() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Fetch expenses
    const { data: expenses = [], isLoading } = useQuery<Expense[]>({
        queryKey: ["/api/expenses"],
    });

    // Update expense mutation
    const updateExpenseMutation = useMutation({
        mutationFn: async (expense: Expense) => {
            // Ensure date is in proper format
            const dateValue = typeof expense.date === 'string'
                ? expense.date
                : new Date(expense.date).toISOString();

            const response = await fetch(`/api/expenses/${expense.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: expense.amount,
                    merchant: expense.merchant,
                    category: expense.category,
                    date: dateValue,
                    paymentMethod: expense.paymentMethod,
                    notes: expense.notes,
                    source: expense.source,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update expense");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
            queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats/summary"] });
            toast({
                title: "Success",
                description: "Transaction updated successfully",
            });
            setIsEditDialogOpen(false);
            setEditingExpense(null);
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update transaction",
                variant: "destructive",
            });
        },
    });

    // Delete expense mutation
    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/expenses/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete expense");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
            queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats/summary"] });
            toast({
                title: "Success",
                description: "Transaction deleted successfully",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to delete transaction",
                variant: "destructive",
            });
        },
    });

    // Group expenses by date
    const groupedExpenses = expenses.reduce((groups, expense) => {
        const date = format(parseISO(expense.date), "yyyy-MM-dd");
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(expense);
        return groups;
    }, {} as Record<string, Expense[]>);

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedExpenses).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this transaction?")) {
            deleteExpenseMutation.mutate(id);
        }
    };

    const handleSave = () => {
        if (editingExpense) {
            updateExpenseMutation.mutate(editingExpense);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Loading transactions...</div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Transaction Details</h1>
                    <p className="text-muted-foreground mt-2">
                        View and edit your transactions organized by date
                    </p>
                </div>

                {sortedDates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg text-muted-foreground">No transactions found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {sortedDates.map((date) => {
                            const dateExpenses = groupedExpenses[date];
                            const totalAmount = dateExpenses.reduce(
                                (sum, exp) => sum + parseFloat(exp.amount),
                                0
                            );

                            return (
                                <Card key={date}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl">
                                                {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                                            </CardTitle>
                                            <div className="text-lg font-semibold">
                                                ₹{totalAmount.toFixed(2)}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {dateExpenses.map((expense) => (
                                                <div
                                                    key={expense.id}
                                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-semibold text-lg">
                                                                {expense.merchant}
                                                            </div>
                                                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                                                {expense.category}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                                                                {expense.paymentMethod}
                                                            </span>
                                                            {expense.source === "email" && (
                                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                                    Auto
                                                                </span>
                                                            )}
                                                        </div>
                                                        {expense.notes && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {expense.notes}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {format(parseISO(expense.date), "h:mm a")}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-xl font-bold">
                                                            ₹{parseFloat(expense.amount).toFixed(2)}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(expense)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(expense.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Transaction</DialogTitle>
                            <DialogDescription>
                                Update the transaction details below
                            </DialogDescription>
                        </DialogHeader>

                        {editingExpense && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="merchant">Merchant</Label>
                                    <Input
                                        id="merchant"
                                        value={editingExpense.merchant}
                                        onChange={(e) =>
                                            setEditingExpense({ ...editingExpense, merchant: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={editingExpense.amount}
                                        onChange={(e) =>
                                            setEditingExpense({ ...editingExpense, amount: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={editingExpense.category}
                                        onValueChange={(value) =>
                                            setEditingExpense({ ...editingExpense, category: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Select
                                        value={editingExpense.paymentMethod}
                                        onValueChange={(value) =>
                                            setEditingExpense({ ...editingExpense, paymentMethod: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((method) => (
                                                <SelectItem key={method} value={method}>
                                                    {method}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="datetime-local"
                                        value={format(parseISO(editingExpense.date), "yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) =>
                                            setEditingExpense({
                                                ...editingExpense,
                                                date: e.target.value ? new Date(e.target.value).toISOString() : editingExpense.date,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={editingExpense.notes || ""}
                                        onChange={(e) =>
                                            setEditingExpense({ ...editingExpense, notes: e.target.value })
                                        }
                                        placeholder="Add notes (optional)"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updateExpenseMutation.isPending}>
                                {updateExpenseMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
