import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let db;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'kuro_production.sqlite');
  
  try {
    db = new Database(dbPath);
    console.log('Database connected at:', dbPath);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0,
        cloud_id TEXT,
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
        is_synced INTEGER DEFAULT 0,
        cloud_id TEXT,
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
        is_synced INTEGER DEFAULT 0,
        cloud_id TEXT,
        cloud_updated_at INTEGER,
        created_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        title TEXT NOT NULL,
        body TEXT,
        group_name TEXT,
        updated_at INTEGER,
        is_synced INTEGER DEFAULT 0,
        cloud_id TEXT,
        cloud_updated_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        workspace_id TEXT,
        diff_json TEXT, -- Store character-level diffs
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS local_snippets (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        title TEXT NOT NULL,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        platform TEXT NOT NULL,
        tags TEXT, -- Comma separated
        is_synced INTEGER DEFAULT 0,
        cloud_id TEXT,
        cloud_updated_at INTEGER,
        created_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );

      CREATE TABLE IF NOT EXISTS local_vault_files (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        name TEXT NOT NULL,
        content TEXT, -- Preview or summary
        storage_path TEXT, -- Local path if downloaded, or cloud reference
        filetype TEXT,
        platform TEXT,
        description TEXT,
        version_note TEXT,
        is_synced INTEGER DEFAULT 0,
        cloud_id TEXT,
        cloud_updated_at INTEGER,
        created_at INTEGER,
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      );
    `);

    // --- MIGRATIONS (Adding columns to existing tables if they don't exist) ---
    // Note: better-sqlite3 doesn't support 'IF NOT EXISTS' for ADD COLUMN, 
    // so we wrap in try-catch to ignore 'duplicate column' errors.
    const migrations = [
      'ALTER TABLE workspaces ADD COLUMN is_synced INTEGER DEFAULT 0',
      'ALTER TABLE workspaces ADD COLUMN cloud_id TEXT',
      'ALTER TABLE instances ADD COLUMN is_synced INTEGER DEFAULT 0',
      'ALTER TABLE instances ADD COLUMN cloud_id TEXT',
      'ALTER TABLE tasks ADD COLUMN is_synced INTEGER DEFAULT 0',
      'ALTER TABLE tasks ADD COLUMN cloud_id TEXT',
      'ALTER TABLE tasks ADD COLUMN cloud_updated_at INTEGER',
      'ALTER TABLE tasks ADD COLUMN instance_id TEXT',
      'ALTER TABLE notes ADD COLUMN is_synced INTEGER DEFAULT 0',
      'ALTER TABLE notes ADD COLUMN cloud_id TEXT',
      'ALTER TABLE notes ADD COLUMN cloud_updated_at INTEGER',
      'ALTER TABLE notes ADD COLUMN group_name TEXT',
      'ALTER TABLE local_snippets ADD COLUMN type TEXT DEFAULT "snippet"',
    ];

    for (const sql of migrations) {
      try { db.exec(sql); } catch (e) { /* ignore duplicate column errors */ }
    }

    // Create Phase 6 tables (idempotent)
    db.exec(`
      CREATE TABLE IF NOT EXISTS nav_layout (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        layout_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ai_history (
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        query TEXT NOT NULL,
        platform TEXT,
        response TEXT NOT NULL,
        created_at INTEGER
      );
    `);

    console.log('Tables initialized successfully');
  } catch (err) {
    console.error('DATABASE INITIALIZATION ERROR:', err);
  }
}

function createWindow() {
  const iconPath = process.env.NODE_ENV === 'development' 
    ? path.join(__dirname, '../public/logo.png')
    : path.join(__dirname, '../dist/logo.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Kuro',
    icon: iconPath,
    backgroundColor: '#0d1117',
    frame: true,
    autoHideMenuBar: true,   // hides the File/Edit/View menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: process.env.NODE_ENV === 'development', // no devtools in production
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove the default menu entirely and harden in production
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.setMenu(null);
    
    // Disable right-click context menu
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());

    // Disable DevTools shortcuts (Ctrl+Shift+I, F12)
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
        event.preventDefault();
      }
    });
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.focus();
  } else {
    // Use loadFile with relative path — fixes ERR_FILE_NOT_FOUND for assets
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  // Auto-Updater (production only)
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.logger = console;
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.log('Auto-update check skipped:', err.message);
    });
  }

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
