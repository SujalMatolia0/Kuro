import { diffWordsWithSpace } from 'diff';
import { nanoid } from 'nanoid';
import { cloudAuditQueries } from '../db/cloudQueries';

export type EntityType = 'workspace' | 'instance' | 'task' | 'note' | 'snippet' | 'component' | 'vault_file' | 'knowledge_doc' | 'knowledge_term' | 'knowledge_api' | 'knowledge_guide' | 'checklist' | 'error_decoder' | 'permission_map' | 'known_issue';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC_PUSH' | 'SYNC_PULL';

/**
 * Audit Log structure matches the SQLite table
 */
export interface AuditLog {
  id: string;
  user_email: string | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  workspace_id?: string | null;
  diff_json: string | null;
  created_at: number;
}

/**
 * Sensistive fields that should never have their diffs logged
 */
const SENSITIVE_FIELDS = ['password', 'encrypted_blob', 'token', 'secret', 'key'];

/**
 * Generates a character-level or field-level diff between two objects/strings
 */
export function generateDiff(_entityType: EntityType, oldData: any, newData: any): string | null {
  // If either is missing, it's a creation or deletion (no diff needed, or full object is the "diff")
  if (!oldData || !newData) return null;

  const diffs: Record<string, any> = {};

  // If it's a simple string (like a note body), do a word-level diff
  if (typeof oldData === 'string' && typeof newData === 'string') {
    return JSON.stringify(diffWordsWithSpace(oldData, newData));
  }

  // If it's an object, diff the fields
  if (typeof oldData === 'object' && typeof newData === 'object') {
    const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

    for (const key of allKeys) {
      if (SENSITIVE_FIELDS.includes(key)) {
        if (oldData[key] !== newData[key]) {
          diffs[key] = '[SENSITIVE DATA CHANGED]';
        }
        continue;
      }

      if (oldData[key] !== newData[key]) {
        // If the field is a long string, do a detailed word diff
        if (typeof oldData[key] === 'string' && oldData[key].length > 50) {
          diffs[key] = diffWordsWithSpace(oldData[key], newData[key]);
        } else {
          // Otherwise just store before/after
          diffs[key] = { from: oldData[key], to: newData[key] };
        }
      }
    }
  }

  return Object.keys(diffs).length > 0 ? JSON.stringify(diffs) : null;
}

/**
 * Helper to log an audit action to the local SQLite database
 */
export async function logAudit(
  userEmail: string | null,
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  workspaceId: string | null,
  oldData: any,
  newData: any,
  syncToCloud: boolean = false
) {
  const diffJson = generateDiff(entityType, oldData, newData);
  const logId = nanoid();
  const createdAt = Date.now();

  try {
    await window.electron.db.execute(
      'INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, workspace_id, diff_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [logId, userEmail, action, entityType, entityId, workspaceId, diffJson, createdAt]
    );

    // Online Audit Logger (Supabase)
    if (syncToCloud && userEmail) {
      await cloudAuditQueries.create({
        user_email: userEmail,
        action,
        entity_type: entityType,
        entity_id: entityId,
        workspace_id: workspaceId || undefined,
        diff_json: diffJson ? JSON.parse(diffJson) : null
      });
    }
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

/**
 * Deletes audit logs older than 30 days
 */
export async function performAuditCleanup() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  try {
    await window.electron.db.execute(
      'DELETE FROM audit_logs WHERE created_at < ?',
      [thirtyDaysAgo]
    );
    console.log('Audit cleanup complete: removed logs older than 30 days.');
  } catch (err) {
    console.error('Audit cleanup failed:', err);
  }
}
