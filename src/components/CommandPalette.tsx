import { useState, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { useAppStore } from '../store';
import { 
  Server, Kanban, Book, Archive, Code, FileText, Shield, 
  AlertCircle, CheckSquare, Bug, Settings, History, Search,
  ArrowRight, Command as CommandIcon, FileSearch, Hash, StickyNote
} from 'lucide-react';
import { noteQueries } from '../db/queries';
import { cloudSnippetQueries, cloudKnowledgeQueries } from '../db/cloudQueries';
import Fuse from 'fuse.js';

const modules = [
  { id: 'instance-dashboard', label: 'Instance Dashboard', icon: Server, group: 'Productivity', keywords: 'instances servers projects' },
  { id: 'task-tracker', label: 'Task Tracker', icon: Kanban, group: 'Productivity', keywords: 'tasks kanban board todo' },
  { id: 'notes', label: 'Quick Notes', icon: FileText, group: 'Development', keywords: 'notes scratch pad' },
  { id: 'code-library', label: 'Code Library', icon: Code, group: 'Development', keywords: 'snippets components code' },
  { id: 'code-vault', label: 'File Vault', icon: Archive, group: 'Development', keywords: 'vault files upload storage' },
  { id: 'audit-trail', label: 'Audit Trail', icon: History, group: 'Development', keywords: 'audit logs history' },
  { id: 'knowledge-hub', label: 'Knowledge Hub', icon: Book, group: 'Intelligence', keywords: 'knowledge articles glossary api guides' },
  { id: 'guided-checklists', label: 'Guided Checklists', icon: CheckSquare, group: 'Assist', keywords: 'checklists runbooks' },
  { id: 'permission-advisor', label: 'Permission Advisor', icon: Shield, group: 'Assist', keywords: 'permissions roles access advisor' },
  { id: 'error-decoder', label: 'Error Decoder', icon: AlertCircle, group: 'Assist', keywords: 'errors decode logs debug' },
  { id: 'known-issues', label: 'Known Issues', icon: Bug, group: 'Assist', keywords: 'bugs issues workarounds' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'System', keywords: 'settings preferences api keys theme' },
];

interface ContentResult {
  id: string;
  title: string;
  subtitle: string;
  module: string;
  icon: any;
}

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentResults, setContentResults] = useState<ContentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { setActiveModule, workspaces, setActiveWorkspace, activeWorkspace, profile, updateSettings } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else { setSearchQuery(''); setContentResults([]); }
  }, [isOpen]);

  // Global content search — debounced
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQuery.length < 2) { setContentResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results: ContentResult[] = [];

      try {
        // Search notes (local)
        const notes = await noteQueries.getAll();
        const fuseNotes = new Fuse(notes, { keys: ['title', 'body'], threshold: 0.3 });
        fuseNotes.search(searchQuery).slice(0, 3).forEach(r => {
          results.push({ id: r.item.id, title: r.item.title, subtitle: 'Note', module: 'notes', icon: StickyNote });
        });

        // Search snippets (cloud)
        if (profile.email) {
          const snippets = await cloudSnippetQueries.getAll(profile.email);
          const fuseSnippets = new Fuse(snippets, { keys: ['title', 'platform', 'tags'], threshold: 0.3 });
          fuseSnippets.search(searchQuery).slice(0, 3).forEach(r => {
            results.push({ id: r.item.id!, title: r.item.title, subtitle: `Snippet · ${r.item.platform}`, module: 'code-library', icon: Code });
          });

          // Search KB (cloud)
          const kb = await cloudKnowledgeQueries.getAll(profile.email);
          const fuseKb = new Fuse(kb, { keys: ['title', 'category', 'platform'], threshold: 0.3 });
          fuseKb.search(searchQuery).slice(0, 3).forEach(r => {
            results.push({ id: r.item.id!, title: r.item.title, subtitle: `Knowledge · ${r.item.type}`, module: 'knowledge-hub', icon: r.item.type === 'term' ? Hash : Book });
          });
        }
      } catch (e) { /* silent */ }

      setContentResults(results);
      setIsSearching(false);
    }, 300);
  }, [searchQuery]);

  const navigateTo = (moduleId: string) => { setActiveModule(moduleId); setIsOpen(false); };
  const switchWorkspace = (ws: any) => { setActiveWorkspace(ws); setIsOpen(false); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
        <Command 
          className="bg-background-secondary border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          label="Command Palette"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search size={18} className="text-text-muted shrink-0" />
            <Command.Input 
              ref={inputRef}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none font-medium"
              placeholder="Search modules, notes, snippets, KB..."
            />
            {isSearching && <div className="w-3 h-3 border-2 border-accent-green/40 border-t-accent-green rounded-full animate-spin shrink-0" />}
            <kbd className="hidden sm:flex items-center gap-1 text-[9px] font-black text-text-muted bg-background-tertiary border border-border px-2 py-1 rounded uppercase tracking-widest">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto scrollbar-thin p-2">
            <Command.Empty className="py-8 text-center text-text-muted text-xs font-bold uppercase tracking-widest opacity-40">
              No results found.
            </Command.Empty>

            {/* Global content search results */}
            {contentResults.length > 0 && (
              <Command.Group heading="Content" className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-accent-green [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {contentResults.map(result => (
                  <Command.Item
                    key={`content-${result.id}`}
                    value={`content ${result.title} ${result.subtitle}`}
                    onSelect={() => navigateTo(result.module)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent-green/10 data-[selected=true]:text-accent-green text-text-muted hover:text-text-primary group"
                  >
                    <result.icon size={14} className="shrink-0 opacity-60 group-data-[selected=true]:opacity-100" />
                    <span className="flex-1 font-bold text-xs truncate">{result.title}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 shrink-0">{result.subtitle}</span>
                    <ArrowRight size={12} className="opacity-0 group-data-[selected=true]:opacity-60 transition-opacity shrink-0" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Module Navigation */}
            <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
              {modules.map(mod => (
                <Command.Item
                  key={mod.id}
                  value={`${mod.label} ${mod.keywords}`}
                  onSelect={() => navigateTo(mod.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent-green/10 data-[selected=true]:text-accent-green text-text-muted hover:text-text-primary group"
                >
                  <mod.icon size={16} className="shrink-0 opacity-60 group-data-[selected=true]:opacity-100" />
                  <span className="flex-1 font-bold text-xs uppercase tracking-wider">{mod.label}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-30">{mod.group}</span>
                  <ArrowRight size={12} className="opacity-0 group-data-[selected=true]:opacity-60 transition-opacity" />
                </Command.Item>
              ))}
            </Command.Group>

            {/* Workspace Switching */}
            {workspaces.length > 1 && (
              <Command.Group heading="Switch Workspace" className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {workspaces.map(ws => (
                  <Command.Item
                    key={ws.id}
                    value={`workspace ${ws.name}`}
                    onSelect={() => switchWorkspace(ws)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent-blue/10 data-[selected=true]:text-accent-blue text-text-muted hover:text-text-primary group"
                  >
                    <div className="w-3 h-3 rounded-full shrink-0 border border-border" style={{ backgroundColor: ws.color }} />
                    <span className="flex-1 font-bold text-xs uppercase tracking-wider">{ws.name}</span>
                    {activeWorkspace?.id === ws.id && (
                      <span className="text-[8px] font-black text-accent-green uppercase tracking-widest">Active</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* System Actions */}
            <Command.Group heading="System" className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:text-accent-red [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
              <Command.Item
                value="Erase System Data Reset Everything Refresh Database Removes Workspaces Profile"
                onSelect={async () => {
                  setIsOpen(false);
                  if (confirm('CRITICAL: Reset everything? This will delete all local data and settings permanently.')) {
                    try {
                      await (window as any).electron.db.resetAll();
                    } catch (e) {
                      console.error('Failed to reset DB:', e);
                    }
                    updateSettings({ isOnboarded: false }); 
                    setTimeout(() => {
                      localStorage.removeItem('kuro-storage'); // The store persist name is kuro-storage based on store.ts
                      window.location.reload();
                    }, 150);
                  }
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent-red/10 data-[selected=true]:text-accent-red text-text-muted hover:text-text-primary group"
              >
                <AlertCircle size={16} className="shrink-0 opacity-60 group-data-[selected=true]:opacity-100 text-accent-red" />
                <span className="flex-1 font-bold text-xs uppercase tracking-wider text-accent-red">Erase System Data</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 text-accent-red">Danger</span>
                <ArrowRight size={12} className="opacity-0 group-data-[selected=true]:opacity-60 transition-opacity" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-4 text-[9px] font-bold text-text-muted/40 uppercase tracking-widest">
              <span className="flex items-center gap-1"><CommandIcon size={10} /> + K to toggle</span>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
            </div>
            <span className="text-[9px] text-text-muted/30 uppercase tracking-widest">
              <FileSearch size={10} className="inline mr-1" />searches notes · snippets · KB
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
