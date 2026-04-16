/**
 * Export/Import Backup Utility
 * Exports all local SQLite data as a JSON file, and can import it back.
 */

const TABLES = [
  'workspaces',
  'instances',
  'instance_creds',
  'tasks',
  'notes',
  'audit_logs',
  'local_snippets',
  'local_vault_files',
  'nav_layout',
  'settings',
];

export interface BackupData {
  version: string;
  exportedAt: string;
  appName: string;
  tables: Record<string, any[]>;
}

export async function exportBackup(): Promise<void> {
  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'Dev Companion',
    tables: {},
  };

  for (const table of TABLES) {
    try {
      const rows = await window.electron.db.execute(`SELECT * FROM ${table}`);
      backup.tables[table] = rows;
    } catch (e) {
      console.warn(`[Backup] Skipping table "${table}":`, e);
      backup.tables[table] = [];
    }
  }

  // Trigger download
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dev-companion-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

    // Validate
    if (!backup.version || !backup.tables || backup.appName !== 'Dev Companion') {
      return { success: false, message: 'Invalid backup file format.' };
    }

    let totalImported = 0;

    for (const [tableName, rows] of Object.entries(backup.tables)) {
      if (!TABLES.includes(tableName) || !Array.isArray(rows) || rows.length === 0) continue;

      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(col => row[col]);

        try {
          await window.electron.db.execute(
            `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
          totalImported++;
        } catch (e) {
          console.warn(`[Import] Failed row in ${tableName}:`, e);
        }
      }
    }

    return { success: true, message: `Successfully imported ${totalImported} records across ${Object.keys(backup.tables).length} tables.` };
  } catch (e: any) {
    return { success: false, message: `Import failed: ${e.message}` };
  }
}
