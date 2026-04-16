import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import { noteQueries } from '../../db/queries';
import {
  Plus, Search, Trash2, FileText, StickyNote,
  Save, Calendar, Clock, Cloud, CloudUpload, CloudOff,
  RotateCw, ChevronDown, ChevronRight, FolderOpen, Folder,
  FolderPlus, Pencil, Check, X
} from 'lucide-react';
import { pushNoteToCloud, resolveNoteKeepCloud, resolveNoteKeepLocal, type SyncConflict } from '../../lib/sync';
import ConflictResolver from '../../components/ConflictResolver';
import EmptyState from '../../components/EmptyState';
import Fuse from 'fuse.js';

const UNGROUPED = '__ungrouped__';

const QuickNotes = () => {
  const { activeWorkspace, profile } = useAppStore();
  const [notes, setNotes]               = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isSaving, setIsSaving]         = useState(false);
  const [saveTimeout, setSaveTimeout]   = useState<NodeJS.Timeout | null>(null);

  // Group state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingGroupNote, setEditingGroupNote] = useState<string | null>(null); // note id being re-grouped
  const [newGroupInput, setNewGroupInput]       = useState('');
  const [showGroupInput, setShowGroupInput]     = useState(false); // inline new-group field

  // Sync state
  const [isSyncing, setIsSyncing]         = useState(false);
  const [activeConflict, setActiveConflict] = useState<SyncConflict | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const list = await noteQueries.getAll();
    setNotes(list);
  };

  // ── Derived: group map ────────────────────────────────────────────────────
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const fuse = new Fuse(notes, { keys: ['title', 'body', 'group_name'], threshold: 0.3 });
    return fuse.search(searchQuery).map(r => r.item);
  }, [notes, searchQuery]);

  const groupMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const note of filteredNotes) {
      const key = note.group_name?.trim() || UNGROUPED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(note);
    }
    // Sort: named groups alphabetically, ungrouped last
    return new Map(
      [...map.entries()].sort(([a], [b]) => {
        if (a === UNGROUPED) return 1;
        if (b === UNGROUPED) return -1;
        return a.localeCompare(b);
      })
    );
  }, [filteredNotes]);

  const allGroups = useMemo(() =>
    [...new Set(notes.map(n => n.group_name?.trim()).filter(Boolean))].sort(),
  [notes]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const handleCreateNote = async (groupName?: string) => {
    await noteQueries.create(
      { workspaceId: activeWorkspace?.id || 'global', title: 'Untitled Note', body: '', group_name: groupName || null },
      profile.email
    );
    loadNotes();
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    await noteQueries.delete(id, profile.email);
    if (selectedNote?.id === id) setSelectedNote(null);
    loadNotes();
  };

  const handleUpdateNote = async (id: string, updates: any) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updated_at: Date.now() } : n));
    if (selectedNote?.id === id) setSelectedNote((prev: any) => ({ ...prev, ...updates }));

    if (saveTimeout) clearTimeout(saveTimeout);
    setIsSaving(true);
    const t = setTimeout(async () => {
      await noteQueries.update(id, updates, profile.email);
      await (window as any).electron.db.execute('UPDATE notes SET is_synced = 0 WHERE id = ?', [id]);
      setIsSaving(false);
    }, 800);
    setSaveTimeout(t);
  };

  const handleAssignGroup = async (noteId: string, groupName: string) => {
    const trimmed = groupName.trim();
    await handleUpdateNote(noteId, { group_name: trimmed || null });
    setEditingGroupNote(null);
    setNewGroupInput('');
  };

  const handleCreateGroup = async () => {
    const name = newGroupInput.trim();
    if (!name) return;
    await handleCreateNote(name);
    setShowGroupInput(false);
    setNewGroupInput('');
  };

  const handlePushSync = async () => {
    if (!selectedNote || !profile.email) return;
    setIsSyncing(true);
    const result = await pushNoteToCloud(selectedNote.id, profile.email, (conflict) => {
      setActiveConflict(conflict);
      setIsSyncing(false);
    });
    if (result.success) {
      loadNotes();
      setSelectedNote((p: any) => ({ ...p, is_synced: 1 }));
    } else if (result.error !== 'CONFLICT_DETECTED') {
      alert('Sync failed: ' + result.error);
    }
    setIsSyncing(false);
  };

  const handleResolveConflict = async (type: 'LOCAL' | 'CLOUD') => {
    if (!activeConflict) return;
    if (type === 'LOCAL') await resolveNoteKeepLocal(activeConflict.entityId, profile.email);
    else await resolveNoteKeepCloud(activeConflict.entityId, activeConflict.cloudData, profile.email);
    setActiveConflict(null);
    loadNotes();
    const refreshed = await noteQueries.getById(activeConflict.entityId);
    setSelectedNote(refreshed);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Sidebar ── */}
      <div className="w-80 flex flex-col gap-3 border-r border-border pr-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-accent-green uppercase">Notes</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowGroupInput(v => !v)}
              className="p-2 text-text-muted hover:text-accent-green hover:bg-accent-green/10 rounded-standard transition-all"
              title="New Group">
              <FolderPlus size={16} />
            </button>
            <button onClick={() => handleCreateNote()}
              className="p-2 bg-accent-green/10 text-accent-green hover:bg-accent-green/20 rounded-standard transition-all"
              title="New Note">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* New group inline input */}
        {showGroupInput && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex-1 flex items-center gap-2 bg-background-primary border border-accent-green/40 rounded-standard px-3 py-1.5">
              <FolderOpen size={13} className="text-accent-green shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm focus:outline-none"
                placeholder="Group name..."
                value={newGroupInput}
                onChange={e => setNewGroupInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup(); if (e.key === 'Escape') { setShowGroupInput(false); setNewGroupInput(''); } }}
              />
            </div>
            <button onClick={handleCreateGroup} className="p-1.5 text-accent-green hover:bg-accent-green/10 rounded transition-colors"><Check size={14} /></button>
            <button onClick={() => { setShowGroupInput(false); setNewGroupInput(''); }} className="p-1.5 text-text-muted hover:text-accent-red rounded transition-colors"><X size={14} /></button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input
            placeholder="Search notes..."
            className="w-full bg-background-primary border border-border rounded-standard py-2 pl-9 pr-4 text-xs focus:border-accent-green focus:outline-none transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Grouped note list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-1">
          {filteredNotes.length === 0 ? (
            <EmptyState icon={StickyNote} title="No Notes Found"
              description="Create a note or a group to organise your thoughts."
              action={{ label: '+ New Note', onClick: () => handleCreateNote() }} />
          ) : [...groupMap.entries()].map(([group, groupNotes]) => {
            const isCollapsed = collapsedGroups.has(group);
            const isUngrouped = group === UNGROUPED;
            return (
              <div key={group}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-standard hover:bg-background-tertiary transition-colors group"
                >
                  {isCollapsed
                    ? <ChevronRight size={13} className="text-text-muted shrink-0" />
                    : <ChevronDown size={13} className="text-text-muted shrink-0" />}
                  {isUngrouped
                    ? <FileText size={13} className="text-text-muted shrink-0" />
                    : isCollapsed
                      ? <Folder size={13} className="text-accent-green shrink-0" />
                      : <FolderOpen size={13} className="text-accent-green shrink-0" />}
                  <span className={`text-[11px] font-black uppercase tracking-widest flex-1 text-left truncate ${isUngrouped ? 'text-text-muted' : 'text-accent-green'}`}>
                    {isUngrouped ? 'Ungrouped' : group}
                  </span>
                  <span className="text-[10px] text-text-muted opacity-50 shrink-0">{groupNotes.length}</span>
                  {/* Add note to this group */}
                  {!isUngrouped && (
                    <span
                      onClick={e => { e.stopPropagation(); handleCreateNote(group); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-accent-green transition-all"
                      title={`New note in ${group}`}
                    >
                      <Plus size={12} />
                    </span>
                  )}
                </button>

                {/* Notes in group */}
                {!isCollapsed && (
                  <div className="ml-4 space-y-1 mt-1">
                    {groupNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className={`w-full text-left p-3 rounded-standard border transition-all group/note relative ${selectedNote?.id === note.id ? 'border-accent-green bg-accent-green/5' : 'border-border bg-background-primary hover:border-border-hover'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-bold text-xs truncate ${selectedNote?.id === note.id ? 'text-accent-green' : 'text-text-primary'}`}>
                            {note.title || 'Untitled'}
                          </h3>
                          <button onClick={e => handleDeleteNote(note.id, e)}
                            className="opacity-0 group-hover/note:opacity-100 p-0.5 text-text-muted hover:text-accent-red transition-all shrink-0">
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <p className="text-[10px] text-text-muted line-clamp-1 mb-1.5">{note.body || 'No content...'}</p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[8px] text-text-muted">
                            <Clock size={8} />{new Date(Number(note.updated_at)).toLocaleDateString()}
                          </span>
                          {note.is_synced
                            ? <span className="flex items-center gap-1 text-[8px] text-accent-green"><Cloud size={8} />Synced</span>
                            : <span className="flex items-center gap-1 text-[8px] text-amber-500"><CloudOff size={8} />Local</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest">Select a Note</h2>
            <p className="text-sm">Choose a note or create a new one.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">

            {/* Note header */}
            <div className="flex items-start justify-between border-b border-border pb-4 gap-4">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  className="w-full bg-transparent text-2xl font-black tracking-tighter text-text-primary focus:outline-none placeholder:text-text-muted/20"
                  placeholder="Note Title"
                  value={selectedNote.title}
                  onChange={e => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                />
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    <Calendar size={10} />{new Date(Number(selectedNote.updated_at)).toLocaleString()}
                  </span>
                  {isSaving && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-accent-green animate-pulse">
                      <Save size={10} />Saving...
                    </span>
                  )}

                  {/* Group badge / picker */}
                  {editingGroupNote === selectedNote.id ? (
                    <div className="flex items-center gap-1">
                      <select
                        autoFocus
                        className="bg-background-secondary border border-accent-green/40 rounded px-2 py-0.5 text-[10px] font-bold focus:outline-none"
                        value={selectedNote.group_name || ''}
                        onChange={e => handleAssignGroup(selectedNote.id, e.target.value)}
                      >
                        <option value="">— No group —</option>
                        {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        <option value="__new__">+ New group...</option>
                      </select>
                      <button onClick={() => setEditingGroupNote(null)} className="p-0.5 text-text-muted hover:text-accent-red"><X size={12} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingGroupNote(selectedNote.id)}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-border hover:border-accent-green/40 transition-colors group/grp"
                    >
                      {selectedNote.group_name
                        ? <><FolderOpen size={10} className="text-accent-green" /><span className="text-accent-green">{selectedNote.group_name}</span></>
                        : <><Folder size={10} className="text-text-muted" /><span className="text-text-muted">No group</span></>}
                      <Pencil size={9} className="text-text-muted opacity-0 group-hover/grp:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handlePushSync}
                disabled={selectedNote.is_synced || isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-standard text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  selectedNote.is_synced
                    ? 'bg-accent-green/10 text-accent-green cursor-default'
                    : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-lg shadow-purple-500/20'
                }`}
              >
                {isSyncing ? <RotateCw size={12} className="animate-spin" />
                  : selectedNote.is_synced ? <Cloud size={12} /> : <CloudUpload size={12} />}
                {selectedNote.is_synced ? 'Synced' : 'Push to Cloud'}
              </button>
            </div>

            {/* Body */}
            <textarea
              className="flex-1 bg-transparent text-text-primary font-medium leading-relaxed resize-none focus:outline-none py-2 placeholder:text-text-muted/20 scrollbar-thin"
              placeholder="Start typing your notes..."
              value={selectedNote.body}
              onChange={e => handleUpdateNote(selectedNote.id, { body: e.target.value })}
            />

            {/* Footer */}
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted">
                <span className="bg-background-tertiary px-2 py-0.5 rounded border border-border">UTF-8</span>
                <span>{selectedNote.body?.length ?? 0} chars</span>
                <span>{selectedNote.body?.split(/\s+/).filter(Boolean).length ?? 0} words</span>
              </div>
              <span className="text-[8px] font-black text-accent-green tracking-widest uppercase italic">AUTO-SAVING</span>
            </div>
          </div>
        )}
      </div>

      <ConflictResolver
        isOpen={!!activeConflict}
        onClose={() => setActiveConflict(null)}
        entityType="note"
        localData={activeConflict?.localData}
        cloudData={activeConflict?.cloudData}
        onResolve={handleResolveConflict}
      />
    </div>
  );
};

export default QuickNotes;
