
import { useWindowStore } from '../store/windowStore';
import { DesktopCanvas } from './DesktopCanvas';
import KuroWindow from './KuroWindow';
import { Taskbar } from './Taskbar';
import CommandPalette from './CommandPalette';

export function Shell() {
  const windows = useWindowStore(s => s.windows);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg0)',
        overflow: 'hidden',
      }}
    >
      {/* Desktop canvas — contains launch grid and active windows */}
      <DesktopCanvas>
        {windows.map(win => (
          <KuroWindow key={win.id} win={win} />
        ))}
      </DesktopCanvas>

      {/* Floating centered taskbar */}
      <Taskbar />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
