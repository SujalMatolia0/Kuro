import { useState, useRef, useEffect } from 'react';
import { useWindowStore, MODULE_META } from '../store/windowStore';
import { Launcher } from './Launcher';
import { useAppStore } from '../store';
import { sfx } from '../lib/sfx';

export function Taskbar() {
  const { windows, globalZ, focusWindow, minimizeWindow, openWindow, pinnedModules, unpinModule } = useWindowStore();
  const { settings, updateSettings } = useAppStore();
  
  const [showLauncher, setShowLauncher] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  
  const launcherAnchorRef = useRef<HTMLDivElement>(null);

  // Poll DB status (generic check — tries electron db or marks as unavailable)
  useEffect(() => {
    const check = async () => {
      try {
        if (window.electron && window.electron.db) {
          await window.electron.db.execute('SELECT 1', []);
          setDbOk(true);
        } else {
          // No electron bridge — dev mode, mark as n/a (null)
          setDbOk(null);
        }
      } catch {
        setDbOk(false);
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    sfx.play('tick');
    const enabled = localStorage.getItem('kuro_sound') !== 'false';
    localStorage.setItem('kuro_sound', enabled ? 'false' : 'true');
    // force re-render
    updateSettings({});
  };

  const handleToggleTheme = () => {
    sfx.play('tick');
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
  };

  const isSoundEnabled = localStorage.getItem('kuro_sound') !== 'false';

  return (
    <>
      <div
        data-testid="taskbar"
        style={{
          position: 'fixed',
          bottom: 'var(--taskbar-bottom)',      // 12px
          left: '50%',
          transform: 'translateX(-50%)',
          height: 'var(--taskbar-height)',      // 44px
          background: 'rgba(22, 19, 16, 0.94)',
          border: '0.5px solid var(--b2)',
          borderRadius: 'var(--pill-radius)',   // 22px
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(180,150,100,0.06)',
          minWidth: 320,
          zIndex: 9999,
        }}
      >
        {/* Launcher Button (K) */}
        <div
          ref={launcherAnchorRef}
          data-testid="launcher-btn"
          title="All modules"
          onClick={() => {
            sfx.play('tick');
            setShowLauncher(!showLauncher);
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: showLauncher ? 'rgba(181, 101, 29, 0.25)' : 'rgba(180,150,100,0.08)',
            border: '0.5px solid var(--b1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: 900,
            fontSize: 13,
            color: 'var(--copper)',
            textShadow: '0 0 8px rgba(181,101,29,0.3)',
            transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '')}
        >
          K
        </div>

        {/* Separator */}
        <div style={{ width: 0.5, height: 20, background: 'var(--b1)', margin: '0 4px' }} />

        {/* Pinned/Open Window Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 60, justifyContent: 'center' }}>
          {/* Pinned modules that have NO open window — show as launch shortcuts */}
          {pinnedModules
            .filter(moduleId => !windows.some(w => w.moduleId === moduleId))
            .map(moduleId => {
              const meta = MODULE_META[moduleId];
              return (
                <div
                  key={`pinned-${moduleId}`}
                  title={`${meta?.title} (pinned)`}
                  onClick={() => {
                    sfx.play('windowOpen');
                    openWindow(moduleId);
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    sfx.play('tick');
                    unpinModule(moduleId);
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    background: 'transparent',
                    border: '0.5px solid var(--b1)',
                    borderStyle: 'dashed',
                    transition: 'background 0.15s, border-color 0.15s',
                    flexShrink: 0,
                    opacity: 0.7,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(181, 101, 29, 0.08)';
                    (e.currentTarget as HTMLDivElement).style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    (e.currentTarget as HTMLDivElement).style.opacity = '0.7';
                  }}
                >
                  <i
                    className={`ti ti-${meta?.icon || 'app'}`}
                    style={{ fontSize: 15, color: 'var(--t3)' }}
                  />
                  {/* Pin dot indicator */}
                  <div style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: 'var(--copper)',
                    position: 'absolute',
                    bottom: 3,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    opacity: 0.6,
                  }} />
                </div>
              );
            })
          }

          {/* Separator between pinned-closed and open windows */}
          {pinnedModules.filter(id => !windows.some(w => w.moduleId === id)).length > 0 && windows.length > 0 && (
            <div style={{ width: 0.5, height: 18, background: 'var(--b1)', margin: '0 2px' }} />
          )}

          {/* Open windows */}
          {windows.map((win) => {
            const meta = MODULE_META[win.moduleId];
            const isFocused = !win.isMinimized && win.zIndex === globalZ;
            const isPinned = pinnedModules.includes(win.moduleId);
            const dotColor = win.isMinimized ? 'var(--t3)'
              : isFocused ? 'var(--copper)'
              : 'var(--jade)';

            const handleIconClick = () => {
              if (win.isMinimized) {
                sfx.play('tick');
                focusWindow(win.id);
              } else if (isFocused) {
                sfx.play('minimize');
                minimizeWindow(win.id);
              } else {
                sfx.play('tick');
                focusWindow(win.id);
              }
            };

            return (
              <div
                key={win.id}
                data-testid={`taskbar-icon-${win.moduleId}`}
                title={win.title}
                onClick={handleIconClick}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  background: isFocused ? 'rgba(181, 101, 29, 0.15)' : 'transparent',
                  border: isFocused ? '0.5px solid var(--b2)' : '0.5px solid transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                  flexShrink: 0,
                }}
              >
                <i
                  className={`ti ti-${meta?.icon || 'app'}`}
                  style={{ fontSize: 16, color: isFocused ? 'var(--copper)' : 'var(--t2)' }}
                />
                <div style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: dotColor,
                  position: 'absolute',
                  bottom: 3,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }} />
                {/* Pin indicator — small copper tick at top-right corner */}
                {isPinned && (
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--copper)',
                    boxShadow: '0 0 3px var(--copper)',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ width: 0.5, height: 20, background: 'var(--b1)', margin: '0 4px' }} />

        {/* System Area (Theme, Volume, Clock) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Theme Switcher */}
          <button
            onClick={handleToggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--t2)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            title="Toggle theme"
          >
            <i className={`ti ti-${settings.theme === 'light' ? 'moon' : 'sun'}`} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSoundEnabled ? 'var(--copper)' : 'var(--t3)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            title={isSoundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            <i className={`ti ti-${isSoundEnabled ? 'volume' : 'volume-off'}`} />
          </button>

          {/* Database Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'default',
              position: 'relative',
              padding: '2px',
            }}
            title={dbOk === null ? 'Database: Dev Mode (no Electron bridge)' : `Database: ${dbOk ? 'CONNECTED' : 'DISCONNECTED'}`}
          >
            <i 
              className="ti ti-database" 
              style={{
                fontSize: 13,
                color: dbOk === null ? 'var(--t3)'
                  : dbOk ? 'var(--jade2)' 
                  : 'var(--red)',
                filter: dbOk === null ? 'none'
                  : dbOk ? 'drop-shadow(0 0 4px var(--jade2))'
                  : 'drop-shadow(0 0 4px var(--red))',
                transition: 'color 0.3s, filter 0.3s',
              }}
            />
            {/* Tiny indicator dot */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 3.5,
                height: 3.5,
                borderRadius: '50%',
                background: dbOk === null ? 'var(--t3)'
                  : dbOk ? 'var(--jade2)' 
                  : 'var(--red)',
                boxShadow: dbOk === null ? 'none'
                  : dbOk ? '0 0 3px var(--jade2)'
                  : '0 0 3px var(--red)',
              }}
            />
          </div>

          {/* Clock */}
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t1)', minWidth: 44, textAlign: 'center', cursor: 'default' }}>
            {timeStr}
          </span>
        </div>
      </div>

      {/* Start Menu / Launcher */}
      {showLauncher && (
        <Launcher
          anchorRef={launcherAnchorRef}
          onClose={() => setShowLauncher(false)}
        />
      )}
    </>
  );
}
