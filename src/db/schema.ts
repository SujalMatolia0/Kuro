import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- LOCAL DATA (SQLite) ---

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  cloudId: text('cloud_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const instances = sqliteTable('instances', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  platform: text('platform').notNull(),  // fusion | salesforce
  type: text('type').notNull(),          // project | demo
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  notes: text('notes'),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  cloudId: text('cloud_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const instanceCreds = sqliteTable('instance_creds', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').references(() => instances.id),
  encryptedBlob: text('encrypted_blob').notNull()  // safeStorage encrypted
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  title: text('title').notNull(),
  platform: text('platform').notNull(),
  status: text('status').notNull(),   // backlog | in_progress | blocked | done
  priority: text('priority').notNull(), // low | medium | high
  position: integer('position'),
  instanceId: text('instance_id'),    // optional link to an instance
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  cloudId: text('cloud_id'),
  cloudUpdatedAt: integer('cloud_updated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  title: text('title').notNull(),
  body: text('body'),
  groupName: text('group_name'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  cloudId: text('cloud_id'),
  cloudUpdatedAt: integer('cloud_updated_at', { mode: 'timestamp' })
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userEmail: text('user_email'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  workspaceId: text('workspace_id'),
  diffJson: text('diff_json'),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const localSnippets = sqliteTable('local_snippets', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  title: text('title').notNull(),
  code: text('code').notNull(),
  language: text('language').notNull(),
  platform: text('platform').notNull(),
  tags: text('tags'),
  type: text('type').default('snippet'), // snippet | component
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  cloudId: text('cloud_id'),
  cloudUpdatedAt: integer('cloud_updated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const localVaultFiles = sqliteTable('local_vault_files', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  name: text('name').notNull(),
  content: text('content'),
  storagePath: text('storage_path'),
  filetype: text('filetype'),
  platform: text('platform'),
  description: text('description'),
  versionNote: text('version_note'),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  cloudId: text('cloud_id'),
  cloudUpdatedAt: integer('cloud_updated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const navLayout = sqliteTable('nav_layout', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  layoutJson: text('layout_json').notNull()
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

export const aiHistory = sqliteTable('ai_history', {
  id: text('id').primaryKey(),
  module: text('module').notNull(),       // 'error-decoder' | 'permission-advisor'
  query: text('query').notNull(),
  platform: text('platform'),
  response: text('response').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

// --- CLOUD DATA TYPES (Supabase) ---
// These are interfaces for the data that lives in Supabase.

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'member';
  team_id: string;
}

export interface Snippet {
  id: string;
  team_id: string;
  title: string;
  code: string;
  platform: string;
  type: 'snippet' | 'component';
  tags: string[];
  created_by: string;
  updated_at: string;
}

export interface VaultFile {
  id: string;
  team_id: string;
  name: string;
  content: string;
  filetype: string;
  platform: string;
  tags: string[];
  description?: string;
  version_note?: string;
  storage_path?: string;
  created_by: string;
  created_at: string;
}


export interface KnowledgeEntry {
  id?: string;
  profile_email: string;
  title: string;
  body: any; // Tiptap JSON or Markdown
  type: 'doc' | 'term' | 'api' | 'guide';
  category?: string;
  platform?: string;
  metadata_json?: {
    term?: string;
    definition?: string;
    endpoint?: string;
    method?: string;
    headers?: string;
    payload?: string;
    response?: string;
    section?: string;
  };
  links?: string[];
  created_at?: string;
  updated_at?: string;
}

// Redundant interfaces removed for Phase 7 Consolidation

export interface CloudAuditLog {
  id?: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  workspace_id?: string;
  diff_json?: any;
  created_at?: string;
}

export interface ChecklistCommand {
  label: string;
  command: string;
  shell?: 'bash' | 'powershell' | 'cmd' | 'sql' | 'other';
  description?: string;
}

export interface ChecklistEntry {
  id?: string;
  profile_email: string;
  title: string;
  platform?: string;
  steps_json: { text: string; completed?: boolean }[];
  commands_json?: ChecklistCommand[];
  created_at?: string;
}

// Redundant onboarding guide interface removed

export interface ErrorDecoderEntry {
  id?: string;
  profile_email: string;
  platform: string;
  error_code: string;
  title?: string;
  explanation?: string;
  root_cause?: string;
  fix_steps?: string;
  created_at?: string;
}

export interface PermissionMapEntry {
  id?: string;
  profile_email: string;
  platform: string;
  action_desc: string;
  roles_json?: any;
  notes?: string;
  created_at?: string;
}

export interface KnownIssueEntry {
  id?: string;
  profile_email: string;
  title: string;
  platform?: string;
  description?: string;
  workaround?: string;
  status: 'Open' | 'Resolved';
  created_at?: string;
}
