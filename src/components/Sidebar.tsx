import React, { useState, useEffect } from 'react';
import { 
  Server, Kanban, Book, Hash, Map, Plug, 
  Archive, Code, Layers, FileText, Shield, 
  AlertCircle, CheckSquare, Bug, Settings, 
  ChevronDown, Plus, Globe
} from 'lucide-react';
import { useAppStore } from '../store';
import { workspaceQueries } from '../db/queries';
import Modal from './Modal';

const Sidebar = () => {
  const { activeWorkspace, workspaces, setWorkspaces, setActiveWorkspace, activeModule, setActiveModule } = useAppStore();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    const list = await workspaceQueries.getAll();
    setWorkspaces(list);
    if (list.length > 0 && !activeWorkspace) {
      setActiveWorkspace(list[0]);
    }
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

  const sections = [
    { id: 'workspace', label: 'WORKSPACE', items: [
      { id: 'instance-dashboard', label: 'Instances', icon: Server },
      { id: 'task-tracker', label: 'Tasks', icon: Kanban },
    ]},
    // ... other sections remain the same (folded for brevity in thought, but I will include them)
    { id: 'knowledge', label: 'KNOWLEDGE', items: [
      { id: 'knowledge-base', label: 'Knowledge', icon: Book },
      { id: 'glossary', label: 'Glossary', icon: Hash },
      { id: 'onboarding-guide', label: 'Onboarding', icon: Map },
      { id: 'api-reference', label: 'API Ref', icon: Plug },
    ]},
    { id: 'dev-tools', label: 'DEV TOOLS', items: [
      { id: 'code-vault', label: 'File Vault', icon: Archive },
      { id: 'snippet-library', label: 'Snippets', icon: Code },
      { id: 'component-registry', label: 'Components', icon: Layers },
      { id: 'notes', label: 'Notes', icon: FileText },
    ]},
    { id: 'assist', label: 'ASSIST', items: [
      { id: 'permission-advisor', label: 'Permissions', icon: Shield },
      { id: 'error-decoder', label: 'Errors', icon: AlertCircle },
      { id: 'guided-checklists', label: 'Checklists', icon: CheckSquare },
      { id: 'known-issues', label: 'Issues', icon: Bug },
    ]},
  ];

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
        {sections.map(section => (
          <div key={section.id} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-text-muted tracking-wider">
              {section.label}
            </h3>
            {section.items.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-standard text-sm transition-all group ${activeModule === item.id ? 'text-accent-green bg-background-tertiary shadow-[inset_0_0_10px_rgba(0,255,159,0.05)]' : 'text-text-muted hover:text-accent-green hover:bg-background-tertiary'}`}
              >
                <item.icon size={18} className={`transition-transform ${activeModule === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer / Settings */}
      <div className="p-2 border-t border-border">
        <button 
          onClick={() => setActiveModule('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-standard text-sm transition-all group ${activeModule === 'settings' ? 'text-accent-green bg-background-tertiary shadow-[inset_0_0_10px_rgba(0,255,159,0.05)]' : 'text-text-muted hover:text-accent-green hover:bg-background-tertiary'}`}
        >
          <Settings size={18} className={`transition-transform ${activeModule === 'settings' ? 'scale-110' : 'group-hover:scale-110'}`} />
          <span>Settings</span>
        </button>
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
          <button 
            onClick={handleCreateWorkspace}
            className="w-full btn-primary py-3"
          >
            INITIALIZE WORKSPACE
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
