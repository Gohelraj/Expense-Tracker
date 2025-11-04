import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";

export default function CategoryManager() {
    const [showDialog, setShowDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        icon: "",
        color: "#3b82f6",
        keywords: "",
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    keywords: JSON.stringify(data.keywords.split(",").map(k => k.trim()).filter(Boolean)),
                    isActive: "true",
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create category");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            toast({ title: "Category created successfully" });
            resetForm();
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
            const response = await fetch(`/api/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    keywords: JSON.stringify(data.keywords.split(",").map(k => k.trim()).filter(Boolean)),
                }),
            });
            if (!response.ok) throw new Error("Failed to update category");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            toast({ title: "Category updated successfully" });
            resetForm();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete category");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            toast({ title: "Category deleted successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({ name: "", icon: "", color: "#3b82f6", keywords: "" });
        setEditingCategory(null);
        setShowDialog(false);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
            keywords: JSON.parse(category.keywords).join(", "),
        });
        setShowDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Categories</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage expense categories and their keywords for automatic categorization
                    </p>
                </div>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
                </div>
            ) : categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No categories yet. Add your first category.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Card key={category.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                                            style={{ backgroundColor: category.color }}
                                        >
                                            {category.icon}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{category.name}</CardTitle>
                                            <Badge variant={category.isActive === "true" ? "default" : "secondary"} className="mt-1">
                                                {category.isActive === "true" ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this category?")) {
                                                    deleteMutation.mutate(category.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Keywords:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {JSON.parse(category.keywords).map((keyword: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? "Update category details" : "Create a new expense category"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Food & Dining"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon (Emoji)</Label>
                            <Input
                                id="icon"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="🍔"
                                maxLength={2}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-20 h-10"
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="#3b82f6"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                            <Input
                                id="keywords"
                                value={formData.keywords}
                                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                placeholder="swiggy, zomato, restaurant, food"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                These keywords help automatically categorize expenses
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingCategory ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
