import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { useAppStore } from '../../store';
import { instanceQueries } from '../../db/queries';
import InstanceCard from './components/InstanceCard';
import InstanceForm from './components/InstanceForm';
import EmptyState from '../../components/EmptyState';
import { Server } from 'lucide-react';

const InstanceDashboard = () => {
  const { activeWorkspace } = useAppStore();
  const [instances, setInstances] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (activeWorkspace) {
      loadInstances();
    }
  }, [activeWorkspace]);

  const loadInstances = async () => {
    setIsRefreshing(true);
    const list = await instanceQueries.getByWorkspace(activeWorkspace.id);
    setInstances(list);
    setRefreshKey(prev => prev + 1);
    setIsRefreshing(false);
  };

  const projectInstances = instances.filter(i => i.type === 'project');
  const demoInstances = instances.filter(i => i.type === 'demo');

  if (!activeWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">Select a workspace to view instances.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-accent-green uppercase">
            Instance Dashboard
          </h1>
          <p className="text-text-muted text-sm">Manage and monitor your project environments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadInstances}
            className={`p-2 rounded-standard border border-border hover:bg-background-tertiary transition-all ${isRefreshing ? 'animate-spin text-accent-green' : 'text-text-muted'}`}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>ADD INSTANCE</span>
          </button>
        </div>
      </div>

      {instances.length === 0 ? (
        <EmptyState 
          icon={Server}
          title="No Instances Found"
          description="You haven't added any environments to this workspace yet."
          action={{
            label: "ADD YOUR FIRST INSTANCE",
            onClick: () => setIsFormOpen(true)
          }}
        />
      ) : (
        <div className="space-y-12">
          {projectInstances.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-accent-blue rounded-full" />
                <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Project Environments</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectInstances.map(instance => (
                  <InstanceCard key={instance.id} instance={instance} onUpdate={loadInstances} refreshKey={refreshKey} />
                ))}
              </div>
            </section>
          )}

          {demoInstances.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-accent-amber rounded-full" />
                <h2 className="text-xs font-bold text-text-muted tracking-widest uppercase">Demo & Sandbox</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoInstances.map(instance => (
                  <InstanceCard key={instance.id} instance={instance} onUpdate={loadInstances} refreshKey={refreshKey} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {isFormOpen && (
        <InstanceForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={loadInstances}
        />
      )}
    </div>
  );
};

export default InstanceDashboard;
