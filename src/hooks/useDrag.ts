import { useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';

export function useDrag(
  windowId: string,
  isMaximized: boolean
): React.MouseEventHandler<HTMLDivElement> {
  const moveWindow = useWindowStore(s => s.moveWindow);
  const focusWindow = useWindowStore(s => s.focusWindow);

  return useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    focusWindow(windowId);

    const startX = e.clientX;
    const startY = e.clientY;
    const el = (e.currentTarget as HTMLDivElement).closest('[data-window]') as HTMLElement;
    if (!el) return;
    
    const startLeft = parseInt(el.style.left) || 0;
    const startTop  = parseInt(el.style.top)  || 0;

    // Keep in sync with --taskbar-height (44px) + --taskbar-bottom (12px) = 56px
    const TASKBAR_CLEARANCE = 56;

    const onMove = (ev: MouseEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ww = el.offsetWidth;
      const wh = el.offsetHeight;
      const newX = Math.min(Math.max(startLeft + ev.clientX - startX, 0), vw - ww);
      const newY = Math.min(Math.max(startTop  + ev.clientY - startY, 0), vh - wh - TASKBAR_CLEARANCE);
      moveWindow(windowId, newX, newY);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [windowId, isMaximized, moveWindow, focusWindow]);
}
