import { Shield, Monitor, AlertOctagon, Cpu, Key, CheckCircle2, XCircle, RefreshCw, Download, Upload, Sun, Moon, Users, UserPlus, Trash2, Keyboard } from 'lucide-react';
import { useAppStore } from '../../store';
import { useState, useRef } from 'react';
import { getAIService } from '../../lib/ai';
import { SHORTCUTS } from '../../utils/useKeyboardShortcuts';
import { exportBackup, importBackup } from '../../utils/backup';
import { supabase } from '../../lib/supabase';

const Settings = () => {
  const { settings, updateSettings, setUnlocked, profile } = useAppStore();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team management state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  const handleResetPin = () => {
    if (confirm('Are you sure you want to reset your Security PIN? This will log you out and require you to set a new PIN via the setup wizard.')) {
      updateSettings({ pinHash: undefined, isOnboarded: false });
      setUnlocked(false);
      setTimeout(() => {
        window.location.reload();
      }, 150);
    }
  };



  const testConnection = async (provider: string = 'groq') => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const ai = getAIService(provider as any);
      const response = await ai.generateResponse("Hello, reply only with the word 'READY' if you can hear me.", "Connectivity Test");
      
      if (response && (response.includes('READY') || response.length > 0)) {
        setTestResult({ status: 'success', message: `${provider.toUpperCase()} AI is connected and ready!` });
      } else {
        setTestResult({ status: 'error', message: response || 'No response from AI.' });
      }
    } catch (e: any) {
      setTestResult({ status: 'error', message: e.message || 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportBackup();
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportResult({ status: 'idle', message: '' });
    
    const result = await importBackup(file);
    setImportResult({ status: result.success ? 'success' : 'error', message: result.message });
    setIsImporting(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const loadTeamMembers = async () => {
    setIsLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
      if (!error && data) setTeamMembers(data);
    } catch (e) {
      console.error('Failed to load team:', e);
    }
    setIsLoadingTeam(false);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: inviteEmail.trim(),
        role: inviteRole,
        team_id: 'default',
      });
      if (error) {
        alert('Invite failed: ' + error.message);
      } else {
        setInviteEmail('');
        loadTeamMembers();
      }
    } catch (e: any) {
      alert('Invite failed: ' + e.message);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
      loadTeamMembers();
    } catch (e: any) {
      alert('Role change failed: ' + e.message);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return;
    try {
      await supabase.from('profiles').delete().eq('id', memberId);
      loadTeamMembers();
    } catch (e: any) {
      alert('Removal failed: ' + e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
          System Settings
        </h1>
        <p className="text-text-muted text-sm mt-1 uppercase tracking-widest font-black opacity-60">Global configuration & security</p>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
        
        {/* Left Col: Preferences & Security */}
        <div className="@lg:col-span-1 space-y-8">
          {/* Security Section */}
          <div className="bg-background-secondary border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="text-accent-green" size={20} />
              <h2 className="text-xs font-black uppercase tracking-widest">Security & Privacy</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-background-primary border border-border rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-tight">Security PIN</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Currently {settings.pinHash ? 'ACTIVE' : 'NOT SET'}</p>
                </div>
                <button 
                  onClick={handleResetPin}
                  className="text-[10px] font-black text-accent-red hover:underline uppercase tracking-widest"
                >
                  {settings.pinHash ? 'Reset' : 'Setup'}
                </button>
              </div>

              <div className="p-4 bg-background-primary border border-border rounded-2xl flex items-center justify-between opacity-30 cursor-not-allowed grayscale">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-tight text-white">Auto-Lock</h3>
                  <p className="text-[10px] text-text-muted">Session timing</p>
                </div>
                <div className="w-8 h-4 bg-background-tertiary rounded-full relative">
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-text-muted" />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-background-secondary border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Monitor className="text-accent-blue" size={20} />
              <h2 className="text-xs font-black uppercase tracking-widest">Preferences</h2>
            </div>
            
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Appearance</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${settings.theme === 'dark' ? 'bg-background-tertiary border-accent-green text-accent-green shadow-lg shadow-green-500/10' : 'bg-background-primary border-border text-text-muted'}`}
                  >
                    <Moon size={14} /> Dark
                  </button>
                  <button 
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${settings.theme === 'light' ? 'bg-background-tertiary border-accent-amber text-accent-amber shadow-lg shadow-amber-500/10' : 'bg-background-primary border-border text-text-muted'}`}
                  >
                    <Sun size={14} /> Light
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Preferred Browser</label>
                <select 
                  className="w-full bg-background-primary border border-border rounded-xl p-3 text-xs font-bold focus:outline-none transition-all cursor-pointer"
                  value={settings.preferredBrowser}
                  onChange={(e) => updateSettings({ preferredBrowser: e.target.value })}
                >
                  <option value="Default System Browser">System Default</option>
                  <option value="Google Chrome">Google Chrome</option>
                  <option value="Microsoft Edge">Microsoft Edge</option>
                  <option value="Firefox">Mozilla Firefox</option>
                </select>
              </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Content Strategy</label>
                    <div className="grid grid-cols-1 gap-2">
                       <button 
                        onClick={() => updateSettings({ aiProvider: 'groq' })}
                        className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${settings.aiProvider === 'groq' ? 'bg-accent-red/10 border-accent-red text-accent-red shadow-lg shadow-red-500/10' : 'bg-background-primary border-border text-text-muted'}`}
                       >
                         Groq Powered (Fastest)
                       </button>
                       <button 
                        onClick={() => updateSettings({ aiProvider: 'manual' })}
                        className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${settings.aiProvider === 'manual' ? 'bg-accent-green/10 border-accent-green text-accent-green shadow-lg shadow-green-500/10' : 'bg-background-primary border-border text-text-muted'}`}
                       >
                         Database Only
                       </button>
                    </div>
                  </div>
            </div>
          </div>

          {/* Export / Import */}
          <div className="bg-background-secondary border border-border rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Download className="text-accent-amber" size={20} />
              <h2 className="text-xs font-black uppercase tracking-widest">Data Backup</h2>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 p-3 bg-background-primary border border-border rounded-xl text-xs font-black uppercase tracking-widest text-text-muted hover:text-accent-green hover:border-accent-green/30 transition-all"
              >
                <Download size={14} /> Export All Data (JSON)
              </button>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-background-primary border border-dashed border-border rounded-xl text-xs font-black uppercase tracking-widest text-text-muted hover:text-accent-blue hover:border-accent-blue/30 transition-all disabled:opacity-50"
                >
                  {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {isImporting ? 'Importing...' : 'Import Backup File'}
                </button>
              </div>


              {importResult.status !== 'idle' && (
                <div className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in duration-300 ${importResult.status === 'success' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
                  {importResult.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {importResult.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: AI, Team, Shortcuts */}
        <div className="@lg:col-span-2 space-y-8">
           <div className="bg-background-secondary border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white uppercase">API Intelligence</h2>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-black opacity-60">Personal AI configuration</p>
                </div>
              </div>

              <div className="space-y-8">


                  {/* Groq Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Groq API Key</label>
                       <a 
                        href="https://console.groq.com/keys" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[8px] font-black uppercase tracking-widest text-accent-red hover:underline"
                       >
                         Get Official Key
                       </a>
                    </div>
                    <div className="relative">
                       <input 
                         type="password"
                         className="w-full bg-background-primary border border-border rounded-2xl p-4 text-xs font-bold focus:outline-none transition-all placeholder:text-text-muted/20"
                         placeholder="Enter your Groq API key..."
                         value={settings.groqKey || ''}
                         onChange={(e) => updateSettings({ groqKey: e.target.value })}
                       />
                       <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/20" size={16} />
                    </div>
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between gap-4">
                       <div className="flex items-center gap-3 text-accent-red">
                          <Cpu size={18} />
                          <p className="text-[10px] font-medium leading-relaxed italic opacity-80 uppercase tracking-tight">Llama 3.3 Powered. Extremely fast results for diagnostics and solutions.</p>
                       </div>
                       <button 
                         onClick={() => testConnection('groq')}
                         disabled={isTesting || !settings.groqKey && !import.meta.env.VITE_GROQ_API_KEY}
                         className="shrink-0 bg-red-500/10 hover:bg-red-500/20 text-accent-red px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                       >
                         {isTesting ? <RefreshCw className="animate-spin" size={12} /> : "Test Status"}
                       </button>
                    </div>

                    {testResult.status !== 'idle' && settings.aiProvider === 'groq' && (
                       <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${testResult.status === 'success' ? 'bg-accent-green/10 border border-accent-green/20 text-accent-green' : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'}`}>
                          {testResult.status === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          <p className="text-[10px] font-black uppercase tracking-widest">{testResult.message}</p>
                       </div>
                    )}
                 </div>

                 {/* OpenAI & Anthropic (Future Proofing) */}
                 <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                    <div className="space-y-2 opacity-40">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">OpenAI Key (COMING SOON)</label>
                       <input 
                         disabled
                         type="password"
                         className="w-full bg-background-primary/50 border border-dashed border-border rounded-2xl p-4 text-xs font-bold cursor-not-allowed"
                         placeholder="sk-..."
                       />
                    </div>
                    <div className="space-y-2 opacity-40">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Claude Key (COMING SOON)</label>
                       <input 
                         disabled
                         type="password"
                         className="w-full bg-background-primary/50 border border-dashed border-border rounded-2xl p-4 text-xs font-bold cursor-not-allowed"
                         placeholder="sk-ant-..."
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Keyboard Shortcuts Reference */}
           <div className="bg-background-secondary border border-border rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-accent-green/10 rounded-xl border border-accent-green/20 text-accent-green">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-white uppercase">Keyboard Shortcuts</h2>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-black opacity-60">Navigate faster</p>
                </div>
              </div>
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                {SHORTCUTS.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background-primary border border-border rounded-xl">
                    <span className="text-xs font-medium text-text-primary">{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <kbd key={kidx} className="px-2 py-1 bg-background-tertiary border border-border rounded text-[10px] font-black text-text-muted uppercase tracking-wider min-w-[28px] text-center">
                          {key === 'Ctrl' ? (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl') : key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Team Management */}
           <div className="bg-background-secondary border border-border rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-accent-blue/10 rounded-xl border border-accent-blue/20 text-accent-blue">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-white uppercase">Team Management</h2>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-black opacity-60">Supabase-synced members</p>
                  </div>
                </div>
                <button 
                  onClick={loadTeamMembers}
                  className="text-[10px] font-black uppercase tracking-widest text-accent-blue hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={10} className={isLoadingTeam ? 'animate-spin' : ''} /> Load Team
                </button>
              </div>

              {/* Invite Form */}
              <div className="flex gap-3 mb-6">
                <input 
                  className="flex-1 bg-background-primary border border-border rounded-xl p-3 text-xs font-bold focus:outline-none"
                  placeholder="Email address to invite..."
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInviteMember()}
                />
                <select 
                  className="bg-background-primary border border-border rounded-xl p-3 text-xs font-bold focus:outline-none"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button 
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim()}
                  className="bg-accent-blue text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus size={14} /> Invite
                </button>
              </div>

              {/* Member List */}
              {teamMembers.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-background-primary border border-border rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background-tertiary border border-border flex items-center justify-center">
                          <span className="text-[10px] font-black text-text-muted uppercase">{member.email?.[0]}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold">{member.email}</p>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select 
                          className="bg-background-tertiary border border-border rounded p-1 text-[10px] font-bold"
                          value={member.role}
                          onChange={e => handleChangeRole(member.id, e.target.value as 'admin' | 'member')}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        {member.email !== profile.email && (
                          <button 
                            onClick={() => handleRemoveMember(member.id, member.email)}
                            className="p-1 text-text-muted hover:text-accent-red transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
                  <Users size={24} className="mx-auto mb-2 text-text-muted/20" />
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Click "Load Team" to view members</p>
                </div>
              )}
           </div>

           {/* Quick Action: Danger Zone */}
           <div className="bg-accent-red/5 border border-accent-red/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <AlertOctagon size={128} className="text-accent-red" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-sm font-black text-accent-red uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertOctagon size={16} /> Danger Zone
                 </h2>
                 <p className="text-[10px] text-text-muted max-w-sm uppercase tracking-tight font-medium leading-relaxed">Delete all locally stored data, workspaces, and cached credentials. This action is irreversible.</p>
              </div>
              <button 
                onClick={async () => {
                  if (confirm('CRITICAL: Reset everything? This will delete all data and settings permanently.')) {
                    try {
                      await (window as any).electron.db.resetAll();
                    } catch (e) {
                      console.error('Failed to reset DB:', e);
                    }
                    updateSettings({ isOnboarded: false }); 
                    
                    setTimeout(() => {
                      localStorage.removeItem('dev-companion-storage');
                      window.location.reload();
                    }, 150);
                  }
                }}
                className="bg-accent-red text-white hover:bg-red-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 z-10"
              >
                Erase System Data
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
