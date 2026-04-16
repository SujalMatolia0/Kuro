/**
 * Bridge Mock 
 * This file provides a fallback for window.electron APIs when running in a 
 * standard browser environment. This enables easier testing and development.
 */

if (typeof window !== 'undefined' && !window.electron) {
  console.warn('[Dev Companion] window.electron not found. Initializing browser mock for testing...');

  const mockDb = {
    execute: async (sql: string, params: any[] = []) => {
      console.log(`[Mock DB] Executing: ${sql}`, params);
      
      // Basic mock implementation using localStorage
      const tableMatch = sql.match(/FROM\s+(\w+)/i) || sql.match(/INSERT\s+INTO\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i) || sql.match(/DELETE\s+FROM\s+(\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : 'default';
      const storageKey = `mock_db_${tableName}`;
      
      let data = JSON.parse(localStorage.getItem(storageKey) || '[]');

      if (sql.startsWith('SELECT')) {
        if (sql.includes('WHERE')) {
          // Very basic filter matching (id = ?)
          if (params.length > 0) {
            return data.filter((item: any) => Object.values(item).includes(params[0]));
          }
        }
        return data;
      }

      if (sql.startsWith('INSERT')) {
        const id = params[0];
        // This is a naive mapping of params to objects for testing purposes
        const newItem = { id, workspace_id: params[1], title: params[2], status: 'TODO' };
        data.push(newItem);
        localStorage.setItem(storageKey, JSON.stringify(data));
        return { id };
      }

      if (sql.startsWith('DELETE')) {
        data = data.filter((item: any) => item.id !== params[0]);
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
      }

      return [];
    }
  };

  const mockSafeStorage = {
    encrypt: async (text: string) => `mock_encrypted_${text}`,
    decrypt: async (blob: string) => blob.replace('mock_encrypted_', ''),
  };

  const mockShell = {
    openUrl: (url: string) => window.open(url, '_blank'),
  };

  (window as any).electron = {
    db: mockDb,
    safeStorage: mockSafeStorage,
    shell: mockShell,
    instance: {
      launchSecure: async () => console.log('[Mock] Secure Launch triggered'),
    }
  };
}

export {};
