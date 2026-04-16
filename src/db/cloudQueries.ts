import { supabase } from '../lib/supabase';
import type { KnowledgeEntry, CloudAuditLog, ChecklistEntry, ErrorDecoderEntry, PermissionMapEntry, KnownIssueEntry } from './schema';

// --- Cloud Profile Queries ---

export const cloudProfileQueries = {
  // Sync local profile to cloud, or fetch existing
  syncProfile: async (profile: { name: string; email: string; focus: string }) => {
    if (!profile.email) return null;

    // First check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', profile.email)
      .single();

    if (existing) {
      // Return existing cloud profile (for multi-desktop sync)
      return existing;
    } else {
      // Insert new profile
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert([{ email: profile.email, name: profile.name, focus: profile.focus }])
        .select()
        .single();
        
      if (insertError) console.error("Error creating cloud profile:", insertError);
      return created;
    }
  }
};

// --- Snippet Queries ---

export interface CloudSnippet {
  id?: string;
  profile_email: string;
  title: string;
  code: string;
  language: string;
  platform: string;
  tags?: string[];
  type?: 'snippet' | 'component';
  created_at?: string;
}

export const cloudSnippetQueries = {
  getAll: async (_email: string) => {
    const { data, error } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching snippets:", error);
    return data || [];
  },

  create: async (snippet: CloudSnippet) => {
    const { data, error } = await supabase
      .from('snippets')
      .insert([snippet])
      .select()
      .single();
      
    if (error) console.error("Error creating snippet:", error);
    return data;
  },

  update: async (id: string, updates: Partial<CloudSnippet>) => {
    const { data, error } = await supabase
      .from('snippets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) console.error("Error updating snippet:", error);
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id);
      
    if (error) console.error("Error deleting snippet:", error);
  }
};

// --- Vault File Queries ---

export interface CloudVaultFile {
  id?: string;
  profile_email: string;
  name: string;
  content: string;
  filetype: string;
  platform: string;
  description: string;
  version_note: string;
  storage_path?: string; // Null for legacy text-only entries
  created_at?: string;
}

export const cloudVaultQueries = {
  getAll: async (_email: string) => {
    const { data, error } = await supabase
      .from('vault_files')
      .select('id, name, filetype, platform, description, version_note, storage_path, created_at') // Include storage_path
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching vault files:", error);
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('vault_files')
      .select('*') // Get everything including content
      .eq('id', id)
      .single();

    if (error) console.error("Error fetching vault file:", error);
    return data;
  },

  create: async (file: CloudVaultFile) => {
    const { data, error } = await supabase
      .from('vault_files')
      .insert([file])
      .select()
      .single();
      
    if (error) console.error("Error saving to vault:", error);
    return data;
  },

  delete: async (id: string, storagePath?: string) => {
    // 1. Delete record from DB
    const { error } = await supabase
      .from('vault_files')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Error deleting from vault DB:", error);
      return;
    }

    // 2. If storage path exists, delete file from bucket
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('vault')
        .remove([storagePath]);
      
      if (storageError) console.error("Error deleting from vault storage:", storageError);
    }
  },

  uploadFile: async (file: File | Blob, path: string) => {
    const { data, error } = await supabase.storage
      .from('vault')
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error("Error uploading to vault storage:", error);
      throw error;
    }
    return data.path;
  },

  getPublicUrl: (path: string) => {
    const { data } = supabase.storage
      .from('vault')
      .getPublicUrl(path);
    return data.publicUrl;
  }
};

// --- Cloud Note Queries ---

export interface CloudNote {
  id?: string;
  profile_email: string;
  title: string;
  body: string;
  group_name?: string | null;
  updated_at: string;
}

export const cloudNoteQueries = {
  getAll: async (_email: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error && error.code !== 'PGRST116') console.error("Error fetching cloud notes:", error);
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') console.error("Error fetching cloud note:", error);
    return data;
  },

  upsert: async (note: CloudNote) => {
    const { data, error } = await supabase
      .from('notes')
      .upsert([note])
      .select()
      .single();
      
    if (error) {
      console.error("Error upserting cloud note:", error);
      throw error;
    }
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) console.error("Error deleting cloud note:", error);
  }
};

// --- Knowledge Hub Queries ---

export const cloudKnowledgeQueries = {
  getAll: async (_email: string, type?: string) => {
    let query = supabase
      .from('knowledge_base')
      .select('*');
    
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) console.error("Error fetching knowledge entries:", error);
    return data || [];
  },

  create: async (entry: KnowledgeEntry) => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([entry])
      .select()
      .single();
    if (error) console.error("Error creating knowledge entry:", error);
    return data;
  },

  update: async (id: string, updates: Partial<KnowledgeEntry>) => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) console.error("Error updating knowledge entry:", error);
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);
    if (error) console.error("Error deleting knowledge entry:", error);
  }
};

// Redundant Glossary & API Reference queries removed for Phase 7

// --- Cloud Audit Queries ---

export const cloudAuditQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error fetching cloud audit logs:", error);
    return data || [];
  },

  create: async (log: CloudAuditLog) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([log])
      .select()
      .single();
    if (error) console.error("Error creating cloud audit log:", error);
    return data;
  }
};

// --- Cloud Checklist Queries ---

export const cloudChecklistQueries = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error("Error fetching cloud checklists:", error);
    // Deserialize commands_json if stored as string
    return (data || []).map((row: any) => ({
      ...row,
      commands_json: typeof row.commands_json === 'string'
        ? JSON.parse(row.commands_json)
        : (row.commands_json ?? []),
    }));
  },

  create: async (checklist: ChecklistEntry) => {
    const payload = {
      ...checklist,
      // Serialize commands_json as string for Supabase text column compatibility
      commands_json: checklist.commands_json
        ? JSON.stringify(checklist.commands_json)
        : null,
    };
    const { data, error } = await supabase
      .from('checklists')
      .insert([payload])
      .select()
      .single();
    if (error) console.error("Error creating cloud checklist:", error);
    // Return with deserialized commands_json
    return data ? {
      ...data,
      commands_json: data.commands_json
        ? (typeof data.commands_json === 'string' ? JSON.parse(data.commands_json) : data.commands_json)
        : [],
    } : null;
  },

  update: async (id: string, checklist: Partial<ChecklistEntry>) => {
    const payload: any = { ...checklist };
    if ('commands_json' in payload) {
      payload.commands_json = payload.commands_json
        ? JSON.stringify(payload.commands_json)
        : null;
    }
    const { data, error } = await supabase
      .from('checklists')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) console.error("Error updating cloud checklist:", error);
    return data ? {
      ...data,
      commands_json: data.commands_json
        ? (typeof data.commands_json === 'string' ? JSON.parse(data.commands_json) : data.commands_json)
        : [],
    } : null;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id);
    if (error) console.error("Error deleting cloud checklist:", error);
  }
};

// Redundant Onboarding queries removed for Phase 7 Hub

// --- Cloud AI Assist Queries ---

export const cloudErrorQueries = {
  getAll: async () => {
    const { data } = await supabase
      .from('error_decoder')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },
  create: async (entry: ErrorDecoderEntry) => {
    const { data } = await supabase.from('error_decoder').insert([entry]).select().single();
    return data;
  },
  delete: async (id: string) => {
    await supabase.from('error_decoder').delete().eq('id', id);
  }
};

export const cloudPermissionQueries = {
  getAll: async () => {
    const { data } = await supabase
      .from('permission_map')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },
  create: async (entry: PermissionMapEntry) => {
    const { data } = await supabase.from('permission_map').insert([entry]).select().single();
    return data;
  },
  delete: async (id: string) => {
    await supabase.from('permission_map').delete().eq('id', id);
  }
};

export const cloudIssueQueries = {
  getAll: async () => {
    const { data } = await supabase
      .from('known_issues')
      .select('*')
      .order('created_at', { ascending: false });
    return data || [];
  },
  create: async (entry: KnownIssueEntry) => {
    const { data } = await supabase.from('known_issues').insert([entry]).select().single();
    return data;
  },
  update: async (id: string, entry: Partial<KnownIssueEntry>) => {
    const { data } = await supabase.from('known_issues').update(entry).eq('id', id).select().single();
    return data;
  },
  delete: async (id: string) => {
    await supabase.from('known_issues').delete().eq('id', id);
  }
};
