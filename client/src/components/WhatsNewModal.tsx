import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Download,
    Trash2,
    Calendar,
    Search,
    Bell,
    Keyboard,
    Lock,
    Edit,
    Sparkles
} from "lucide-react";

const features = [
    {
        icon: Download,
        title: "CSV Export",
        description: "Export your transactions to CSV with date range filtering",
        badge: "New",
    },
    {
        icon: Trash2,
        title: "Bulk Delete",
        description: "Select and delete multiple transactions at once",
        badge: "New",
    },
    {
        icon: Calendar,
        title: "Date Range Filters",
        description: "Filter by today, week, month, or custom date ranges",
        badge: "New",
    },
    {
        icon: Search,
        title: "Advanced Search",
        description: "Search by merchant name or transaction notes",
        badge: "Enhanced",
    },
    {
        icon: Bell,
        title: "Budget Alerts",
        description: "Get notified when approaching or exceeding budgets",
        badge: "New",
    },
    {
        icon: Keyboard,
        title: "Keyboard Shortcuts",
        description: "Navigate faster with keyboard commands (Shift+? to see all)",
        badge: "New",
    },
    {
        icon: Lock,
        title: "User Authentication",
        description: "Secure login and registration system",
        badge: "New",
    },
    {
        icon: Edit,
        title: "Edit Transactions",
        description: "Update transaction details anytime",
        badge: "Enhanced",
    },
];

const APP_VERSION = "2.0.0";

export default function WhatsNewModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem("last-seen-version");
        if (lastSeenVersion !== APP_VERSION) {
            // Show modal after a short delay for better UX
            const timer = setTimeout(() => {
                setOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem("last-seen-version", APP_VERSION);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl">What's New in v{APP_VERSION}</DialogTitle>
                            <DialogDescription>
                                We've added powerful new features to help you track expenses better
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold">{feature.title}</h4>
                                        <Badge
                                            variant={feature.badge === "New" ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {feature.badge}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Keyboard className="h-4 w-4" />
                        Quick Tip: Keyboard Shortcuts
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        Press <kbd className="px-1.5 py-0.5 text-xs bg-background rounded border">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-background rounded border">?</kbd> anytime to see all available keyboard shortcuts.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={handleClose}>
                        Remind Me Later
                    </Button>
                    <Button onClick={handleClose}>
                        Got It, Thanks!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
