import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- LOCAL DATA (SQLite) ---

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
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
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  title: text('title').notNull(),
  body: text('body'),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
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
  created_by: string;
  created_at: string;
}

export interface ErrorDecoderEntry {
  id: string;
  team_id: string;
  platform: string;
  error_code?: string;
  title: string;
  explanation: string;
  root_cause: string;
  fix_steps: string;
  approved: boolean;
  created_by: string;
  created_at: string;
}

export interface PermissionMapEntry {
  id: string;
  team_id: string;
  platform: string;
  action_desc: string;
  roles_json: any;
  notes?: string;
  created_by: string;
}
