const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  safeStorage: {
    encrypt: (data) => ipcRenderer.invoke('safe-storage:encrypt', data),
    decrypt: (data) => ipcRenderer.invoke('safe-storage:decrypt', data),
  },
  net: {
    checkStatus: (url) => ipcRenderer.invoke('net:check-status', url),
  },
  shell: {
    openUrl: (url) => ipcRenderer.invoke('shell:open-url', url),
  },
  app: {
    getDataPath: () => ipcRenderer.invoke('app:get-data-path'),
  },
  db: {
    execute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
    resetAll: () => ipcRenderer.invoke('db:reset-all'),
  },
  instance: {
    launchSecure: (instance, credentials) => ipcRenderer.invoke('instance:launch-secure', instance, credentials),
  }
});
