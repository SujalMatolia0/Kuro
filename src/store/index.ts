import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'member';
  teamId: string;
}

interface Workspace {
  id: string;
  name: string;
  color: string;
}

interface AppState {
  // Auth & Security
  user: User | null;
  isUnlocked: boolean; // Once per session PIN unlock
  setUser: (user: User | null) => void;
  setUnlocked: (unlocked: boolean) => void;

  // Workspace
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;

  // Nav — removed: activeModule was unused in OS shell (windows managed by windowStore)

  // Settings
  settings: {
    preferredBrowser: string;
    theme: 'dark' | 'light';
    aiProvider: string;
    pinHash?: string; 
    isOnboarded?: boolean;
    openaiKey?: string;
    anthropicKey?: string;
    groqKey?: string;
    useCanvasLayout?: boolean;
  };
  profile: {
    name: string;
    email: string;
    focus: 'fusion' | 'salesforce' | 'both';
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  updateProfile: (profile: Partial<AppState['profile']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isUnlocked: false,
      setUser: (user) => set({ user }),
      setUnlocked: (isUnlocked) => set({ isUnlocked }),

      activeWorkspace: null,
      workspaces: [],
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),

      settings: {
        preferredBrowser: 'Default System Browser',
        theme: 'dark',
        aiProvider: 'groq',
        isOnboarded: false,
      },
      profile: {
        name: '',
        email: '',
        focus: 'both',
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      updateProfile: (newProfile) => set((state) => ({
        profile: { ...state.profile, ...newProfile }
      })),
    }),
    {
      name: 'kuro-storage',
      partialize: (state) => ({
        settings: state.settings,
        profile: state.profile,
        activeWorkspace: state.activeWorkspace,
        workspaces: state.workspaces,
      }),
    }
  )
);

export { useWindowStore } from './windowStore';
export type { KuroWindowState, ModuleId, WindowAccentGroup } from './windowStore';
