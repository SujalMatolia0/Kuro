// --- Workspace Queries ---

export const workspaceQueries = {
  getAll: async () => {
    return await window.electron.db.execute('SELECT * FROM workspaces ORDER BY created_at DESC');
  },
  
  getById: async (id: string) => {
    const results = await window.electron.db.execute('SELECT * FROM workspaces WHERE id = ?', [id]);
    return results[0] || null;
  },
  
  create: async (name: string, color: string) => {
    const id = self.crypto.randomUUID();
    const createdAt = Date.now();
    await window.electron.db.execute(
      'INSERT INTO workspaces (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      [id, name, color, createdAt]
    );
    return { id, name, color, createdAt };
  },
  
  update: async (id: string, name: string, color: string) => {
    await window.electron.db.execute(
      'UPDATE workspaces SET name = ?, color = ? WHERE id = ?',
      [name, color, id]
    );
  },
  
  delete: async (id: string) => {
    // Note: In production, we should handle cascading deletes or check for dependencies
    await window.electron.db.execute('DELETE FROM workspaces WHERE id = ?', [id]);
  }
};

// --- Instance Queries ---

export const instanceQueries = {
  getByWorkspace: async (workspaceId: string) => {
    return await window.electron.db.execute(
      'SELECT * FROM instances WHERE workspace_id = ? ORDER BY created_at DESC',
      [workspaceId]
    );
  },
  
  create: async (data: any) => {
    const id = self.crypto.randomUUID();
    const createdAt = Date.now();
    await window.electron.db.execute(
      'INSERT INTO instances (id, workspace_id, name, url, platform, type, expiry_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.workspaceId, data.name, data.url, data.platform, data.type, data.expiryDate, data.notes, createdAt]
    );
    
    if (data.credentials) {
      const encryptedBlob = await window.electron.safeStorage.encrypt(JSON.stringify(data.credentials));
      await window.electron.db.execute(
        'INSERT INTO instance_creds (id, instance_id, encrypted_blob) VALUES (?, ?, ?)',
        [self.crypto.randomUUID(), id, encryptedBlob]
      );
    }
    
    return { id, ...data, createdAt };
  },
  
  delete: async (id: string) => {
    // Delete credentials first
    await window.electron.db.execute('DELETE FROM instance_creds WHERE instance_id = ?', [id]);
    // Delete instance
    await window.electron.db.execute('DELETE FROM instances WHERE id = ?', [id]);
  },
  
  getCredentials: async (instanceId: string) => {
    const results = await window.electron.db.execute(
      'SELECT encrypted_blob FROM instance_creds WHERE instance_id = ?',
      [instanceId]
    );
    if (results.length === 0) return null;
    const decrypted = await window.electron.safeStorage.decrypt(results[0].encrypted_blob);
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return decrypted; // Fallback for old simple-string creds
    }
  }
};

// --- Task Queries ---

export const taskQueries = {
  getByWorkspace: async (workspaceId: string) => {
    return await window.electron.db.execute(
      'SELECT * FROM tasks WHERE workspace_id = ? ORDER BY position ASC',
      [workspaceId]
    );
  },
  create: async (task: any) => {
    const id = self.crypto.randomUUID();
    return await window.electron.db.execute(
      'INSERT INTO tasks (id, workspace_id, title, platform, status, priority, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, task.workspaceId, task.title, task.platform, task.status, task.priority, task.position || 0, Date.now()]
    );
  },
  update: async (id: string, updates: any) => {
    const fields = Object.keys(updates);
    const sql = `UPDATE tasks SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
    return await window.electron.db.execute(sql, [...Object.values(updates), id]);
  },
  delete: async (id: string) => {
    return await window.electron.db.execute('DELETE FROM tasks WHERE id = ?', [id]);
  }
};

// --- Note Queries ---

export const noteQueries = {
  getByWorkspace: async (workspaceId: string) => {
    return await window.electron.db.execute(
      'SELECT * FROM notes WHERE workspace_id = ? ORDER BY updated_at DESC',
      [workspaceId]
    );
  },
  create: async (note: any) => {
    const id = self.crypto.randomUUID();
    return await window.electron.db.execute(
      'INSERT INTO notes (id, workspace_id, title, body, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, note.workspaceId, note.title, note.body, Date.now()]
    );
  },
  update: async (id: string, updates: any) => {
    const fields = Object.keys(updates);
    const sql = `UPDATE notes SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`;
    return await window.electron.db.execute(sql, [...Object.values(updates), Date.now(), id]);
  },
  delete: async (id: string) => {
    return await window.electron.db.execute('DELETE FROM notes WHERE id = ?', [id]);
  }
};
