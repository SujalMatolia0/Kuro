import { useState } from 'react';
import { DesktopContextMenu } from './DesktopContextMenu';

interface DesktopCanvasProps {
  children: React.ReactNode;
}

export function DesktopCanvas({ children }: DesktopCanvasProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only trigger on the canvas itself, not on windows
    if ((e.target as HTMLElement).closest('[data-window]')) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    // If clicking on the canvas directly, dismiss the context menu
    if (e.target === e.currentTarget) {
      setCtxMenu(null);
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      className="absolute inset-0 select-none overflow-hidden"
      style={{ bottom: 'var(--taskbar-height)' }}
    >
      {/* Renders all open windows */}
      {children}

      {/* Context Menu */}
      {ctxMenu && (
        <DesktopContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
