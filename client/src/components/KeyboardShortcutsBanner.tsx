import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Keyboard } from "lucide-react";

export default function KeyboardShortcutsBanner() {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem("keyboard-shortcuts-banner-dismissed");
        if (isDismissed) {
            setDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem("keyboard-shortcuts-banner-dismissed", "true");
        setDismissed(true);
    };

    if (dismissed) return null;

    return (
        <Alert className="mb-4 bg-primary/5 border-primary/20">
            <Keyboard className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <span className="font-medium">Keyboard shortcuts available!</span>
                    <span className="text-sm text-muted-foreground ml-2">
                        Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">?</kbd> to see all shortcuts
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="flex-shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </AlertDescription>
        </Alert>
    );
}
