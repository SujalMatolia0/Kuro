import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import { 
  Code, Plus, Search, Tag, Copy, Trash2, 
  CheckCircle2, Cloud, CloudUpload, CloudOff, RotateCw,
  Layers, Terminal, Layout
} from 'lucide-react';
import { localSnippetQueries } from '../../db/queries';
import { pushSnippetToCloud } from '../../lib/sync';
import { getHighlighter } from '../../utils/shiki';
import Fuse from 'fuse.js';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

type CodeType = 'snippet' | 'component';

const CodeLibrary = () => {
  const { profile, activeWorkspace } = useAppStore();
  const [activeType, setActiveType] = useState<CodeType>('snippet');
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isCopied, setIsCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLanguage, setNewLanguage] = useState('javascript');
  const [newPlatform, setNewPlatform] = useState('Fusion');
  const [newTagsStr, setNewTagsStr] = useState('');

  useEffect(() => {
    loadItems();
  }, [activeType]);

  const loadItems = async () => {
    setIsLoading(true);
    const data = await localSnippetQueries.getAll();
    // Filter by type locally
    const filteredByType = data.filter((item: any) => (item.type || 'snippet') === activeType);
    setItems(filteredByType);
    
    if (filteredByType.length > 0 && !activeId) {
      setActiveId(filteredByType[0].id);
    } else if (filteredByType.length === 0) {
      setActiveId(null);
    }
    setIsLoading(false);
  };

  const activeItem = useMemo(() => 
    items.find(s => s.id === activeId),
  [items, activeId]);

  useEffect(() => {
    if (!activeItem) {
      setHighlightedHtml('');
      return;
    }
    
    const highlight = async () => {
      const highlighter = await getHighlighter();
      if (highlighter) {
        try {
          const html = highlighter.codeToHtml(activeItem.code, {
            lang: activeItem.language,
            theme: 'aurora-x'
          });
          setHighlightedHtml(html);
        } catch (e) {
          setHighlightedHtml(`<pre><code>${activeItem.code}</code></pre>`);
        }
      }
    };
    highlight();
  }, [activeItem]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const fuse = new Fuse(items, { keys: ['title', 'platform', 'tags', 'language'], threshold: 0.3 });
    return fuse.search(searchQuery).map(result => result.item);
  }, [items, searchQuery]);

  const handleCopy = () => {
    if (!activeItem) return;
    navigator.clipboard.writeText(activeItem.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!newTitle || !newCode) return;
    
    const created = await localSnippetQueries.create({
      workspaceId: activeWorkspace?.id || 'global',
      title: newTitle,
      code: newCode,
      language: newLanguage,
      platform: newPlatform,
      tags: newTagsStr,
      type: activeType
    }, profile.email);
    
    if (created) {
      loadItems();
      setActiveId(created.id);
      setIsModalOpen(false);
      
      setNewTitle('');
      setNewCode('');
      setNewTagsStr('');
    }
  };

  const handlePushSync = async () => {
    if (!activeId || !profile.email) return;
    setIsSyncing(true);
    const result = await pushSnippetToCloud(activeId, profile.email);
    if (result.success) {
      loadItems();
    } else {
      alert("Sync failed: " + result.error);
    }
    setIsSyncing(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this ${activeType}? (Local only)`)) {
      await localSnippetQueries.delete(id, profile.email);
      loadItems();
      if (activeId === id) setActiveId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col sm:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500 pb-4">
      {/* Left Pane - List */}
      <div className="w-full sm:w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeType === 'snippet' ? <Terminal className="text-accent-blue" size={24} /> : <Layers className="text-purple-400" size={24} />}
            <h1 className="text-2xl font-black tracking-tighter uppercase whitespace-nowrap">
              {activeType === 'snippet' ? 'Snippets' : 'Components'}
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`p-2 bg-background-tertiary border border-border rounded-standard transition-colors ${
              activeType === 'snippet' ? 'text-accent-blue' : 'text-purple-400'
            } hover:text-white`}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-background-secondary p-1 rounded-standard border border-border">
          <button 
            onClick={() => setActiveType('snippet')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-standard text-[10px] font-black tracking-widest transition-all ${
              activeType === 'snippet' ? 'bg-background-tertiary text-accent-blue shadow-lg border border-border' : 'text-text-muted hover:text-white'
            }`}
          >
            <Terminal size={12} /> SNIPPETS
          </button>
          <button 
            onClick={() => setActiveType('component')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-standard text-[10px] font-black tracking-widest transition-all ${
              activeType === 'component' ? 'bg-background-tertiary text-purple-400 shadow-lg border border-border' : 'text-text-muted hover:text-white'
            }`}
          >
            <Layers size={12} /> COMPONENTS
          </button>
        </div>

        <div className="flex items-center gap-2 bg-background-secondary border border-border rounded-standard px-3 py-2">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            placeholder={`Search ${activeType}s...`}
            className="bg-transparent border-none text-sm w-full focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-2">
          {isLoading ? (
            <div className="text-center text-text-muted text-xs p-4 animate-pulse">Loading library...</div>
          ) : filteredItems.length === 0 ? (
            <EmptyState 
              icon={Code}
              title={`No ${activeType}s found`}
              description={`Add your first ${activeType} to start building your reusable library.`}
              action={{ label: `+ New ${activeType}`, onClick: () => setIsModalOpen(true) }}
            />
          ) : (
            filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id!)}
                className={`w-full text-left p-3 rounded-card transition-all border ${
                  activeId === item.id 
                    ? `bg-background-tertiary border-${activeType === 'snippet' ? 'accent-blue' : 'purple-400'}` 
                    : 'bg-background-secondary/50 border-border hover:border-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold truncate">{item.title}</h3>
                  {item.is_synced ? (
                    <Cloud size={10} className="text-accent-green opacity-50" />
                  ) : (
                    <CloudOff size={10} className="text-amber-500 opacity-50" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${activeType === 'snippet' ? 'text-accent-blue' : 'text-purple-400'}`}>
                    {item.language}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase tracking-widest truncate max-w-20">
                    {item.platform}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Viewer */}
      <div className="w-full sm:w-2/3 bg-background-secondary border border-border rounded-[24px] flex flex-col overflow-hidden shadow-2xl">
        {activeItem ? (
          <>
            <div className="p-5 border-b border-border flex items-center justify-between bg-background-tertiary">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-background-primary border border-border ${activeType === 'snippet' ? 'text-accent-blue' : 'text-purple-400'}`}>
                   {activeType === 'snippet' ? <Terminal size={24} /> : <Layout size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{activeItem.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {activeItem.tags?.split(',').map((tag: string, idx: number) => tag.trim() && (
                       <span key={idx} className="flex items-center gap-1 text-[9px] font-bold text-text-muted bg-background-primary px-2 py-0.5 border border-border rounded-full uppercase tracking-widest">
                         <Tag size={8} /> {tag}
                       </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePushSync}
                  disabled={activeItem.is_synced || isSyncing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-standard text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeItem.is_synced 
                      ? 'bg-accent-green/10 text-accent-green cursor-default' 
                      : 'bg-accent-blue hover:bg-accent-blue/80 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {isSyncing ? <RotateCw size={12} className="animate-spin" /> : <CloudUpload size={12} />}
                  {activeItem.is_synced ? 'Synced' : 'Push'}
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-background-primary border border-border text-white hover:bg-background-secondary px-3 py-1.5 rounded-standard transition-all"
                >
                  {isCopied ? <CheckCircle2 size={14} className="text-accent-green" /> : <Copy size={14} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{isCopied ? 'COPIED' : 'COPY'}</span>
                </button>
                <button 
                  onClick={() => handleDelete(activeItem.id!)}
                  className="p-1.5 hover:bg-accent-red/10 text-text-muted hover:text-accent-red rounded-standard transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 bg-[#0d1117] scrollbar-thin overflow-x-auto relative group">
              <div className="absolute top-4 right-4 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em] pointer-events-none">
                {activeItem.language}
              </div>
              {highlightedHtml ? (
                <div 
                  className="text-sm font-mono [&_pre]:!bg-transparent [&_pre]:!m-0 p-6"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }} 
                />
              ) : (
                <pre className="text-sm font-mono text-text-muted p-6"><code>{activeItem.code}</code></pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted/20 gap-4">
            <Code size={64} strokeWidth={1} />
            <p className="text-xs font-black uppercase tracking-widest">Select an entry from the library</p>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`CREATE NEW ${activeType.toUpperCase()}`}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Title</label>
              <input 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                placeholder={`e.g. ${activeType === 'snippet' ? 'JWT Interceptor' : 'Reusable Hero Section'}`}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Language</label>
                <select 
                  className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                  value={newLanguage}
                  onChange={e => setNewLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="apex">Apex</option>
                  <option value="sql">SQL / SOQL</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML / XSLT</option>
                  <option value="python">Python</option>
                  <option value="tsx">TSX (React)</option>
                </select>
               </div>
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Platform</label>
                <input 
                  className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                  placeholder="e.g. OIC, Salesforce, Custom"
                  value={newPlatform}
                  onChange={e => setNewPlatform(e.target.value)}
                />
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Code Block</label>
              <textarea 
                className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm font-mono h-48 focus:border-accent-blue focus:outline-none scrollbar-thin"
                placeholder="Paste your reusable code here..."
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tags (comma separated)</label>
              <input 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                placeholder="auth, security, helper"
                value={newTagsStr}
                onChange={e => setNewTagsStr(e.target.value)}
              />
            </div>

            <button 
              onClick={handleCreate}
              disabled={!newTitle || !newCode}
              className={`w-full btn-primary py-3 mt-4 disabled:opacity-50 !bg-${activeType === 'snippet' ? 'accent-blue' : 'purple-500'}`}
            >
              SAVE LOCALLY
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CodeLibrary;
