
import { useWindowStore } from '../store/windowStore';
import type { KuroWindowState, WindowAccentGroup } from '../store/windowStore';
import { useDrag } from '../hooks/useDrag';
import { useResize } from '../hooks/useResize';
import { WindowButton } from './WindowButton';
import { ModuleRouter } from './ModuleRouter';
import { sfx } from '../lib/sfx';

// Accent color map based on Design Tokens
const ACCENT_COLORS: Record<WindowAccentGroup, string> = {
  infrastructure: 'var(--copper)',
  knowledge:      'var(--jade)',
  security:       '#7B61FF', // violet
  system:         'var(--t3)',
};

export default function KuroWindow({ win }: { win: KuroWindowState }) {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, pinnedModules, pinModule, unpinModule } = useWindowStore();
  const handleDrag   = useDrag(win.id, win.isMaximized);
  const handleResize = useResize(win.id);
  const accent = ACCENT_COLORS[win.accentGroup];
  const isPinned = pinnedModules.includes(win.moduleId);

  if (win.isMinimized) return null;

  return (
    <div
      data-window
      data-window-id={win.id}
      onMouseDown={() => focusWindow(win.id)}
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        borderRadius: win.isMaximized ? 0 : 'var(--window-radius)',
        background: 'var(--bg2)',
        border: '0.5px solid var(--b2)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(180,150,100,0.06) inset',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: win.isMaximized ? 'all 160ms ease' : 'none',
      }}
    >
      {/* 1px accent line at top */}
      <div style={{ height: 1.5, background: accent, flexShrink: 0 }} />

      {/* Titlebar — drag target */}
      <div
        onMouseDown={handleDrag}
        onDoubleClick={() => {
          sfx.play(win.isMaximized ? 'minimize' : 'windowOpen');
          if (win.isMaximized) {
            restoreWindow(win.id);
          } else {
            maximizeWindow(win.id, window.innerWidth, window.innerHeight);
          }
        }}
        style={{
          height: 32,
          flexShrink: 0,
          background: 'var(--bg1)',
          borderBottom: '0.5px solid var(--b1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 6,
          cursor: 'default',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <WindowButton variant="close" onClick={() => { sfx.play('windowClose'); closeWindow(win.id); }} />
        <WindowButton variant="min" onClick={() => { sfx.play('minimize'); minimizeWindow(win.id); }} />
        <WindowButton variant="max" onClick={() => {
          sfx.play('windowOpen');
          if (win.isMaximized) {
            restoreWindow(win.id);
          } else {
            maximizeWindow(win.id, window.innerWidth, window.innerHeight);
          }
        }} />
        
        {/* Flex spacer — pushes pin button to the right */}
        <div style={{ flex: 1 }} />
        
        {/* Absolutely centered title — unaffected by variable left/right control widths */}
        <span style={{
          position: 'absolute',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--t2)',
          pointerEvents: 'none',
        }}>
          {win.title}
        </span>

        {/* Pin to Taskbar Button */}
        <button
          title={isPinned ? 'Unpin from Taskbar' : 'Pin to Taskbar'}
          onMouseDown={e => e.stopPropagation()}
          onClick={() => {
            sfx.play('tick');
            if (isPinned) {
              unpinModule(win.moduleId);
            } else {
              pinModule(win.moduleId);
            }
          }}
          className={`bg-transparent border-none cursor-pointer px-1 py-0.5 rounded flex items-center justify-center shrink-0 transition-all duration-150 hover:scale-[1.15] ${
            isPinned 
              ? 'text-copper drop-shadow-[0_0_4px_var(--copper)] hover:text-copper2' 
              : 'text-t3 hover:text-t2'
          }`}
        >
          <i
            className={`ti ti-pin${isPinned ? '-filled' : ''}`}
            style={{ fontSize: 11 }}
          />
        </button>
      </div>

      {/* Content — renders the actual module */}
      <div data-window-content className="@container" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <ModuleRouter moduleId={win.moduleId} />
      </div>

      {/* Resize handle */}
      {!win.isMaximized && (
        <div
          onMouseDown={handleResize}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 12,
            height: 12,
            cursor: 'se-resize',
            zIndex: 100,
            background: 'linear-gradient(135deg, transparent 50%, var(--b3) 50%)',
            borderBottomRightRadius: 'var(--window-radius)',
          }}
        />
      )}
    </div>
  );
}
