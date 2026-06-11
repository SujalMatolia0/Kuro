import { useState } from 'react';
import { useAppStore } from '../../store';
import { Cpu, Search, Users, Shield, ChevronRight, Server } from 'lucide-react';

const RoleCommandCenter = () => {
  const { activeWorkspace } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { id: 'fsm', name: 'Fusion Service Manager', platform: 'Oracle Fusion', members: 3, permissions: 24 },
    { id: 'scm', name: 'Supply Chain Analyst', platform: 'Oracle Fusion', members: 5, permissions: 18 },
    { id: 'sf-admin', name: 'Salesforce Admin', platform: 'Salesforce', members: 2, permissions: 31 },
    { id: 'sf-dev', name: 'Salesforce Developer', platform: 'Salesforce', members: 4, permissions: 27 },
    { id: 'cross-1', name: 'Integration Engineer', platform: 'Both', members: 1, permissions: 42 },
  ];

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.platform.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">Select a workspace to view roles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-accent-blue uppercase">Command Center</h1>
          <p className="text-text-muted text-sm">Centralized role and permission management.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Users size={18} />
          Create Role
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search roles..."
          className="w-full bg-background-secondary border border-border rounded-standard p-3 pl-10 text-sm focus:border-accent-blue focus:outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4">
        {filtered.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id === selectedRole ? null : role.id)}
            className={`text-left p-5 rounded-standard border transition-all ${selectedRole === role.id ? 'border-accent-blue bg-accent-blue/5' : 'border-border bg-background-secondary hover:border-border-hover'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-accent-blue" />
                <h3 className="font-bold text-sm">{role.name}</h3>
              </div>
              <ChevronRight size={16} className={`text-text-muted transition-transform ${selectedRole === role.id ? 'rotate-90' : ''}`} />
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Server size={12} /> {role.platform}</span>
              <span className="flex items-center gap-1"><Users size={12} /> {role.members}</span>
              <span className="flex items-center gap-1"><Shield size={12} /> {role.permissions}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleCommandCenter;
