import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let db;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dev_companion_production.sqlite');
  
  try {
    db = new Database(dbPath);
    console.log('Database connected at:', dbPath);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS instances (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        platform TEXT NOT NULL,
        type TEXT NOT NULL,
        expiry_date INTEGER,
        notes TEXT,
        created_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );

      CREATE TABLE IF NOT EXISTS instance_creds (
        id TEXT PRIMARY KEY,
        instance_id TEXT,
        encrypted_blob TEXT NOT NULL,
        FOREIGN KEY(instance_id) REFERENCES instances(id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        position INTEGER,
        created_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        title TEXT NOT NULL,
        body TEXT,
        updated_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );
    `);
    console.log('Tables initialized successfully');
  } catch (err) {
    console.error('DATABASE INITIALIZATION ERROR:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

ipcMain.handle('safe-storage:encrypt', (_, data) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this platform');
  }
  return safeStorage.encryptString(data).toString('base64');
});

ipcMain.handle('safe-storage:decrypt', (_, encryptedData) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this platform');
  }
  const buffer = Buffer.from(encryptedData, 'base64');
  return safeStorage.decryptString(buffer);
});

ipcMain.handle('shell:open-url', (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('app:get-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('db:execute', (_, sql, params = []) => {
  try {
    console.log(`DB EXECUTE: ${sql}`, params);
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const results = stmt.all(...params);
      console.log(`DB RESULTS (${results.length} rows)`);
      return results;
    } else {
      const info = stmt.run(...params);
      console.log(`DB CHANGE: ${info.changes} rows updated`);
      return info;
    }
  } catch (err) {
    console.error('DATABASE EXECUTION ERROR:', err, 'SQL:', sql, 'Params:', params);
    throw err;
  }
});

// --- Instance Launch Handlers Removed in favor of Option 1 (System Browser) ---

ipcMain.handle('db:reset-all', () => {
  try {
    const tables = ['workspaces', 'instances', 'instance_creds', 'tasks', 'notes'];
    db.transaction(() => {
      for (const table of tables) {
        db.prepare(`DELETE FROM ${table}`).run();
      }
    })();
    console.log('Database cleared successfully');
    return true;
  } catch (err) {
    console.error('DATABASE RESET ERROR:', err);
    throw err;
  }
});

ipcMain.handle('net:check-status', async (_, url) => {
  try {
    const { net } = await import('electron');
    return new Promise((resolve) => {
      console.log(`Checking status for: ${url}`);
      const request = net.request({
        method: 'GET',
        url: url,
        // We follow redirects because reaching the login page means the instance is UP
      });
      
      const timeoutId = setTimeout(() => {
        request.abort();
        console.log(`Status check TIMEOUT for: ${url}`);
        resolve(false);
      }, 8000);

      request.on('response', (response) => {
        clearTimeout(timeoutId);
        console.log(`Status check SUCCESS for: ${url} (Status: ${response.statusCode})`);
        // Any response from the server (even 401/403) means the instance is reachable
        // Most Oracle/Salesforce instances will redirect to login (302 -> 200)
        resolve(response.statusCode >= 200 && response.statusCode < 500);
        request.abort(); // We don't need the body
      });
      
      request.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error(`Status check ERROR for: ${url}`, error.message);
        resolve(false);
      });

      request.end();
    });
  } catch (e) {
    console.error(`Status check CRITICAL ERROR:`, e);
    return false;
  }
});
