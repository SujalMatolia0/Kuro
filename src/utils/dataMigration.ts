/**
 * Data Migration Utilities
 * Helps migrate data from old app installations to new KuroDes installation
 */

import { workspaceQueries, instanceQueries } from '../db/queries';
import { cloudNoteQueries, cloudSnippetQueries, cloudVaultQueries } from '../db/cloudQueries';

export interface MigrationStats {
  workspacesMigrated: number;
  instancesMigrated: number;
  notesMigrated: number;
  tasksMigrated: number;
  errors: string[];
}

/**
 * Migrate all local data from old database to new installation
 * This is useful when upgrading from Fellow.dev to KuroDes
 */
export async function migrateLocalData(userEmail: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    workspacesMigrated: 0,
    instancesMigrated: 0,
    notesMigrated: 0,
    tasksMigrated: 0,
    errors: []
  };

  try {
    // 1. Migrate workspaces
    const workspaces = await workspaceQueries.getAll();
    stats.workspacesMigrated = workspaces.length;

    // 2. Migrate instances
    for (const workspace of workspaces) {
      try {
        const instances = await instanceQueries.getByWorkspace(workspace.id);
        stats.instancesMigrated += instances.length;
      } catch (err: any) {
        stats.errors.push(`Instance migration failed: ${err.message}`);
      }
    }

    // 3. Migrate notes to cloud
    for (const workspace of workspaces) {
      try {
        const notes = await (window as any).electron.db.execute(
          'SELECT * FROM notes WHERE workspace_id = ?',
          [workspace.id]
        );
        
        for (const note of notes) {
          try {
            // Upsert to cloud
            await cloudNoteQueries.upsert({
              id: note.id,
              profile_email: userEmail,
              title: note.title,
              body: note.body,
              group_name: note.group_name,
              updated_at: new Date(note.updated_at).toISOString()
            });

            // Mark as synced locally
            await (window as any).electron.db.execute(
              'UPDATE notes SET is_synced = 1, cloud_id = ? WHERE id = ?',
              [note.id, note.id]
            );

            stats.notesMigrated++;
          } catch (err: any) {
            stats.errors.push(`Note ${note.id} sync failed: ${err.message}`);
          }
        }
      } catch (err: any) {
        stats.errors.push(`Notes migration failed: ${err.message}`);
      }
    }

    // 4. Migrate tasks
    for (const workspace of workspaces) {
      try {
        const tasks = await (window as any).electron.db.execute(
          'SELECT * FROM tasks WHERE workspace_id = ?',
          [workspace.id]
        );
        stats.tasksMigrated += tasks.length;
      } catch (err: any) {
        stats.errors.push(`Tasks migration failed: ${err.message}`);
      }
    }

    console.log('Data migration completed:', stats);
    return stats;
  } catch (err: any) {
    stats.errors.push(`Critical migration error: ${err.message}`);
    console.error('Migration failed:', err);
    return stats;
  }
}

/**
 * Force sync all unsynced data to cloud
 */
export async function forceFullSync(userEmail: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    workspacesMigrated: 0,
    instancesMigrated: 0,
    notesMigrated: 0,
    tasksMigrated: 0,
    errors: []
  };

  try {
    // Sync all unsynced notes
    const unsyncedNotes = await (window as any).electron.db.execute(
      'SELECT * FROM notes WHERE is_synced = 0'
    );

    for (const note of unsyncedNotes) {
      try {
        await cloudNoteQueries.upsert({
          id: note.id,
          profile_email: userEmail,
          title: note.title,
          body: note.body,
          group_name: note.group_name,
          updated_at: new Date(note.updated_at).toISOString()
        });

        await (window as any).electron.db.execute(
          'UPDATE notes SET is_synced = 1, cloud_id = ? WHERE id = ?',
          [note.id, note.id]
        );

        stats.notesMigrated++;
      } catch (err: any) {
        stats.errors.push(`Note sync failed: ${err.message}`);
      }
    }

    console.log('Full sync completed:', stats);
    return stats;
  } catch (err: any) {
    stats.errors.push(`Full sync error: ${err.message}`);
    console.error('Full sync failed:', err);
    return stats;
  }
}

/**
 * Pull all cloud data for the given profile and merge into local database
 */
export async function pullCloudData(userEmail: string, targetWorkspaceId?: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    workspacesMigrated: 0,
    instancesMigrated: 0,
    notesMigrated: 0,
    tasksMigrated: 0,
    errors: []
  };

  try {
    // 1. Ensure at least one Workspace exists or use the targeted one
    let targetId = targetWorkspaceId;
    if (!targetId) {
      let workspaces = await workspaceQueries.getAll();
      targetId = workspaces[0]?.id;

      if (!targetId) {
        const newWs = await workspaceQueries.create('Default Workspace', '#3b82f6');
        targetId = newWs.id;
        stats.workspacesMigrated++;
        console.log('Created Default Workspace for cloud data sync.');
      }
    }

    // 2. Pull Cloud Notes
    const cloudNotes = await cloudNoteQueries.getAll(userEmail);
    for (const cn of cloudNotes) {
      try {
        const existing = await (window as any).electron.db.execute(
          'SELECT id FROM notes WHERE cloud_id = ? OR id = ?',
          [cn.id, cn.id]
        );

        if (existing.length === 0) {
          // Insert new local note
          const localId = cn.id; // use cloud id if possible
          await (window as any).electron.db.execute(
            'INSERT INTO notes (id, workspace_id, title, body, group_name, updated_at, is_synced, cloud_id, cloud_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [localId, targetId, cn.title, cn.body || '', cn.group_name || null, new Date(cn.updated_at).getTime(), 1, cn.id, new Date(cn.updated_at).getTime()]
          );
          stats.notesMigrated++;
        } else if (targetWorkspaceId) {
          // Requested explicit pull into this new workspace -> Reparent the note
          await (window as any).electron.db.execute(
            'UPDATE notes SET workspace_id = ? WHERE id = ?',
            [targetId, cn.id]
          );
        }
      } catch (err: any) {
        stats.errors.push(`Note pull failed for ${cn.id}: ${err.message}`);
      }
    }

    // 3. Pull Cloud Snippets
    const cloudSnippets = await cloudSnippetQueries.getAll(userEmail);
    for (const cs of cloudSnippets) {
      try {
        const existing = await (window as any).electron.db.execute(
          'SELECT id FROM local_snippets WHERE cloud_id = ? OR id = ?',
          [cs.id, cs.id]
        );

        if (existing.length === 0) {
          const now = Date.now();
          const localId = cs.id;
          await (window as any).electron.db.execute(
            'INSERT INTO local_snippets (id, workspace_id, title, code, language, platform, tags, type, is_synced, cloud_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [localId, targetId, cs.title, cs.code, cs.language, cs.platform, JSON.stringify(cs.tags || []), cs.type || 'snippet', 1, cs.id, now]
          );
        } else if (targetWorkspaceId) {
          await (window as any).electron.db.execute(
            'UPDATE local_snippets SET workspace_id = ? WHERE id = ?',
            [targetId, cs.id]
          );
        }
      } catch (err: any) {
        stats.errors.push(`Snippet pull failed for ${cs.id}: ${err.message}`);
      }
    }

    // 4. Pull Cloud Vault Files
    const cloudVaultFiles = await cloudVaultQueries.getAll(userEmail);
    for (const cv of cloudVaultFiles) {
      try {
        const existing = await (window as any).electron.db.execute(
          'SELECT id FROM local_vault_files WHERE cloud_id = ? OR id = ?',
          [cv.id, cv.id]
        );

        if (existing.length === 0) {
          const fullCv = await cloudVaultQueries.getById(cv.id);
          if (fullCv) {
            const now = Date.now();
            const localId = fullCv.id;
            await (window as any).electron.db.execute(
              'INSERT INTO local_vault_files (id, workspace_id, name, content, storage_path, filetype, platform, description, version_note, is_synced, cloud_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [localId, targetId, fullCv.name, fullCv.content, fullCv.storage_path, fullCv.filetype, fullCv.platform, fullCv.description, fullCv.version_note, 1, fullCv.id, now]
            );
          }
        } else if (targetWorkspaceId) {
          await (window as any).electron.db.execute(
            'UPDATE local_vault_files SET workspace_id = ? WHERE id = ?',
            [targetId, cv.id]
          );
        }
      } catch (err: any) {
        stats.errors.push(`Vault file pull failed for ${cv.id}: ${err.message}`);
      }
    }

    console.log('Pull Cloud Data completed:', stats);
    return stats;
  } catch (err: any) {
    stats.errors.push(`Critical pull error: ${err.message}`);
    console.error('Pull failed:', err);
    return stats;
  }
}
