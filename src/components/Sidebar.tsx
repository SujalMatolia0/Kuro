import { useState, useEffect } from 'react';
import { 
  Server, Kanban, Book, 
  Archive, Code, FileText, Shield, 
  AlertCircle, CheckSquare, Bug, Settings, 
  ChevronDown, Plus, History,
  Pencil, RotateCcw, GripVertical, Eye, EyeOff
} from 'lucide-react';
import { useAppStore } from '../store';
import { workspaceQueries, navLayoutQueries } from '../db/queries';
import Modal from './Modal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  hidden?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const DEFAULT_SECTIONS: NavSection[] = [
  { id: 'workspace', label: 'PRODUCTIVITY', items: [
    { id: 'instance-dashboard', label: 'Instances', icon: Server },
    { id: 'task-tracker', label: 'Tasks', icon: Kanban },
  ]},
  { id: 'knowledge', label: 'INTELLIGENCE HUB', items: [
    { id: 'knowledge-hub', label: 'Knowledge Hub', icon: Book },
  ]},
  { id: 'dev-tools', label: 'DEVELOPMENT', items: [
    { id: 'code-library', label: 'Code Library', icon: Code },
    { id: 'code-vault', label: 'File Vault', icon: Archive },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'audit-trail', label: 'Audit Trail', icon: History },
  ]},
  { id: 'assist', label: 'ASSIST (AI)', items: [
    { id: 'permission-advisor', label: 'Permissions', icon: Shield },
    { id: 'error-decoder', label: 'Errors', icon: AlertCircle },
    { id: 'guided-checklists', label: 'Checklists', icon: CheckSquare },
    { id: 'known-issues', label: 'Issues', icon: Bug },
  ]},
];

// Icon map for restoring from persisted layout
const ICON_MAP: Record<string, any> = {
  'instance-dashboard': Server, 'task-tracker': Kanban, 'knowledge-hub': Book,
  'code-library': Code, 'code-vault': Archive, 'notes': FileText,
  'audit-trail': History, 'permission-advisor': Shield, 'error-decoder': AlertCircle,
  'guided-checklists': CheckSquare, 'known-issues': Bug,
};

// Sortable nav item component
const SortableNavItem = ({ item, isActive, onClick, isEditMode, onToggleHidden }: {
  item: NavItem; isActive: boolean; onClick: () => void; isEditMode: boolean; onToggleHidden: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : item.hidden ? 0.3 : 1,
  };
  const Icon = item.icon;

  if (item.hidden && !isEditMode) return null;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      {isEditMode && (
        <button {...attributes} {...listeners} className="p-1 cursor-grab text-text-muted/30 hover:text-text-muted active:cursor-grabbing">
          <GripVertical size={12} />
        </button>
      )}
      <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-standard text-sm transition-all group ${isActive ? 'text-accent-green bg-background-tertiary shadow-[inset_0_0_10px_rgba(0,255,159,0.05)]' : 'text-text-muted hover:text-accent-green hover:bg-background-tertiary'}`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
          <span>{item.label}</span>
        </div>
      </button>
      {isEditMode && (
        <button onClick={onToggleHidden} className="p-1 text-text-muted/40 hover:text-text-muted transition-colors">
          {item.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { activeWorkspace, workspaces, setWorkspaces, setActiveWorkspace, activeModule, setActiveModule, profile } = useAppStore();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState<NavSection[]>(DEFAULT_SECTIONS);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    loadWorkspaces();
    loadLayout();
  }, []);

  const loadWorkspaces = async () => {
    const list = await workspaceQueries.getAll();
    setWorkspaces(list);
    if (list.length > 0 && !activeWorkspace) {
      setActiveWorkspace(list[0]);
    }
  };

  const loadLayout = async () => {
    const userId = profile?.email || 'local';
    const saved = await navLayoutQueries.get(userId);
    if (saved && Array.isArray(saved)) {
      // Restore icons from the map (icons can't be serialized)
      const restored: NavSection[] = saved.map((section: any) => ({
        ...section,
        items: section.items.map((item: any) => ({
          ...item,
          icon: ICON_MAP[item.id] || Code,
        })),
      }));
      setSections(restored);
    }
  };

  const saveLayout = async (newSections: NavSection[]) => {
    const userId = profile?.email || 'local';
    // Strip icon functions before saving
    const serializable = newSections.map(s => ({
      ...s,
      items: s.items.map(i => ({ id: i.id, label: i.label, hidden: i.hidden })),
    }));
    await navLayoutQueries.save(userId, serializable);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    const colors = ['#00ff9f', '#00bfff', '#ff6b6b', '#ffa500', '#a855f7'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const created = await workspaceQueries.create(newWorkspaceName, randomColor);
    setWorkspaces([created, ...workspaces]);
    setActiveWorkspace(created);
    setIsNewModalOpen(false);
    setNewWorkspaceName('');
  };



  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newSections = sections.map(section => {
      const oldIndex = section.items.findIndex(i => i.id === active.id);
      const newIndex = section.items.findIndex(i => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        return { ...section, items: arrayMove(section.items, oldIndex, newIndex) };
      }
      return section;
    });

    setSections(newSections);
    saveLayout(newSections);
  };

  const toggleItemHidden = (sectionId: string, itemId: string) => {
    const newSections = sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map(item => 
          item.id === itemId ? { ...item, hidden: !item.hidden } : item
        ),
      };
    });
    setSections(newSections);
    saveLayout(newSections);
  };

  const resetLayout = () => {
    setSections(DEFAULT_SECTIONS);
    saveLayout(DEFAULT_SECTIONS);
    setIsEditMode(false);
  };

  // Flatten all item ids for sortable context (used inline below)
  const allItemIds = sections.flatMap(s => s.items.map(i => i.id));
  void allItemIds; // referenced in SortableContext below

  return (
    <div className="w-64 h-screen bg-background-secondary border-r border-border flex flex-col relative">


      {/* Workspace Switcher */}
      <div className="p-4 border-b border-border z-20">
        <button 
          onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
          className="w-full flex items-center justify-between p-2 rounded-standard hover:bg-background-tertiary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeWorkspace?.color || '#00ff9f' }} />
            <span className="font-bold text-sm truncate uppercase tracking-tight">
              {activeWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronDown size={14} className={`text-text-muted transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {isSwitcherOpen && (
          <div className="absolute left-4 right-4 mt-2 bg-background-tertiary border border-border rounded-standard shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setIsSwitcherOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-background-secondary transition-colors ${activeWorkspace?.id === ws.id ? 'bg-background-secondary text-accent-green' : 'text-text-primary'}`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ws.color }} />
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setIsNewModalOpen(true);
                setIsSwitcherOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-accent-green hover:bg-background-secondary border-t border-border transition-colors group"
            >
              <Plus size={16} className="group-hover:scale-110 transition-transform" />
              <span>New Workspace</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-6 scrollbar-thin">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {sections.map(section => (
            <div key={section.id} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-text-muted tracking-wider">
                {section.label}
              </h3>
              <SortableContext items={section.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {section.items.map(item => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    isActive={activeModule === item.id}
                    onClick={() => setActiveModule(item.id)}
                    isEditMode={isEditMode}
                    onToggleHidden={() => toggleItemHidden(section.id, item.id)}
                  />
                ))}
              </SortableContext>
            </div>
          ))}
        </DndContext>
      </div>

      {/* Footer / Settings + Edit Mode */}
      <div className="p-2 border-t border-border space-y-1">
        {isEditMode && (
          <button 
            onClick={resetLayout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-standard text-sm text-accent-amber hover:bg-background-tertiary transition-all"
          >
            <RotateCcw size={18} />
            <span>Reset to Default</span>
          </button>
        )}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveModule('settings')}
            className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-standard text-sm transition-all group ${activeModule === 'settings' ? 'text-accent-green bg-background-tertiary shadow-[inset_0_0_10px_rgba(0,255,159,0.05)]' : 'text-text-muted hover:text-accent-green hover:bg-background-tertiary'}`}
          >
            <Settings size={18} className={`transition-transform ${activeModule === 'settings' ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span>Settings</span>
          </button>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2 rounded-standard transition-all ${isEditMode ? 'text-accent-green bg-accent-green/10' : 'text-text-muted hover:text-text-primary hover:bg-background-tertiary'}`}
            title={isEditMode ? 'Exit Edit Mode' : 'Customize Sidebar'}
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {/* New Workspace Modal */}
      <Modal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
        title="CREATE NEW WORKSPACE"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Workspace Name</label>
            <input 
              autoFocus
              className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-green focus:outline-none transition-colors"
              placeholder="e.g. Oracle Project X"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={handleCreateWorkspace}
              className="w-full btn-primary py-3"
            >
              INITIALIZE WORKSPACE
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
