import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import { 
  Book, Plus, Search, ExternalLink, Link as LinkIcon, 
  Save, Trash2, Edit, Hash, Plug, GraduationCap, ChevronRight,
  Filter
} from 'lucide-react';
import { cloudKnowledgeQueries } from '../../db/cloudQueries';
import type { KnowledgeEntry } from '../../db/schema';
import Fuse from 'fuse.js';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { logAudit } from '../../lib/audit';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type ViewType = 'doc' | 'term' | 'api' | 'guide';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-1 p-2 bg-background-tertiary border-b border-border text-text-muted">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-background-primary transition-colors ${editor.isActive('bold') ? 'text-accent-green bg-background-primary' : ''}`}><strong>B</strong></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-background-primary transition-colors ${editor.isActive('italic') ? 'text-accent-green bg-background-primary' : ''}`}><em>I</em></button>
      <div className="w-[1px] h-4 bg-border mx-2" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-background-primary text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-accent-green bg-background-primary' : ''}`}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-background-primary text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-accent-green bg-background-primary' : ''}`}>H2</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-background-primary text-xs font-bold transition-colors ${editor.isActive('bulletList') ? 'text-accent-green bg-background-primary' : ''}`}>• List</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded hover:bg-background-primary text-xs font-bold transition-colors ${editor.isActive('codeBlock') ? 'text-accent-green bg-background-primary' : ''}`}>{'</>'}</button>
    </div>
  );
};

const KnowledgeHub = ({ defaultView = 'doc' }: { defaultView?: ViewType }) => {
  const { profile } = useAppStore();
  const [activeView, setActiveView] = useState<ViewType>(defaultView);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [newLinksStr, setNewLinksStr] = useState('');
  const [newBodyHtml, setNewBodyHtml] = useState('');
  
  // Custom Meta tags for APIs/Terms
  const [metaTerm, setMetaTerm] = useState('');
  const [metaDefinition, setMetaDefinition] = useState('');
  const [metaEndpoint, setMetaEndpoint] = useState('');
  const [metaMethod, setMetaMethod] = useState('GET');

  const editor = useEditor({
    extensions: [StarterKit],
    content: newBodyHtml,
    onUpdate: ({ editor }) => setNewBodyHtml(editor.getHTML()),
    editorProps: { attributes: { class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-4 font-medium' } },
  });

  useEffect(() => { loadEntries(); }, [activeView]);

  const loadEntries = async () => {
    setIsLoading(true);
    const data = await cloudKnowledgeQueries.getAll(profile.email, activeView);
    setEntries(data);
    if (data.length > 0 && !activeEntryId) {
      setActiveEntryId(data[0].id!);
    } else if (data.length === 0) {
      setActiveEntryId(null);
    }
    setIsLoading(false);
  };

  const activeEntry = useMemo(() => entries.find(e => e.id === activeEntryId), [entries, activeEntryId]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const fuse = new Fuse(entries, { keys: ['title', 'category', 'platform', 'metadata_json.term'], threshold: 0.3 });
    return fuse.search(searchQuery).map(result => result.item);
  }, [entries, searchQuery]);

  const handleSave = async () => {
    if (!profile.email || !newTitle) return;

    const entryData: KnowledgeEntry = {
      profile_email: profile.email,
      title: newTitle,
      type: activeView,
      category: newCategory,
      platform: newPlatform,
      body: newBodyHtml,
      metadata_json: {
        term: metaTerm,
        definition: metaDefinition,
        endpoint: metaEndpoint,
        method: metaMethod,
      },
      links: newLinksStr.split(',').map(l => l.trim()).filter(Boolean)
    };

    if (editMode && activeEntryId) {
      await cloudKnowledgeQueries.update(activeEntryId, entryData);
      await logAudit(profile.email, 'UPDATE', `knowledge_${activeView}`, activeEntryId, null, null, entryData, true);
    } else {
      const created = await cloudKnowledgeQueries.create(entryData);
      if (created) setActiveEntryId(created.id);
      await logAudit(profile.email, 'CREATE', `knowledge_${activeView}`, activeEntryId || '', null, null, entryData, true);
    }

    setIsModalOpen(false);
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this entry?')) {
      await cloudKnowledgeQueries.delete(id);
      await logAudit(profile.email, 'DELETE', `knowledge_${activeView}`, id, null, null, null, true);
      if (activeEntryId === id) setActiveEntryId(null);
      loadEntries();
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setNewTitle('');
    setNewCategory('');
    setNewPlatform('');
    setNewLinksStr('');
    setNewBodyHtml('');
    setMetaTerm('');
    setMetaDefinition('');
    setMetaEndpoint('');
    setMetaMethod('GET');
    editor?.commands.setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!activeEntry) return;
    setEditMode(true);
    setNewTitle(activeEntry.title);
    setNewCategory(activeEntry.category || '');
    setNewPlatform(activeEntry.platform || '');
    setNewLinksStr((activeEntry.links || []).join(', '));
    setNewBodyHtml(activeEntry.body || '');
    setMetaTerm(activeEntry.metadata_json?.term || '');
    setMetaDefinition(activeEntry.metadata_json?.definition || '');
    setMetaEndpoint(activeEntry.metadata_json?.endpoint || '');
    setMetaMethod(activeEntry.metadata_json?.method || 'GET');
    editor?.commands.setContent(activeEntry.body || '');
    setIsModalOpen(true);
  };

  const navItems = [
    { id: 'doc', label: 'Articles', icon: Book, color: 'text-accent-green' },
    { id: 'term', label: 'Glossary', icon: Hash, color: 'text-accent-blue' },
    { id: 'api', label: 'API Specs', icon: Plug, color: 'text-accent-violet' },
    { id: 'guide', label: 'Guides', icon: GraduationCap, color: 'text-amber-400' },
  ];

  return (
    <div className="h-[calc(100vh-40px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-4 overflow-hidden">
      {/* Internal Navigation Sidebar */}
      <div className="w-52 flex flex-col gap-2 bg-background-secondary/30 border-r border-border/50 pr-4 shrink-0">
        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 mt-2 px-2">Hub Navigation</h2>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id as ViewType); setActiveEntryId(null); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-standard transition-all group ${
              activeView === item.id 
                ? 'bg-background-tertiary border border-border text-white shadow-xl shadow-black/20' 
                : 'text-text-muted hover:text-white hover:bg-background-secondary/50'
            }`}
          >
            <item.icon size={16} className={activeView === item.id ? item.color : 'opacity-40 group-hover:opacity-100'} />
            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
            {activeView === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </button>
        ))}
      </div>

      {/* List Pane */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="text-text-muted" size={16} />
            <h1 className="text-lg font-black tracking-tighter text-white uppercase">{activeView} Registry</h1>
          </div>
          <button onClick={openCreateModal} className="p-1.5 bg-background-tertiary border border-border rounded-standard text-accent-green hover:text-white transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-background-secondary border border-border rounded-standard px-3 py-1.5">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            placeholder={`Search ${activeView}s...`}
            className="bg-transparent border-none text-xs w-full focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
          {isLoading ? (
            <div className="text-center text-text-muted text-[10px] p-8 animate-pulse">Loading {activeView} hub...</div>
          ) : filteredEntries.length === 0 ? (
            <EmptyState 
              icon={Book}
              title={`No ${activeView}s found`}
              description={`Create your first ${activeView} entry to build your knowledge base.`}
              action={{ label: `+ New ${activeView}`, onClick: openCreateModal }}
            />
          ) : (
            filteredEntries.map(entry => (
              <button
                key={entry.id}
                onClick={() => setActiveEntryId(entry.id!)}
                className={`w-full text-left p-3 rounded-card transition-all border ${
                  activeEntryId === entry.id 
                    ? 'bg-background-tertiary border-accent-green shadow-lg' 
                    : 'bg-background-secondary/40 border-border/50 hover:border-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold truncate pr-2">{entry.title}</h3>
                  {activeView === 'api' && entry.metadata_json?.method && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-background-primary border border-border uppercase">
                      {entry.metadata_json.method}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-text-muted uppercase tracking-widest">{entry.platform || 'General'}</span>
                  {entry.category && (
                    <span className="text-[9px] text-accent-green/60 uppercase tracking-widest ml-auto">• {entry.category}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Viewer Pane */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background-secondary border border-border rounded-[24px] shadow-2xl">
        {activeEntry ? (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-6 border-b border-border flex items-center justify-between bg-background-tertiary shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-accent-green bg-accent-green/10 px-2 border border-accent-green/20 rounded uppercase tracking-tighter">
                    {activeView}
                  </span>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{activeEntry.platform}</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase">{activeEntry.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openEditModal} className="p-2.5 bg-background-primary hover:bg-border text-text-muted hover:text-white rounded-standard transition-all shadow-sm"><Edit size={18} /></button>
                <button onClick={() => handleDelete(activeEntry.id!)} className="p-2.5 bg-background-primary hover:bg-accent-red/10 text-text-muted hover:text-accent-red rounded-standard transition-all shadow-sm"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
              {/* Specialized rendering for terms/APIs */}
              {activeView === 'term' && (
                <div className="mb-8 p-6 bg-background-tertiary border border-border rounded-card">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Definition</h4>
                  <p className="text-lg font-medium leading-relaxed">{activeEntry.metadata_json?.definition}</p>
                </div>
              )}

              {activeView === 'api' && (
                <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4 mb-8">
                  <div className="col-span-1 @sm:col-span-2 p-4 bg-background-tertiary border border-border rounded-card">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Endpoint</h4>
                    <code className="text-sm text-accent-blue font-mono">{activeEntry.metadata_json?.endpoint}</code>
                  </div>
                  <div className="p-4 bg-background-tertiary border border-border rounded-card text-center">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Method</h4>
                    <span className="text-lg font-black text-accent-violet">{activeEntry.metadata_json?.method}</span>
                  </div>
                </div>
              )}

              <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border" dangerouslySetInnerHTML={{ __html: activeEntry.body }} />

              {activeEntry.links && activeEntry.links.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2"><LinkIcon size={12} /> Resource Links</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {activeEntry.links.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-background-tertiary border border-border rounded-standard hover:border-accent-blue transition-colors group text-xs font-medium">
                        <span className="truncate text-accent-blue group-hover:text-white transition-colors">{link}</span>
                        <ExternalLink size={14} className="text-text-muted group-hover:text-white shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted/20 gap-4">
            <Book size={64} strokeWidth={1} />
            <p className="text-xs font-black uppercase tracking-widest">Select an entry from the registry</p>
          </div>
        )}
      </div>

      {/* Unified Editor Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`MANAGE ${activeView.toUpperCase()}`}>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin pr-2">
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
              <div className="space-y-1 col-span-1 @sm:col-span-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Title</label>
                <input className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Category</label>
                <input className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Platform</label>
                <input className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} />
              </div>
            </div>

            {activeView === 'term' && (
              <div className="p-4 bg-background-tertiary rounded-standard border border-border space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Term / Acronym</label>
                  <input className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none" value={metaTerm} onChange={e => setMetaTerm(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Short Definition</label>
                  <textarea className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none h-20" value={metaDefinition} onChange={e => setMetaDefinition(e.target.value)} />
                </div>
              </div>
            )}

            {activeView === 'api' && (
              <div className="p-4 bg-background-tertiary rounded-standard border border-border space-y-3">
                <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3">
                  <div className="col-span-1 @sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Base Endpoint</label>
                    <input className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-violet focus:outline-none" value={metaEndpoint} onChange={e => setMetaEndpoint(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Method</label>
                    <select className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-violet focus:outline-none" value={metaMethod} onChange={e => setMetaMethod(e.target.value)}>
                      <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Detailed Content (Markdown Supported)</label>
              <div className="border border-border rounded-standard overflow-hidden bg-background-primary flex flex-col h-64">
                <MenuBar editor={editor} />
                <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0d1117]"><EditorContent editor={editor} /></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Reference Links (comma separated)</label>
              <input className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none" value={newLinksStr} onChange={e => setNewLinksStr(e.target.value)} />
            </div>

            <button onClick={handleSave} disabled={!newTitle} className="w-full btn-secondary py-3 flex items-center justify-center gap-2 mt-4 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
              <Save size={16} />
              <span>{editMode ? 'UPDATE HUB ENTRY' : 'PUBLISH TO HUB'}</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default KnowledgeHub;
