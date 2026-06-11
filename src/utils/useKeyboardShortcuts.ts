import { useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';
import type { ModuleId } from '../store/windowStore';

const MODULE_ORDER: ModuleId[] = [
  'instances',
  'tasks',
  'notes',
  'snippets',
  'vault',
  'knowledge',
  'checklists',
  'errors',
  'permissions',
];

export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], action: 'Open Command Palette', group: 'Navigation' },
  { keys: ['Ctrl', '1-9'], action: 'Jump to module by sidebar position', group: 'Navigation' },
  { keys: ['Ctrl', ','], action: 'Open Settings', group: 'Navigation' },
  { keys: ['Escape'], action: 'Close modal / palette', group: 'General' },
] as const;

export function useKeyboardShortcuts() {
  const openWindow = useWindowStore(s => s.openWindow);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Only allow Escape to bubble
        if (e.key !== 'Escape') return;
      }

      // Ctrl+1 through Ctrl+9 — jump to module
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < MODULE_ORDER.length) {
          openWindow(MODULE_ORDER[idx]);
        }
      }

      // Ctrl+, — open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openWindow('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openWindow]);
}
