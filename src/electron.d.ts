// Global Electron IPC type declarations for use in the renderer process

interface ElectronDB {
  execute: (sql: string, params?: any[]) => Promise<any[]>;
  resetAll: () => Promise<void>;
}

interface ElectronNet {
  checkStatus: (url: string) => Promise<boolean>;
}

interface ElectronShell {
  openUrl: (url: string) => void;
}

interface ElectronSafeStorage {
  encrypt: (data: string) => Promise<string>;
  decrypt: (data: string) => Promise<string>;
}

interface ElectronApp {
  getDataPath: () => Promise<string>;
}

interface ElectronInstance {
  launchSecure: (instance: any, credentials: any) => Promise<void>;
}

interface Window {
  electron: {
    db: ElectronDB;
    net: ElectronNet;
    shell: ElectronShell;
    safeStorage: ElectronSafeStorage;
    app: ElectronApp;
    instance: ElectronInstance;
  };
}
