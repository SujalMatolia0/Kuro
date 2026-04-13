import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { noteQueries } from '../../db/queries';
import { 
  Plus, Search, Trash2, FileText, 
  Save, Calendar, Clock, MoreVertical, 
  ChevronRight, StickyNote
} from 'lucide-react';

const QuickNotes = () => {
  const { activeWorkspace } = useAppStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadNotes();
    }
  }, [activeWorkspace]);

  const loadNotes = async () => {
    if (!activeWorkspace) return;
    const list = await noteQueries.getByWorkspace(activeWorkspace.id);
    setNotes(list);
    if (list.length > 0 && !selectedNote) {
      // Don't auto-select to avoid confusion on workspace switch
    }
  };

  const handleCreateNote = async () => {
    if (!activeWorkspace) return;
    const newNote = {
      workspaceId: activeWorkspace.id,
      title: 'Untitled Note',
      body: ''
    };
    await noteQueries.create(newNote);
    loadNotes();
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this note?')) {
      await noteQueries.delete(id);
      if (selectedNote?.id === id) setSelectedNote(null);
      loadNotes();
    }
  };

  const handleUpdateNote = async (id: string, updates: any) => {
    setIsSaving(true);
    await noteQueries.update(id, updates);
    // Debounce or immediate UI update
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updated_at: Date.now() } : n));
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, ...updates });
    }
    
    // Simulate a brief saving state
    setTimeout(() => setIsSaving(false), 500);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar List */}
      <div className="w-80 flex flex-col gap-4 border-r border-border pr-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-accent-green uppercase">Notes</h1>
          <button 
            onClick={handleCreateNote}
            className="p-2 bg-accent-green/10 text-accent-green hover:bg-accent-green/20 rounded-standard transition-all"
            title="Create Note"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input 
            type="text"
            placeholder="Search notes..."
            className="w-full bg-background-primary border border-border rounded-standard py-2 pl-9 pr-4 text-xs focus:border-accent-green focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <StickyNote size={32} className="mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Notes Found</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left p-4 rounded-standard border transition-all group relative ${selectedNote?.id === note.id ? 'border-accent-green bg-accent-green/5 shadow-[0_0_20px_rgba(0,255,159,0.05)]' : 'border-border bg-background-primary hover:border-border-hover'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={`font-bold text-sm truncate ${selectedNote?.id === note.id ? 'text-accent-green' : 'text-text-primary'}`}>
                    {note.title || 'Untitled'}
                  </h3>
                  <button 
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-red transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted line-clamp-2 font-medium mb-2 leading-relaxed">
                  {note.body || 'No content...'}
                </p>
                <div className="flex items-center gap-2 text-[8px] font-black text-text-muted uppercase tracking-tighter">
                  <Clock size={8} />
                  <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest">Select a Note</h2>
            <p className="text-sm">Choose a note from the list or create a new one to begin.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex-1">
                <input 
                  type="text"
                  className="w-full bg-transparent text-2xl font-black tracking-tighter text-text-primary focus:outline-none placeholder:text-text-muted/20"
                  placeholder="Note Title"
                  value={selectedNote.title}
                  onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                />
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <span className="flex items-center gap-1.2">
                    <Calendar size={10} className="mt-[-1px]" />
                    {new Date(selectedNote.updated_at).toLocaleString()}
                  </span>
                  {isSaving && (
                    <span className="text-accent-green flex items-center gap-1.2 animate-pulse">
                      <Save size={10} className="mt-[-1px]" />
                      Saving...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-text-muted hover:text-white transition-colors" title="Settings">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <textarea 
              className="flex-1 bg-transparent text-text-primary font-medium leading-relaxed resize-none focus:outline-none py-2 placeholder:text-text-muted/20 scrollbar-thin"
              placeholder="Start typing your scratchpad notes..."
              value={selectedNote.body}
              onChange={(e) => handleUpdateNote(selectedNote.id, { body: e.target.value })}
            />

            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted">
                <span className="bg-background-tertiary px-2 py-0.5 rounded border border-border">UTF-8</span>
                <span>{selectedNote.body.length} characters</span>
                <span>{selectedNote.body.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black text-accent-green tracking-widest uppercase italic">
                AUTO-SAVING ACTIVE
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickNotes;
