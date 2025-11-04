import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface Shortcut {
    keys: string[];
    description: string;
}

const shortcuts: Shortcut[] = [
    { keys: ["Ctrl", "N"], description: "Add new expense" },
    { keys: ["Ctrl", "K"], description: "Focus search" },
    { keys: ["Ctrl", "A"], description: "Select all transactions" },
    { keys: ["Ctrl", "Shift", "E"], description: "Export to CSV" },
    { keys: ["Delete"], description: "Delete selected transactions" },
    { keys: ["Escape"], description: "Clear selection / Close modal" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
];

export default function KeyboardShortcutsHelp() {
    const [open, setOpen] = useState(false);

    useKeyboardShortcuts([
        {
            key: "?",
            shift: true,
            callback: () => setOpen(true),
            description: "Show keyboard shortcuts",
        },
    ]);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title="Keyboard Shortcuts (Shift+?)"
            >
                <Keyboard className="h-5 w-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Keyboard Shortcuts</DialogTitle>
                        <DialogDescription>
                            Use these shortcuts to navigate faster
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {shortcut.description}
                                </span>
                                <div className="flex gap-1">
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <kbd
                                            key={keyIndex}
                                            className="px-2 py-1 text-xs font-semibold bg-muted rounded border"
                                        >
                                            {key}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-muted-foreground text-center pt-4">
                        <p>Press <kbd className="px-1 py-0.5 bg-muted rounded">Escape</kbd> to close this dialog</p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
