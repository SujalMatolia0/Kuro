import { useEffect, useRef } from 'react';
import { useWindowStore } from '../store/windowStore';
import { useCommandPaletteStore } from './CommandPalette';
import { sfx } from '../lib/sfx';

interface DesktopContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export function DesktopContextMenu({ x, y, onClose }: DesktopContextMenuProps) {
  const openWindow = useWindowStore(s => s.openWindow);
  const openCommandPalette = useCommandPaletteStore(s => s.open);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCommandPalette = () => {
    sfx.play('tick');
    openCommandPalette();
    onClose();
  };

  const handleRefresh = () => {
    sfx.play('tick');
    window.location.reload();
  };

  const handleOpenSettings = () => {
    sfx.play('tick');
    openWindow('settings');
    onClose();
  };

  const handleOpenAudit = () => {
    sfx.play('tick');
    openWindow('audit');
    onClose();
  };

  // Clamp position to viewport
  const menuW = 168;
  const menuH = 148;
  const posX = x + menuW > window.innerWidth  ? window.innerWidth  - menuW - 10 : x;
  const posY = y + menuH > window.innerHeight ? window.innerHeight - menuH - 10 : y;

  const itemClass = 'w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex justify-between items-center cursor-pointer';
  const itemStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--t1)', fontFamily: 'var(--font-sans)' };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: posX,
        top: posY,
        width: menuW,
        background: 'rgba(22, 19, 16, 0.97)',
        border: '0.5px solid var(--b2)',
        borderRadius: 8,
        padding: '4px 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(180,150,100,0.04) inset',
        zIndex: 100000,
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        onClick={handleCommandPalette}
        className={itemClass}
        style={itemStyle}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--copper)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t1)'; }}
      >
        <span>Command Palette</span>
        <span style={{ fontSize: 8, color: 'var(--t3)' }}>⌘K</span>
      </button>
      <button
        onClick={handleRefresh}
        className={itemClass}
        style={itemStyle}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--copper)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t1)'; }}
      >
        Refresh System
      </button>
      <div style={{ height: 0.5, background: 'var(--b1)', margin: '4px 0' }} />
      <button
        onClick={handleOpenSettings}
        className={itemClass}
        style={itemStyle}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--copper)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t1)'; }}
      >
        Settings
      </button>
      <button
        onClick={handleOpenAudit}
        className={itemClass}
        style={itemStyle}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--copper)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t1)'; }}
      >
        Audit Trail
      </button>
    </div>
  );
}
