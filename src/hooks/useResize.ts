import { useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';

export function useResize(windowId: string): React.MouseEventHandler<HTMLDivElement> {
  const resizeWindow = useWindowStore(s => s.resizeWindow);

  return useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const el = (e.currentTarget as HTMLDivElement).closest('[data-window]') as HTMLElement;
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.offsetWidth;
    const startH = el.offsetHeight;

    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(startW + ev.clientX - startX, 320);
      const newH = Math.max(startH + ev.clientY - startY, 240);
      resizeWindow(windowId, newW, newH);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [windowId, resizeWindow]);
}
