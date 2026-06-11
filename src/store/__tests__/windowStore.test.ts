import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../windowStore';

describe('windowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWindowStore.setState({
      windows: [],
      globalZ: 1,
    });
  });

  it('opens a window with correct defaults', () => {
    const { openWindow } = useWindowStore.getState();
    openWindow('instances');
    const w = useWindowStore.getState().windows[0];
    expect(w.moduleId).toBe('instances');
    expect(w.isMinimized).toBe(false);
    expect(w.isMaximized).toBe(false);
    expect(w.zIndex).toBe(2); // globalZ increments on open
  });

  it('does not duplicate — focuses existing window instead', () => {
    const { openWindow } = useWindowStore.getState();
    openWindow('instances');
    openWindow('instances');
    expect(useWindowStore.getState().windows.length).toBe(1);
  });

  it('staggers position for multiple windows', () => {
    const { openWindow } = useWindowStore.getState();
    openWindow('instances');
    openWindow('tasks');
    const [a, b] = useWindowStore.getState().windows;
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBeGreaterThan(a.y);
  });

  it('maximizeWindow sets x=0, y=0, full viewport size', () => {
    const { openWindow, maximizeWindow } = useWindowStore.getState();
    openWindow('instances');
    const wBefore = useWindowStore.getState().windows[0];
    maximizeWindow(wBefore.id, 1440, 900);
    const wAfter = useWindowStore.getState().windows[0];
    expect(wAfter.x).toBe(0);
    expect(wAfter.y).toBe(0);
    expect(wAfter.width).toBe(1440);
    expect(wAfter.height).toBe(900 - 56); // 900 - TASKBAR_H
    expect(wAfter._restoreGeometry).toBeDefined();
  });

  it('restoreWindow returns to pre-maximize geometry', () => {
    const { openWindow, maximizeWindow, restoreWindow } = useWindowStore.getState();
    openWindow('instances');
    const wStart = useWindowStore.getState().windows[0];
    const before = { x: wStart.x, y: wStart.y, width: wStart.width, height: wStart.height };
    maximizeWindow(wStart.id, 1440, 900);
    restoreWindow(wStart.id);
    const after = useWindowStore.getState().windows[0];
    expect(after.x).toBe(before.x);
    expect(after.width).toBe(before.width);
    expect(after.isMaximized).toBe(false);
  });

  it('closeWindow removes it from array', () => {
    const { openWindow, closeWindow } = useWindowStore.getState();
    openWindow('tasks');
    const w = useWindowStore.getState().windows[0];
    closeWindow(w.id);
    expect(useWindowStore.getState().windows.length).toBe(0);
  });

  it('focusWindow increments zIndex above all others', () => {
    const { openWindow, focusWindow } = useWindowStore.getState();
    openWindow('instances');
    openWindow('tasks');
    const ids = useWindowStore.getState().windows.map(w => w.id);
    focusWindow(ids[0]);
    const focused = useWindowStore.getState().windows.find(w => w.id === ids[0])!;
    const other   = useWindowStore.getState().windows.find(w => w.id === ids[1])!;
    expect(focused.zIndex).toBeGreaterThan(other.zIndex);
  });
});
