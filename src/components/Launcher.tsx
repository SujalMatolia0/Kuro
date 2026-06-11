import React, { useState, useEffect, useRef } from 'react';
import { useWindowStore, MODULE_META } from '../store/windowStore';
import type { ModuleId } from '../store/windowStore';
import { sfx } from '../lib/sfx';

const PANEL_WIDTH = 320;

export function Launcher({ anchorRef, onClose }: {
  anchorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}) {
  const { openWindow } = useWindowStore();
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && 
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
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
  }, [anchorRef, onClose]);

  const handleOpen = (moduleId: ModuleId) => {
    sfx.play('tick');
    openWindow(moduleId);
    onClose();
  };

  const filtered = (group: ModuleId[]) =>
    query
      ? group.filter(id => MODULE_META[id]?.title.toLowerCase().includes(query.toLowerCase()))
      : group;

  // Calculate position centered above the anchor button
  const rect = anchorRef.current?.getBoundingClientRect();
  const left = rect ? Math.max(12, Math.min(window.innerWidth - PANEL_WIDTH - 12, rect.left + rect.width / 2 - PANEL_WIDTH / 2)) : '50%';
  const bottom = 44 + 12 + 8; // taskbar height + bottom gap + spacing

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom,
        left,
        width: PANEL_WIDTH,
        background: 'rgba(20, 18, 15, 0.96)',
        border: '0.5px solid var(--b2)',
        borderRadius: 14,
        padding: 14,
        boxShadow: '0 16px 48px rgba(0,0,0,0.65), inset 0 0 0 0.5px rgba(255,255,255,0.02)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          autoFocus
          placeholder="Search modules…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg0)',
            border: '0.5px solid var(--b2)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 11,
            color: 'var(--t1)',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            boxSizing: 'border-box',
          }}
        />
        <i 
          className="ti ti-search text-xs" 
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}
        />
      </div>

      {/* Module Lists */}
      <div className="scrollbar-thin" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
        <LauncherGroup
          label="WORKSPACE"
          items={filtered(['instances', 'tasks', 'notes', 'issues', 'role-command-center'])}
          onOpen={handleOpen}
        />
        <LauncherGroup
          label="KNOWLEDGE & LIBRARY"
          items={filtered(['vault', 'snippets', 'knowledge', 'checklists', 'glossary', 'onboarding', 'components', 'api-reference'])}
          onOpen={handleOpen}
        />
        <LauncherGroup
          label="INTELLIGENCE & SYSTEM"
          items={filtered(['permissions', 'errors', 'role-advisor', 'settings', 'audit'])}
          onOpen={handleOpen}
        />
      </div>
    </div>
  );
}

function LauncherGroup({
  label, items, onOpen
}: {
  label: string;
  items: ModuleId[];
  onOpen: (id: ModuleId) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 900, color: 'var(--t3)', letterSpacing: '0.15em', padding: '0 4px', marginBottom: 2 }}>
        {label}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(id => {
          const meta = MODULE_META[id];
          if (!meta) return null;
          return (
            <button
              key={id}
              data-testid={`launcher-item-${id}`}
              onClick={() => onOpen(id)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-t1 hover:text-copper hover:bg-bg3/30 transition-all border border-transparent hover:border-b1 cursor-pointer"
            >
              <i className={`ti ti-${meta.icon} text-sm`} style={{ color: 'var(--t2)', width: 16 }} />
              <span className="flex-1 uppercase tracking-wider">{meta.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
