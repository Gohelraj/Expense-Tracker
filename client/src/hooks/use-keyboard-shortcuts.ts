import { useEffect } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    callback: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
                const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
                const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    event.preventDefault();
                    shortcut.callback();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

// Global keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
    ADD_EXPENSE: { key: 'n', ctrl: true, description: 'Add new expense' },
    SEARCH: { key: 'k', ctrl: true, description: 'Focus search' },
    EXPORT: { key: 'e', ctrl: true, shift: true, description: 'Export data' },
    DELETE: { key: 'Delete', description: 'Delete selected' },
    SELECT_ALL: { key: 'a', ctrl: true, description: 'Select all' },
    ESCAPE: { key: 'Escape', description: 'Clear selection / Close modal' },
};
