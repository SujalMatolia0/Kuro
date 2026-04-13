import React from 'react';
import Sidebar from './components/Sidebar';
import { useAppStore } from './store';
import InstanceDashboard from './modules/instance-dashboard';
import Settings from './modules/settings';
import OnboardingWizard from './modules/onboarding/OnboardingWizard';
import QuickNotes from './modules/notes';

function App() {
  const { activeModule, activeWorkspace, settings } = useAppStore();

  if (!settings.isOnboarded) {
    return <OnboardingWizard />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'instance-dashboard':
        return <InstanceDashboard />;
      case 'task-tracker':
        return <div className="p-8">Task Tracker Component Coming Soon</div>;
      case 'notes':
        return <QuickNotes />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <h2 className="text-2xl font-bold text-text-muted uppercase tracking-tighter mb-2">Module Under Development</h2>
            <p className="text-sm text-text-muted/60">This feature is coming in a future phase.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background-primary text-text-primary overflow-hidden selection:bg-accent-green/30 selection:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar / Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background-primary/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black tracking-widest text-text-muted uppercase">
              {activeModule.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 bg-background-secondary border border-border rounded-full transition-all duration-500 ${activeWorkspace ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-[10px] font-black text-text-muted tracking-wide uppercase">CONNECTED</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-background-tertiary border border-border flex items-center justify-center overflow-hidden hover:border-accent-green transition-colors cursor-pointer group">
              <span className="text-xs font-black text-accent-green group-hover:scale-110 transition-transform">DC</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="max-w-6xl mx-auto h-full">
            {renderModule()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
