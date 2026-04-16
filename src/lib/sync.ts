import { cloudNoteQueries, cloudSnippetQueries, cloudVaultQueries, type CloudNote } from '../db/cloudQueries';
import { noteQueries, localSnippetQueries, localVaultQueries } from '../db/queries';
import { logAudit } from './audit';

/**
 * Auto-sync all unsynced notes from local to cloud
 */
export async function autoSyncNotes(userEmail: string): Promise<void> {
  try {
    // 1. First, pull all notes from cloud and add to local if missing
    await pullNotesFromCloud(userEmail);
    
    // 2. Then push any unsynced local notes to cloud
    const unsyncedNotes = await (window as any).electron.db.execute(
      'SELECT id FROM notes WHERE is_synced = 0'
    );

    for (const note of unsyncedNotes) {
      await pushNoteToCloud(note.id, userEmail);
    }
  } catch (err) {
    console.error('Auto-sync notes failed:', err);
  }
}

/**
 * Pull all notes from cloud and add to local database if missing
 */
export async function pullNotesFromCloud(userEmail: string, workspaceId?: string): Promise<void> {
  try {
    // Get all notes from cloud
    const supabaseNotes = await cloudNoteQueries.getAll(userEmail);

    for (const cloudNote of supabaseNotes) {
      try {
        // Check if note exists locally
        const localNote = await (window as any).electron.db.execute(
          'SELECT id FROM notes WHERE id = ?',
          [cloudNote.id]
        );

        if (!localNote || localNote.length === 0) {
          // Get first workspace if not provided
          let targetWorkspaceId = workspaceId;
          if (!targetWorkspaceId) {
            const workspaces = await (window as any).electron.db.execute(
              'SELECT id FROM workspaces LIMIT 1'
            );
            targetWorkspaceId = workspaces?.[0]?.id || null;
          }

          // Note doesn't exist locally, add it
          await (window as any).electron.db.execute(
            'INSERT INTO notes (id, workspace_id, title, body, group_name, updated_at, is_synced, cloud_id, cloud_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              cloudNote.id,
              targetWorkspaceId, // Assign to workspace
              cloudNote.title,
              cloudNote.body,
              cloudNote.group_name || null,
              Date.now(),
              1, // is_synced = true
              cloudNote.id,
              Date.parse(cloudNote.updated_at)
            ]
          );
        }
      } catch (err: any) {
        console.error(`Failed to pull note ${cloudNote.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Pull notes from cloud failed:', err);
  }
}

export type SyncConflict = {
  type: 'note' | 'snippet' | 'vault_file';
  localData: any;
  cloudData: any;
  entityId: string;
};

/**
 * Handle pushing a local note to the cloud
 */
export async function pushNoteToCloud(
  localId: string, 
  userEmail: string,
  onConflict?: (conflict: SyncConflict) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const localNote = await noteQueries.getById(localId);
    if (!localNote) return { success: false, error: 'Local note not found' };

    const cloudNote = await cloudNoteQueries.getById(localId);
    if (cloudNote) {
      const lastSyncedAt = localNote.cloud_updated_at ? new Date(localNote.cloud_updated_at).getTime() : 0;
      const cloudUpdatedAt = new Date(cloudNote.updated_at).getTime();

      if (cloudUpdatedAt > lastSyncedAt && localNote.is_synced) {
        if (onConflict) {
          onConflict({ type: 'note', localData: localNote, cloudData: cloudNote, entityId: localId });
        }
        return { success: false, error: 'CONFLICT_DETECTED' };
      }
    }

    const now = new Date().toISOString();
    const result = await cloudNoteQueries.upsert({
      id: localId,
      profile_email: userEmail,
      title: localNote.title,
      body: localNote.body,
      updated_at: now
    });

    if (result) {
      await window.electron.db.execute(
        'UPDATE notes SET is_synced = 1, cloud_id = ?, cloud_updated_at = ? WHERE id = ?',
        [localId, Date.parse(now), localId]
      );
      await logAudit(userEmail, 'SYNC_PUSH', 'note', localId, localNote.workspace_id, localNote, result);
      return { success: true };
    }
    return { success: false, error: 'Failed to upsert cloud note' };
  } catch (err: any) {
    console.error('Sync failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Handle pushing a local snippet to the cloud
 */
export async function pushSnippetToCloud(
  localId: string, 
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const localSnippet = await localSnippetQueries.getById(localId);
    if (!localSnippet) return { success: false, error: 'Local snippet not found' };

    // Snippets currently don't have a direct ID mapping in cloudQueries.create, 
    // but we can use upsert pattern if supported by table ID.
    // Assuming 'id' is preserved.
    const result = await cloudSnippetQueries.create({
      profile_email: userEmail,
      title: localSnippet.title,
      code: localSnippet.code,
      language: localSnippet.language,
      platform: localSnippet.platform,
      tags: localSnippet.tags?.split(',') || []
    });

    if (result) {
      await window.electron.db.execute(
        'UPDATE local_snippets SET is_synced = 1, cloud_id = ? WHERE id = ?',
        [result.id, localId]
      );
      await logAudit(userEmail, 'SYNC_PUSH', 'snippet', localId, localSnippet.workspace_id, localSnippet, result);
      return { success: true };
    }
    return { success: false, error: 'Failed to sync snippet' };
  } catch (err: any) {
    console.error('Snippet sync failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Force overwrite local with cloud data (Resolve by "Keep Theirs")
 */
export async function resolveNoteKeepCloud(localId: string, cloudData: CloudNote, userEmail: string) {
  const localNote = await noteQueries.getById(localId);
  const updatedAtTimestamp = Date.parse(cloudData.updated_at);
  
  await window.electron.db.execute(
    'UPDATE notes SET title = ?, body = ?, updated_at = ?, is_synced = 1, cloud_id = ?, cloud_updated_at = ? WHERE id = ?',
    [cloudData.title, cloudData.body, updatedAtTimestamp, localId, updatedAtTimestamp, localId]
  );
  
  await logAudit(userEmail, 'SYNC_PULL', 'note', localId, localNote?.workspace_id || null, localNote, cloudData);
}

/**
 * Force overwrite cloud with local data (Resolve by "Keep Mine")
 */
export async function resolveNoteKeepLocal(localId: string, userEmail: string) {
  const localNote = await noteQueries.getById(localId);
  if (!localNote) return;

  const now = new Date().toISOString();
  await cloudNoteQueries.upsert({
    id: localId,
    profile_email: userEmail,
    title: localNote.title,
    body: localNote.body,
    updated_at: now
  });

  await window.electron.db.execute(
    'UPDATE notes SET is_synced = 1, cloud_id = ?, cloud_updated_at = ? WHERE id = ?',
    [localId, Date.parse(now), localId]
  );
}

/**
 * Handle pushing a local vault file to the cloud
 */
export async function pushVaultFileToCloud(
  localId: string, 
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const localFile = await localVaultQueries.getById(localId);
    if (!localFile) return { success: false, error: 'Local file not found' };

    // Perform Cloud Create
    const result = await cloudVaultQueries.create({
      profile_email: userEmail,
      name: localFile.name,
      content: localFile.content || '',
      filetype: localFile.filetype,
      platform: localFile.platform,
      description: localFile.description,
      version_note: localFile.version_note,
      storage_path: localFile.storage_path
    });

    if (result) {
      await window.electron.db.execute(
        'UPDATE local_vault_files SET is_synced = 1, cloud_id = ? WHERE id = ?',
        [result.id, localId]
      );
      await logAudit(userEmail, 'SYNC_PUSH', 'vault_file', localId, localFile.workspace_id, localFile, result);
      return { success: true };
    }
    return { success: false, error: 'Failed to sync vault file' };
  } catch (err: any) {
    console.error('Vault sync failed:', err);
    return { success: false, error: err.message };
  }
}
