import React from 'react';
import { Shield, Key, RefreshCcw, Globe, Monitor } from 'lucide-react';
import { useAppStore } from '../../store';

const Settings = () => {
  const { settings, updateSettings, setUnlocked } = useAppStore();

  const handleResetPin = () => {
    if (confirm('Are you sure you want to reset your Security PIN? All "Remember Password" credentials will need to be re-entered for security reasons.')) {
      updateSettings({ pinHash: undefined });
      setUnlocked(false);
      alert('Security PIN has been cleared. You will be prompted to set a new one when accessing sensitive features.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-accent-green uppercase">
          Settings
        </h1>
        <p className="text-text-muted text-sm">Configure your development environment and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security Section */}
        <div className="card space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-accent-green" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Security & Privacy</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-background-primary border border-border rounded-standard flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Security PIN</h3>
                <p className="text-[10px] text-text-muted">Currently {settings.pinHash ? 'ACTIVE' : 'NOT SET'}</p>
              </div>
              <button 
                onClick={handleResetPin}
                className="text-[10px] font-bold text-accent-red hover:underline uppercase tracking-widest"
              >
                {settings.pinHash ? 'Reset PIN' : 'Setup Required'}
              </button>
            </div>

            <div className="p-4 bg-background-primary border border-border rounded-standard flex items-center justify-between opacity-50 cursor-not-allowed">
              <div>
                <h3 className="text-sm font-bold">Auto-Lock Session</h3>
                <p className="text-[10px] text-text-muted">Locks credentials after 30 mins</p>
              </div>
              <div className="w-8 h-4 bg-background-tertiary rounded-full relative">
                <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="card space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="text-accent-blue" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Global Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Preferred Browser</label>
              <select 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none"
                value={settings.preferredBrowser}
                onChange={(e) => updateSettings({ preferredBrowser: e.target.value })}
              >
                <option value="Default System Browser">Default System Browser</option>
                <option value="Google Chrome">Google Chrome</option>
                <option value="Microsoft Edge">Microsoft Edge</option>
                <option value="Firefox">Mozilla Firefox</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">AI Provider</label>
              <select 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-green focus:outline-none"
                value={settings.aiProvider}
                onChange={(e) => updateSettings({ aiProvider: e.target.value })}
              >
                <option value="gemini">Google Gemini (Free Tier)</option>
                <option value="openai">OpenAI (API Key)</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-accent-red/20 bg-accent-red/5 space-y-6">
        <div className="flex items-center gap-2 mb-2 text-accent-red">
          <AlertOctagon size={20} />
          <h2 className="text-sm font-bold uppercase tracking-widest">Danger Zone</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-background-primary/50 border border-accent-red/10 rounded-standard">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-accent-red">Reset Application</h3>
            <p className="text-[10px] text-text-muted">Delete all workspaces, instances, credentials, and settings. This cannot be undone.</p>
          </div>
          <button 
            onClick={async () => {
              if (confirm('CRITICAL: Reset everything? This will delete all data and settings permanently.')) {
                await window.electron.db.resetAll();
                localStorage.removeItem('dev-companion-storage');
                window.location.reload();
              }
            }}
            className="btn-primary bg-accent-red hover:bg-accent-red/80 border-none py-2 px-6 text-[10px] font-black tracking-widest"
          >
            RESET ALL DATA
          </button>
        </div>
      </div>
    </div>
  );
};

import { AlertOctagon } from 'lucide-react';

export default Settings;
