/**
 * Bridge Mock
 * Provides fallback for window.electron APIs when running in browser.
 * Also mocks Supabase auth for dev testing.
 */

if (typeof window !== 'undefined' && !window.electron) {
  console.warn('[Dev Companion] window.electron not found. Initializing browser mock for testing...');

  const mockDb = {
    execute: async (sql: string, params: any[] = []) => {
      console.log(`[Mock DB] Executing: ${sql}`, params);

      const tableMatch = sql.match(/FROM\s+(\w+)/i) || sql.match(/INSERT\s+INTO\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i) || sql.match(/DELETE\s+FROM\s+(\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : 'default';
      const storageKey = `mock_db_${tableName}`;

      let data = JSON.parse(localStorage.getItem(storageKey) || '[]');

      if (sql.startsWith('SELECT')) {
        if (sql.includes('WHERE')) {
          if (params.length > 0) {
            return data.filter((item: any) => Object.values(item).includes(params[0]));
          }
        }
        return data;
      }

      if (sql.startsWith('INSERT')) {
        const id = params[0];
        const newItem: any = { id };
        const keys = ['id', 'workspace_id', 'title', 'name', 'color', 'url', 'platform', 'type', 'status', 'priority', 'body', 'group_name', 'code', 'language', 'tags'];
        params.forEach((p: any, i: number) => {
          if (keys[i]) newItem[keys[i]] = p;
        });
        data.push(newItem);
        localStorage.setItem(storageKey, JSON.stringify(data));
        return { id };
      }

      if (sql.startsWith('UPDATE')) {
        return { changes: 1 };
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
    net: {
      checkStatus: async (url: string) => {
        try {
          await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          return true;
        } catch {
          return false;
        }
      },
    },
    app: {
      getDataPath: async () => '/mock/user-data',
    },
    instance: {
      launchSecure: async () => console.log('[Mock] Secure Launch triggered'),
    },
  };

  console.log('[Dev Companion] Browser mock initialized.');
}

export {};
