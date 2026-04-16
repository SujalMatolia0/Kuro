import React from 'react';
import Sidebar from './components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import InstanceDashboard from './modules/instance-dashboard';
import Settings from './modules/settings';
import OnboardingWizard from './modules/onboarding/OnboardingWizard';
import QuickNotes from './modules/notes';
import TaskTracker from './modules/task-tracker';
import CodeLibrary from './modules/snippets';
import CodeVault from './modules/vault';
import AuditModule from './modules/audit';
import KnowledgeHub from './modules/knowledge/KnowledgeHub';
import Checklists from './modules/knowledge/Checklists';
import ErrorDecoder from './modules/assist/ErrorDecoder';
import PermissionAdvisor from './modules/assist/PermissionAdvisor';
import KnownIssues from './modules/assist/KnownIssues';
import CommandPalette from './components/CommandPalette';
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts';

import { performAuditCleanup } from './lib/audit';
import { cloudProfileQueries } from './db/cloudQueries';
import { autoSyncNotes } from './lib/sync';

function App() {
  const { activeModule, activeWorkspace, settings, profile } = useAppStore();
  useKeyboardShortcuts();

  // Apply theme class to document
  React.useEffect(() => {
    document.documentElement.classList.toggle(
      'light',
      settings.theme === 'light',
    );
    document.documentElement.classList.toggle(
      'dark',
      settings.theme !== 'light',
    );
  }, [settings.theme]);

  React.useEffect(() => {
    // 1. Run maintenance tasks on startup
    performAuditCleanup();

    // 2. Ensure profile exists in cloud for sync capabilities
    if (settings.isOnboarded && profile.email) {
      cloudProfileQueries.syncProfile(profile);

      // 3. Auto-sync: Pull from cloud + push unsynced notes
      autoSyncNotes(profile.email);
    }
  }, [settings.isOnboarded, profile.email]);

  if (!settings.isOnboarded) {
    return <OnboardingWizard />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'instance-dashboard':
        return <InstanceDashboard />;
      case 'task-tracker':
        return <TaskTracker />;
      case 'notes':
        return <QuickNotes />;
      case 'code-library':
        return <CodeLibrary />;
      case 'code-vault':
        return <CodeVault />;
      case 'audit-trail':
        return <AuditModule />;
      case 'knowledge-hub':
        return <KnowledgeHub />;
      case 'guided-checklists':
        return <Checklists />;
      case 'error-decoder':
        return <ErrorDecoder />;
      case 'permission-advisor':
        return <PermissionAdvisor />;
      case 'known-issues':
        return <KnownIssues />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <h2 className="text-2xl font-bold text-text-muted uppercase tracking-tighter mb-2">
              Module Under Development
            </h2>
            <p className="text-sm text-text-muted/60">
              This feature is coming in a future phase.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background-primary text-text-primary overflow-hidden selection:bg-accent-green/30 selection:text-white">
      {/* Command Palette */}
      <CommandPalette />

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
            <div
              className={`flex items-center gap-2 px-3 py-1 bg-background-secondary border border-border rounded-full transition-all duration-500 ${activeWorkspace ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-[10px] font-black text-text-muted tracking-wide uppercase">
                CONNECTED
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-background-tertiary border border-border flex items-center justify-center overflow-hidden hover:border-accent-green transition-colors cursor-pointer group">
              <span className="text-xs font-black text-accent-green group-hover:scale-110 transition-transform">
                K
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <div className="max-w-6xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="h-full"
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
