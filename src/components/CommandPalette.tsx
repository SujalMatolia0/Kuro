import { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { Command } from 'cmdk';
import { useAppStore } from '../store';
import { useWindowStore } from '../store/windowStore';
import type { ModuleId } from '../store/windowStore';
import { 
  Server, Kanban, Book, Archive, Code, FileText, Shield, 
  AlertCircle, CheckSquare, Bug, Settings, History, Search,
  ArrowRight, Command as CommandIcon, FileSearch, Hash, StickyNote,
  Cpu, Users, Map, Puzzle, Terminal
} from 'lucide-react';
import { noteQueries } from '../db/queries';
import { cloudSnippetQueries, cloudKnowledgeQueries } from '../db/cloudQueries';
import Fuse from 'fuse.js';

// ── Shared store so external components (e.g. DesktopContextMenu) can toggle ─
interface CommandPaletteStore {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteStore>()((set) => ({
  isOpen: false,
  open:   () => set({ isOpen: true }),
  close:  () => set({ isOpen: false }),
  toggle: () => set(s => ({ isOpen: !s.isOpen })),
}));

// ── Module definitions with CORRECT windowStore ModuleId values ─────────────
interface ModuleDef {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
  keywords: string;
}

const MODULES: ModuleDef[] = [
  { id: 'instances',           label: 'Instance Dashboard',   icon: Server,       group: 'Workspace',    keywords: 'instances servers projects environments' },
  { id: 'tasks',               label: 'Task Tracker',         icon: Kanban,       group: 'Workspace',    keywords: 'tasks kanban board todo' },
  { id: 'notes',               label: 'Quick Notes',          icon: FileText,     group: 'Workspace',    keywords: 'notes scratch pad' },
  { id: 'issues',              label: 'Known Issues',         icon: Bug,          group: 'Workspace',    keywords: 'bugs issues workarounds known' },
  { id: 'role-command-center', label: 'Command Center',       icon: Cpu,          group: 'Workspace',    keywords: 'command center roles cpu' },
  { id: 'knowledge',           label: 'Knowledge Base',       icon: Book,         group: 'Knowledge',    keywords: 'knowledge articles docs documentation' },
  { id: 'glossary',            label: 'Terminology Glossary', icon: Hash,         group: 'Knowledge',    keywords: 'glossary terms definitions' },
  { id: 'api-reference',       label: 'API Reference',        icon: Terminal,     group: 'Knowledge',    keywords: 'api reference endpoints specs' },
  { id: 'onboarding',          label: 'Onboarding Guide',     icon: Map,          group: 'Knowledge',    keywords: 'onboarding guide setup steps' },
  { id: 'checklists',          label: 'Guided Checklists',    icon: CheckSquare,  group: 'Knowledge',    keywords: 'checklists runbooks guides procedures' },
  { id: 'vault',               label: 'File Vault',           icon: Archive,      group: 'Library',      keywords: 'vault files upload storage assets' },
  { id: 'snippets',            label: 'Snippet Library',      icon: Code,         group: 'Library',      keywords: 'snippets components code templates' },
  { id: 'components',          label: 'Component Registry',   icon: Puzzle,       group: 'Library',      keywords: 'components ui registry' },
  { id: 'permissions',         label: 'Permission Advisor',   icon: Shield,       group: 'Security',     keywords: 'permissions roles access advisor' },
  { id: 'errors',              label: 'Error Decoder',        icon: AlertCircle,  group: 'Security',     keywords: 'errors decode logs debug' },
  { id: 'role-advisor',        label: 'Role Advisor',         icon: Users,        group: 'Security',     keywords: 'roles advisor access' },
  { id: 'audit',               label: 'Audit Trail',          icon: History,      group: 'System',       keywords: 'audit logs history trail' },
  { id: 'settings',            label: 'Settings',             icon: Settings,     group: 'System',       keywords: 'settings preferences api keys theme' },
];



interface ContentResult {
  id: string;
  title: string;
  subtitle: string;
  moduleId: ModuleId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CommandPalette = () => {
  // isOpen controlled via shared store so other components can trigger it
  const { isOpen, close: closepalette, toggle } = useCommandPaletteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [contentResults, setContentResults] = useState<ContentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { workspaces, setActiveWorkspace, activeWorkspace, profile, updateSettings } = useAppStore();
  const openWindow = useWindowStore(s => s.openWindow);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Keyboard shortcut: Ctrl/Cmd+K to toggle ───────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape' && isOpen) closepalette();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, closepalette]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else { setSearchQuery(''); setContentResults([]); }
  }, [isOpen]);

  // ── Global content search — debounced 300ms ───────────────────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQuery.length < 2) { setContentResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      const results: ContentResult[] = [];

      try {
        // Search notes (local SQLite)
        const notes = await noteQueries.getAll();
        const fuseNotes = new Fuse(notes, { keys: ['title', 'body'], threshold: 0.3 });
        fuseNotes.search(searchQuery).slice(0, 3).forEach(r => {
          results.push({ id: r.item.id, title: r.item.title, subtitle: 'Note', moduleId: 'notes', icon: StickyNote });
        });

        if (profile.email) {
          // Search snippets (cloud)
          const snippets = await cloudSnippetQueries.getAll(profile.email);
          const fuseSnippets = new Fuse(snippets, { keys: ['title', 'platform', 'tags'], threshold: 0.3 });
          fuseSnippets.search(searchQuery).slice(0, 3).forEach(r => {
            results.push({ id: r.item.id!, title: r.item.title, subtitle: `Snippet · ${r.item.platform}`, moduleId: 'snippets', icon: Code });
          });

          // Search Knowledge Base (cloud)
          const kb = await cloudKnowledgeQueries.getAll(profile.email);
          const fuseKb = new Fuse(kb, { keys: ['title', 'category', 'platform'], threshold: 0.3 });
          fuseKb.search(searchQuery).slice(0, 3).forEach(r => {
            results.push({ id: r.item.id!, title: r.item.title, subtitle: `Knowledge · ${r.item.type}`, moduleId: 'knowledge', icon: r.item.type === 'term' ? Hash : Book });
          });
        }
      } catch { /* silent — DB may not be available in dev mode */ }

      setContentResults(results);
      setIsSearching(false);
    }, 300);
  }, [searchQuery, profile.email]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openModule = (moduleId: ModuleId) => {
    openWindow(moduleId);
    closepalette();
  };

  const switchWorkspace = (ws: typeof workspaces[0]) => {
    setActiveWorkspace(ws);
    closepalette();
  };

  if (!isOpen) return null;

  // Group modules for rendering
  const grouped = MODULES.reduce((acc, mod) => {
    if (!acc[mod.group]) acc[mod.group] = [];
    acc[mod.group].push(mod);
    return acc;
  }, {} as Record<string, ModuleDef[]>);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={closepalette}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
        <Command 
          className="overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
          style={{
            background: 'rgba(26, 23, 19, 0.97)',
            border: '0.5px solid var(--b2)',
            backdropFilter: 'blur(24px)',
          }}
          label="Command Palette"
        >
          {/* Search Input */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '0.5px solid var(--b1)' }}
          >
            <Search size={16} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <Command.Input 
              ref={inputRef}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 bg-transparent text-sm placeholder:opacity-30 focus:outline-none font-medium"
              style={{ color: 'var(--t1)', fontFamily: 'var(--font-sans)' }}
              placeholder="Search modules, notes, snippets, KB…"
            />
            {isSearching && (
              <div
                className="w-3 h-3 border-2 rounded-full animate-spin shrink-0"
                style={{ borderColor: 'var(--jade)/40', borderTopColor: 'var(--jade2)' }}
              />
            )}
            <kbd
              className="hidden sm:flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded"
              style={{ color: 'var(--t3)', background: 'var(--bg3)', border: '0.5px solid var(--b1)' }}
            >
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
            <Command.Empty
              className="py-8 text-center text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--t3)' }}
            >
              No results found.
            </Command.Empty>

            {/* ── Content search results ────────────────────────────────── */}
            {contentResults.length > 0 && (
              <Command.Group
                heading="Content"
                className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                style={{ '--heading-color': 'var(--jade2)' } as React.CSSProperties}
              >
                {contentResults.map(result => (
                  <Command.Item
                    key={`content-${result.id}`}
                    value={`content ${result.title} ${result.subtitle}`}
                    onSelect={() => openModule(result.moduleId)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors group"
                    style={{ color: 'var(--t2)' }}
                  >
                    <result.icon size={14} className="shrink-0 opacity-60" />
                    <span className="flex-1 font-bold text-xs truncate">{result.title}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 shrink-0">{result.subtitle}</span>
                    <ArrowRight size={12} className="opacity-0 group-data-[selected=true]:opacity-60 transition-opacity shrink-0" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* ── Module navigation — grouped ───────────────────────────── */}
            {Object.entries(grouped).map(([groupName, items]) => (
              <Command.Group
                key={groupName}
                heading={groupName}
                className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {items.map(mod => (
                  <Command.Item
                    key={mod.id}
                    value={`${mod.label} ${mod.keywords}`}
                    onSelect={() => openModule(mod.id)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group"
                    style={{ color: 'var(--t2)' }}
                  >
                    <mod.icon size={15} className="shrink-0 opacity-50 group-data-[selected=true]:opacity-100" />
                    <span className="flex-1 font-bold text-xs uppercase tracking-wider">{mod.label}</span>
                    <ArrowRight size={11} className="opacity-0 group-data-[selected=true]:opacity-50 transition-opacity shrink-0" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}

            {/* ── Workspace switching ───────────────────────────────────── */}
            {workspaces.length > 1 && (
              <Command.Group
                heading="Switch Workspace"
                className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {workspaces.map(ws => (
                  <Command.Item
                    key={ws.id}
                    value={`workspace ${ws.name}`}
                    onSelect={() => switchWorkspace(ws)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group"
                    style={{ color: 'var(--t2)' }}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ws.color, border: '0.5px solid var(--b2)' }} />
                    <span className="flex-1 font-bold text-xs uppercase tracking-wider">{ws.name}</span>
                    {activeWorkspace?.id === ws.id && (
                      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--jade2)' }}>Active</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* ── System Actions ─────────────────────────────────────────── */}
            <Command.Group
              heading="System"
              className="[&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              <Command.Item
                value="Erase System Data Reset Everything Database Workspaces Profile"
                onSelect={async () => {
                  closepalette();
                  if (confirm('CRITICAL: Reset everything? This will delete all local data and settings permanently.')) {
                    try {
                      await (window as any).electron?.db?.resetAll();
                    } catch { /* no-op in dev */ }
                    updateSettings({ isOnboarded: false });
                    setTimeout(() => {
                      localStorage.removeItem('kuro-storage');
                      window.location.reload();
                    }, 150);
                  }
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group"
                style={{ color: 'var(--red)' }}
              >
                <AlertCircle size={15} className="shrink-0 opacity-70" />
                <span className="flex-1 font-bold text-xs uppercase tracking-wider">Erase System Data</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Danger</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: '0.5px solid var(--b1)' }}
          >
            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>
              <span className="flex items-center gap-1"><CommandIcon size={10} /> + K to toggle</span>
              <span>↑↓ navigate</span>
              <span>↵ open window</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--t3)' }}>
              <FileSearch size={10} className="inline mr-1" />searches notes · snippets · KB
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
