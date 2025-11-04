import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BankPattern } from "@shared/schema";

export default function BankPatternsManager() {
    const [showDialog, setShowDialog] = useState(false);
    const [editingBank, setEditingBank] = useState<BankPattern | null>(null);
    const [formData, setFormData] = useState({
        bankName: "",
        domain: "",
        amountPatterns: "",
        merchantPatterns: "",
        datePatterns: "",
        paymentMethodPatterns: "",
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: banks = [], isLoading } = useQuery<BankPattern[]>({
        queryKey: ["/api/bank-patterns"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await fetch("/api/bank-patterns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    amountPatterns: JSON.stringify(data.amountPatterns.split("\n").filter(Boolean)),
                    merchantPatterns: JSON.stringify(data.merchantPatterns.split("\n").filter(Boolean)),
                    datePatterns: JSON.stringify(data.datePatterns.split("\n").filter(Boolean)),
                    paymentMethodPatterns: JSON.stringify(data.paymentMethodPatterns.split("\n").filter(Boolean)),
                    isActive: "true",
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create bank pattern");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bank-patterns"] });
            toast({ title: "Bank pattern created successfully" });
            resetForm();
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
            const response = await fetch(`/api/bank-patterns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    amountPatterns: JSON.stringify(data.amountPatterns.split("\n").filter(Boolean)),
                    merchantPatterns: JSON.stringify(data.merchantPatterns.split("\n").filter(Boolean)),
                    datePatterns: JSON.stringify(data.datePatterns.split("\n").filter(Boolean)),
                    paymentMethodPatterns: JSON.stringify(data.paymentMethodPatterns.split("\n").filter(Boolean)),
                }),
            });
            if (!response.ok) throw new Error("Failed to update bank pattern");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bank-patterns"] });
            toast({ title: "Bank pattern updated successfully" });
            resetForm();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update bank pattern", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/bank-patterns/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete bank pattern");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bank-patterns"] });
            toast({ title: "Bank pattern deleted successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete bank pattern", variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            bankName: "",
            domain: "",
            amountPatterns: "",
            merchantPatterns: "",
            datePatterns: "",
            paymentMethodPatterns: "",
        });
        setEditingBank(null);
        setShowDialog(false);
    };

    const handleEdit = (bank: BankPattern) => {
        setEditingBank(bank);
        setFormData({
            bankName: bank.bankName,
            domain: bank.domain,
            amountPatterns: JSON.parse(bank.amountPatterns).join("\n"),
            merchantPatterns: JSON.parse(bank.merchantPatterns).join("\n"),
            datePatterns: JSON.parse(bank.datePatterns).join("\n"),
            paymentMethodPatterns: JSON.parse(bank.paymentMethodPatterns).join("\n"),
        });
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBank) {
            updateMutation.mutate({ id: editingBank.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Bank Patterns</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure email patterns for automatic transaction detection from Indian banks
                    </p>
                </div>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            ) : banks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No bank patterns configured. Add your first bank.</p>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="single" collapsible className="space-y-4">
                    {banks.map((bank) => (
                        <AccordionItem key={bank.id} value={bank.id} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <p className="font-semibold">{bank.bankName}</p>
                                            <p className="text-sm text-muted-foreground">{bank.domain}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={bank.isActive === "true" ? "default" : "secondary"}>
                                            {bank.isActive === "true" ? "Active" : "Inactive"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(bank);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Are you sure you want to delete this bank pattern?")) {
                                                    deleteMutation.mutate(bank.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Amount Patterns:</p>
                                    <div className="bg-muted p-3 rounded-md">
                                        <code className="text-xs whitespace-pre-wrap break-all">
                                            {JSON.parse(bank.amountPatterns).join("\n")}
                                        </code>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Merchant Patterns:</p>
                                    <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                                        <code className="text-xs whitespace-pre-wrap break-all">
                                            {JSON.parse(bank.merchantPatterns).join("\n")}
                                        </code>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Date Patterns:</p>
                                    <div className="bg-muted p-3 rounded-md">
                                        <code className="text-xs whitespace-pre-wrap break-all">
                                            {JSON.parse(bank.datePatterns).join("\n")}
                                        </code>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Payment Method Patterns:</p>
                                    <div className="bg-muted p-3 rounded-md">
                                        <code className="text-xs whitespace-pre-wrap break-all">
                                            {JSON.parse(bank.paymentMethodPatterns).join("\n")}
                                        </code>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingBank ? "Edit Bank Pattern" : "Add Bank Pattern"}</DialogTitle>
                        <DialogDescription>
                            {editingBank ? "Update bank pattern details" : "Configure patterns for email transaction detection"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input
                                    id="bankName"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    placeholder="e.g., HDFC Bank"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="domain">Email Domain</Label>
                                <Input
                                    id="domain"
                                    value={formData.domain}
                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                    placeholder="e.g., hdfcbank"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amountPatterns">Amount Patterns (one regex per line)</Label>
                            <Textarea
                                id="amountPatterns"
                                value={formData.amountPatterns}
                                onChange={(e) => setFormData({ ...formData, amountPatterns: e.target.value })}
                                placeholder="/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i"
                                rows={3}
                                className="font-mono text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="merchantPatterns">Merchant Patterns (one regex per line)</Label>
                            <Textarea
                                id="merchantPatterns"
                                value={formData.merchantPatterns}
                                onChange={(e) => setFormData({ ...formData, merchantPatterns: e.target.value })}
                                placeholder="/Merchant\s+Name[:\s]*([A-Za-z][A-Za-z0-9\s&'.-]{2,30})(?:\s|$)/i"
                                rows={5}
                                className="font-mono text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="datePatterns">Date Patterns (one regex per line)</Label>
                            <Textarea
                                id="datePatterns"
                                value={formData.datePatterns}
                                onChange={(e) => setFormData({ ...formData, datePatterns: e.target.value })}
                                placeholder="/(?:on|dated?|transaction date)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i"
                                rows={3}
                                className="font-mono text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentMethodPatterns">Payment Method Patterns (one regex per line)</Label>
                            <Textarea
                                id="paymentMethodPatterns"
                                value={formData.paymentMethodPatterns}
                                onChange={(e) => setFormData({ ...formData, paymentMethodPatterns: e.target.value })}
                                placeholder="/(?:using|via|through|card)\s+(credit card|debit card|upi|net banking|wallet)/i"
                                rows={3}
                                className="font-mono text-sm"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingBank ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
