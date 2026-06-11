import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ModuleId =
  | 'instances' | 'tasks' | 'notes'
  | 'vault' | 'snippets' | 'knowledge'
  | 'checklists' | 'glossary' | 'onboarding'
  | 'permissions' | 'errors' | 'components'
  | 'issues' | 'api-reference'
  | 'settings' | 'audit'
  | 'role-advisor'
  | 'role-command-center';

export type WindowAccentGroup = 'infrastructure' | 'knowledge' | 'security' | 'system';

export interface KuroWindowState {
  id: string              // nanoid(8)
  moduleId: ModuleId
  title: string
  accentGroup: WindowAccentGroup
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  // snapshot of pre-maximize geometry for restore
  _restoreGeometry?: { x: number; y: number; width: number; height: number }
}

export const MODULE_META: Record<ModuleId, {
  title: string
  accentGroup: WindowAccentGroup
  defaultWidth: number
  defaultHeight: number
  icon: string            // Tabler icon name
}> = {
  instances:     { title: 'Instance Dashboard', accentGroup: 'infrastructure', defaultWidth: 800, defaultHeight: 580, icon: 'server' },
  tasks:         { title: 'Task Tracker',        accentGroup: 'infrastructure', defaultWidth: 900, defaultHeight: 620, icon: 'layout-kanban' },
  notes:         { title: 'Quick Notes',          accentGroup: 'infrastructure', defaultWidth: 700, defaultHeight: 520, icon: 'notes' },
  vault:         { title: 'File Vault',           accentGroup: 'knowledge',      defaultWidth: 800, defaultHeight: 580, icon: 'archive' },
  snippets:      { title: 'Snippet Library',      accentGroup: 'knowledge',      defaultWidth: 800, defaultHeight: 580, icon: 'code' },
  knowledge:     { title: 'Knowledge Base',       accentGroup: 'knowledge',      defaultWidth: 850, defaultHeight: 600, icon: 'book' },
  checklists:    { title: 'Guided Checklists',    accentGroup: 'knowledge',      defaultWidth: 750, defaultHeight: 580, icon: 'checkbox' },
  glossary:      { title: 'Terminology Glossary', accentGroup: 'knowledge',      defaultWidth: 750, defaultHeight: 540, icon: 'abc' },
  onboarding:    { title: 'Onboarding Guide',     accentGroup: 'knowledge',      defaultWidth: 800, defaultHeight: 580, icon: 'map' },
  permissions:   { title: 'Permission Advisor',   accentGroup: 'security',       defaultWidth: 750, defaultHeight: 580, icon: 'shield' },
  errors:        { title: 'Error Decoder',        accentGroup: 'security',       defaultWidth: 750, defaultHeight: 580, icon: 'alert-triangle' },
  components:    { title: 'Component Registry',   accentGroup: 'knowledge',      defaultWidth: 800, defaultHeight: 580, icon: 'puzzle' },
  issues:        { title: 'Known Issues',         accentGroup: 'infrastructure', defaultWidth: 750, defaultHeight: 580, icon: 'alert-circle' },
  'api-reference': { title: 'API Reference',      accentGroup: 'knowledge',      defaultWidth: 800, defaultHeight: 600, icon: 'terminal' },
  settings:      { title: 'Settings',             accentGroup: 'system',         defaultWidth: 800, defaultHeight: 620, icon: 'settings' },
  audit:         { title: 'Audit Trail',          accentGroup: 'system',         defaultWidth: 850, defaultHeight: 580, icon: 'history' },
  'role-advisor': { title: 'Role Advisor',        accentGroup: 'security',       defaultWidth: 800, defaultHeight: 600, icon: 'users' },
  'role-command-center': { title: 'Command Center', accentGroup: 'infrastructure', defaultWidth: 950, defaultHeight: 650, icon: 'cpu' },
};

interface WindowStore {
  windows: KuroWindowState[]
  globalZ: number         // monotonically increasing, assigned on focus
  pinnedModules: ModuleId[]  // modules pinned to taskbar (persist without open window)
  openWindow: (moduleId: ModuleId) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string, viewportW: number, viewportH: number) => void
  restoreWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, width: number, height: number) => void
  pinModule: (moduleId: ModuleId) => void
  unpinModule: (moduleId: ModuleId) => void
}

const loadPinnedModules = (): ModuleId[] => {
  try {
    const saved = localStorage.getItem('kuro_pinned_modules');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  globalZ: 1,
  pinnedModules: loadPinnedModules(),

  openWindow: (moduleId) => set((state) => {
    // Only one instance of each module allowed
    const existing = state.windows.find(w => w.moduleId === moduleId);
    if (existing) {
      // If minimized, restore it; otherwise just focus
      if (existing.isMinimized) {
        return {
          windows: state.windows.map(w =>
            w.id === existing.id ? { ...w, isMinimized: false, zIndex: state.globalZ + 1 } : w
          ),
          globalZ: state.globalZ + 1
        };
      }
      return {
        windows: state.windows.map(w =>
          w.id === existing.id ? { ...w, zIndex: state.globalZ + 1 } : w
        ),
        globalZ: state.globalZ + 1
      };
    }

    const meta = MODULE_META[moduleId];
    const openCount = state.windows.filter(w => !w.isMinimized).length;
    const stagger = Math.min(openCount, 6) * 24;  // max stagger 144px

    const newWindow: KuroWindowState = {
      id: nanoid(8),
      moduleId,
      title: meta.title,
      accentGroup: meta.accentGroup,
      x: 80 + stagger,
      y: 60 + stagger,
      width: meta.defaultWidth,
      height: meta.defaultHeight,
      isMinimized: false,
      isMaximized: false,
      zIndex: state.globalZ + 1,
    };

    return { windows: [...state.windows, newWindow], globalZ: state.globalZ + 1 };
  }),

  closeWindow: (id) => set((state) => ({
    windows: state.windows.filter(w => w.id !== id)
  })),

  focusWindow: (id) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, isMinimized: false, zIndex: state.globalZ + 1 } : w
    ),
    globalZ: state.globalZ + 1
  })),

  minimizeWindow: (id) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    )
  })),

  maximizeWindow: (id, viewportW, viewportH) => set((state) => ({
    windows: state.windows.map(w => {
      if (w.id === id) {
        const TASKBAR_H = 56;
        return {
          ...w,
          isMaximized: true,
          _restoreGeometry: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0,
          y: 0,
          width: viewportW,
          height: viewportH - TASKBAR_H,
        };
      }
      return w;
    })
  })),

  restoreWindow: (id) => set((state) => ({
    windows: state.windows.map(w => {
      if (w.id === id && w._restoreGeometry) {
        return {
          ...w,
          isMaximized: false,
          x: w._restoreGeometry.x,
          y: w._restoreGeometry.y,
          width: w._restoreGeometry.width,
          height: w._restoreGeometry.height,
        };
      }
      return w;
    })
  })),

  moveWindow: (id, x, y) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, x, y } : w
    )
  })),

  resizeWindow: (id, width, height) => set((state) => ({
    windows: state.windows.map(w =>
      w.id === id ? { ...w, width, height } : w
    )
  })),

  pinModule: (moduleId) => set((state) => {
    if (state.pinnedModules.includes(moduleId)) return state;
    const next = [...state.pinnedModules, moduleId];
    try { localStorage.setItem('kuro_pinned_modules', JSON.stringify(next)); } catch {}
    return { pinnedModules: next };
  }),

  unpinModule: (moduleId) => set((state) => {
    const next = state.pinnedModules.filter(id => id !== moduleId);
    try { localStorage.setItem('kuro_pinned_modules', JSON.stringify(next)); } catch {}
    return { pinnedModules: next };
  }),
}));
