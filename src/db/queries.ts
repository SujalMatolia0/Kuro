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
      'INSERT INTO tasks (id, workspace_id, title, platform, status, priority, position, instance_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, task.workspaceId, task.title, task.platform, task.status, task.priority, task.position || 0, task.instance_id || null, Date.now()]
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

import { logAudit } from '../lib/audit';

// --- Note Queries ---

export const noteQueries = {
  getAll: async () => {
    return await window.electron.db.execute(
      'SELECT * FROM notes ORDER BY updated_at DESC'
    );
  },
  getById: async (id: string) => {
    const results = await window.electron.db.execute('SELECT * FROM notes WHERE id = ?', [id]);
    return results[0] || null;
  },
  create: async (note: any, userEmail: string | null) => {
    const id = self.crypto.randomUUID();
    const now = Date.now();
    const result = await window.electron.db.execute(
      'INSERT INTO notes (id, workspace_id, title, body, group_name, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, note.workspaceId, note.title, note.body, note.group_name || null, now]
    );
    
    await logAudit(userEmail, 'CREATE', 'note', id, note.workspaceId, null, note);
    return result;
  },
  update: async (id: string, updates: any, userEmail: string | null) => {
    // 1. Get old state for diffing
    const oldNote = await noteQueries.getById(id);
    const now = Date.now();
    
    const fields = Object.keys(updates);
    const sql = `UPDATE notes SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`;
    const result = await window.electron.db.execute(sql, [...Object.values(updates), now, id]);
    
    // 2. Log diff
    if (oldNote) {
      const newNote = { ...oldNote, ...updates, updated_at: now };
      await logAudit(userEmail, 'UPDATE', 'note', id, oldNote.workspace_id, oldNote, newNote);
    }
    
    return result;
  },
  delete: async (id: string, userEmail: string | null) => {
    const oldNote = await noteQueries.getById(id);
    const result = await window.electron.db.execute('DELETE FROM notes WHERE id = ?', [id]);
    
    if (oldNote) {
      await logAudit(userEmail, 'DELETE', 'note', id, oldNote.workspace_id, oldNote, null);
    }
    
    return result;
  }
};

// --- Local Snippet Queries ---

export const localSnippetQueries = {
  getAll: async () => {
    return await window.electron.db.execute(
      'SELECT * FROM local_snippets ORDER BY created_at DESC'
    );
  },
  getById: async (id: string) => {
    const results = await window.electron.db.execute('SELECT * FROM local_snippets WHERE id = ?', [id]);
    return results[0] || null;
  },
  create: async (snippet: any, userEmail: string | null) => {
    const id = self.crypto.randomUUID();
    const now = Date.now();
    await window.electron.db.execute(
      'INSERT INTO local_snippets (id, workspace_id, title, code, language, platform, tags, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, snippet.workspaceId, snippet.title, snippet.code, snippet.language, snippet.platform, snippet.tags, snippet.type || 'snippet', now]
    );
    await logAudit(userEmail, 'CREATE', 'snippet', id, snippet.workspaceId, null, snippet);
    return { id, ...snippet, created_at: now };
  },
  update: async (id: string, updates: any, userEmail: string | null) => {
    const old = await localSnippetQueries.getById(id);
    const fields = Object.keys(updates);
    const sql = `UPDATE local_snippets SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
    const result = await window.electron.db.execute(sql, [...Object.values(updates), id]);
    if (old) {
      const newData = { ...old, ...updates };
      await logAudit(userEmail, 'UPDATE', 'snippet', id, old.workspace_id, old, newData);
    }
    return result;
  },
  delete: async (id: string, userEmail: string | null) => {
    const old = await localSnippetQueries.getById(id);
    await window.electron.db.execute('DELETE FROM local_snippets WHERE id = ?', [id]);
    if (old) {
      await logAudit(userEmail, 'DELETE', 'snippet', id, old.workspace_id, old, null);
    }
  }
};

// --- Local Vault Queries ---

export const localVaultQueries = {
  getAll: async () => {
    return await window.electron.db.execute(
      'SELECT * FROM local_vault_files ORDER BY created_at DESC'
    );
  },
  getById: async (id: string) => {
    const results = await window.electron.db.execute('SELECT * FROM local_vault_files WHERE id = ?', [id]);
    return results[0] || null;
  },
  create: async (file: any, userEmail: string | null) => {
    const id = self.crypto.randomUUID();
    const now = Date.now();
    await window.electron.db.execute(
      'INSERT INTO local_vault_files (id, workspace_id, name, content, storage_path, filetype, platform, description, version_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, file.workspaceId, file.name, file.content, file.storage_path, file.filetype, file.platform, file.description, file.version_note, now]
    );
    await logAudit(userEmail, 'CREATE', 'vault_file', id, file.workspaceId, null, file);
    return { id, ...file, created_at: now };
  },
  update: async (id: string, updates: any, userEmail: string | null) => {
    const old = await localVaultQueries.getById(id);
    const fields = Object.keys(updates);
    const sql = `UPDATE local_vault_files SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
    const result = await window.electron.db.execute(sql, [...Object.values(updates), id]);
    if (old) {
      const newData = { ...old, ...updates };
      await logAudit(userEmail, 'UPDATE', 'vault_file', id, old.workspace_id, old, newData);
    }
    return result;
  },
  delete: async (id: string, userEmail: string | null) => {
    const old = await localVaultQueries.getById(id);
    await window.electron.db.execute('DELETE FROM local_vault_files WHERE id = ?', [id]);
    if (old) {
      await logAudit(userEmail, 'DELETE', 'vault_file', id, old.workspace_id, old, null);
    }
  }
};

// --- Audit Queries ---

export const auditQueries = {
  getAll: async () => {
    return await window.electron.db.execute(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200'
    );
  },
  
  getByEntity: async (entityId: string) => {
    return await window.electron.db.execute(
      'SELECT * FROM audit_logs WHERE entity_id = ? ORDER BY created_at DESC',
      [entityId]
    );
  }
};

// --- Nav Layout Queries ---

export const navLayoutQueries = {
  get: async (userId: string): Promise<any | null> => {
    const results = await window.electron.db.execute(
      'SELECT * FROM nav_layout WHERE user_id = ?',
      [userId]
    );
    if (results.length === 0) return null;
    try {
      return JSON.parse(results[0].layout_json);
    } catch {
      return null;
    }
  },

  save: async (userId: string, layout: any) => {
    const layoutJson = JSON.stringify(layout);
    await window.electron.db.execute(
      'INSERT OR REPLACE INTO nav_layout (id, user_id, layout_json) VALUES (?, ?, ?)',
      [userId, userId, layoutJson]
    );
  }
};

// --- AI History Queries ---

export const aiHistoryQueries = {
  getByModule: async (module: string) => {
    return await window.electron.db.execute(
      'SELECT * FROM ai_history WHERE module = ? ORDER BY created_at DESC LIMIT 50',
      [module]
    );
  },
  create: async (entry: { module: string; query: string; platform?: string; response: string }) => {
    const id = self.crypto.randomUUID();
    await window.electron.db.execute(
      'INSERT INTO ai_history (id, module, query, platform, response, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, entry.module, entry.query, entry.platform || null, entry.response, Date.now()]
    );
    return id;
  },
  delete: async (id: string) => {
    await window.electron.db.execute('DELETE FROM ai_history WHERE id = ?', [id]);
  },
  clearModule: async (module: string) => {
    await window.electron.db.execute('DELETE FROM ai_history WHERE module = ?', [module]);
  }
};
