import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Heart,
  Smartphone,
  LucideIcon,
} from "lucide-react";

const CATEGORIES = [
  { name: "Food", icon: Utensils, color: "hsl(32, 95%, 44%)" },
  { name: "Transport", icon: Car, color: "hsl(217, 91%, 60%)" },
  { name: "Shopping", icon: ShoppingBag, color: "hsl(262, 83%, 58%)" },
  { name: "Bills", icon: Home, color: "hsl(142, 76%, 36%)" },
  { name: "Utilities", icon: Zap, color: "hsl(340, 82%, 52%)" },
  { name: "Health", icon: Heart, color: "hsl(0, 84%, 60%)" },
  { name: "Entertainment", icon: Smartphone, color: "hsl(262, 83%, 58%)" },
];

const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Other"];

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddExpenseModal({ open, onOpenChange }: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create expense");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats/summary"] });
      toast({
        title: "Expense added",
        description: "Your expense has been saved successfully.",
      });
      onOpenChange(false);
      setAmount("");
      setCategory("");
      setMerchant("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for this expense",
        variant: "destructive",
      });
      return;
    }
    
    createExpenseMutation.mutate({
      amount: amount,
      merchant,
      category,
      date: new Date(date),
      paymentMethod,
      notes: notes || null,
      source: "manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-4xl font-mono h-auto py-3 mt-2"
              required
              data-testid="input-amount"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Category</Label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg hover-elevate active-elevate-2 ${
                      category === cat.name ? 'ring-2 ring-primary' : ''
                    }`}
                    data-testid={`button-category-${cat.name.toLowerCase()}`}
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="merchant" className="text-sm font-medium">
              Merchant / Description
            </Label>
            <Input
              id="merchant"
              placeholder="Where did you spend?"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="mt-2"
              required
              data-testid="input-merchant"
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2"
              data-testid="input-date"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={paymentMethod === method ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod(method)}
                  data-testid={`button-payment-${method.toLowerCase()}`}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 resize-none"
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
              disabled={createExpenseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              data-testid="button-save-expense"
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
