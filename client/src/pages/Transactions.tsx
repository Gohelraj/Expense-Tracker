import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import TransactionCard from "@/components/TransactionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Trash2, Calendar } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryConfig";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Expense } from "@shared/schema";
import { subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function Transactions() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: () => searchInputRef.current?.focus(),
      description: 'Focus search',
    },
    {
      key: 'a',
      ctrl: true,
      callback: () => handleSelectAll(),
      description: 'Select all',
    },
    {
      key: 'e',
      ctrl: true,
      shift: true,
      callback: () => handleExport(),
      description: 'Export CSV',
    },
    {
      key: 'Delete',
      callback: () => {
        if (selectedIds.size > 0) {
          handleBulkDelete();
        }
      },
      description: 'Delete selected',
    },
    {
      key: 'Escape',
      callback: () => setSelectedIds(new Set()),
      description: 'Clear selection',
    },
  ]);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/expenses/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Failed to delete expenses");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats/summary"] });
      toast({
        title: "Success",
        description: `Deleted ${data.deletedCount} transaction(s)`,
      });
      setSelectedIds(new Set());
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transactions",
        variant: "destructive",
      });
    },
  });

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
      case "week":
        return { start: subDays(now, 7), end: new Date() };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "custom":
        if (customStartDate && customEndDate) {
          return { start: new Date(customStartDate), end: new Date(customEndDate) };
        }
        return null;
      default:
        return null;
    }
  };

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Date range filter
    const dateFilter = getDateRangeFilter();
    if (dateFilter) {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= dateFilter.start && expenseDate <= dateFilter.end;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(e => e.category.toLowerCase() === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "amount") {
        return parseFloat(b.amount) - parseFloat(a.amount);
      } else {
        return a.category.localeCompare(b.category);
      }
    });

    return filtered;
  }, [expenses, searchQuery, categoryFilter, sortBy, dateRange, customStartDate, customEndDate]);

  const uniqueCategories = Array.from(new Set(expenses.map(e => e.category)));

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedExpenses.map(e => e.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} transaction(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleExport = () => {
    const dateFilter = getDateRangeFilter();
    let url = "/api/expenses/export/csv";

    if (dateFilter) {
      const params = new URLSearchParams({
        startDate: dateFilter.start.toISOString(),
        endDate: dateFilter.end.toISOString(),
      });
      url += `?${params.toString()}`;
    }

    window.location.href = url;
    toast({
      title: "Export Started",
      description: "Your CSV file will download shortly",
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">View and manage all your expenses</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search (Ctrl+K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
                data-testid="input-search-transactions"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-sort">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="w-full">
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    data-testid="input-start-date"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    data-testid="input-end-date"
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === filteredAndSortedExpenses.length && filteredAndSortedExpenses.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : `${filteredAndSortedExpenses.length} transactions`}
                </p>
              </div>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  data-testid="button-bulk-delete"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete Selected</span>
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              data-testid="button-export"
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 sm:h-20" />
              ))}
            </div>
          ) : filteredAndSortedExpenses.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {filteredAndSortedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-2 sm:gap-3">
                  <Checkbox
                    checked={selectedIds.has(expense.id)}
                    onCheckedChange={() => handleSelectOne(expense.id)}
                    data-testid={`checkbox-${expense.id}`}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <TransactionCard
                      id={expense.id}
                      merchant={expense.merchant}
                      amount={parseFloat(expense.amount)}
                      category={expense.category}
                      categoryIcon={getCategoryIcon(expense.category)}
                      date={new Date(expense.date)}
                      paymentMethod={expense.paymentMethod}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== "all" || dateRange !== "all"
                  ? "No transactions match your filters"
                  : "No transactions yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
