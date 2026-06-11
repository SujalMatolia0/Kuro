import { useState } from 'react';
import { useAppStore } from '../../store';
import AIResponse from '../../components/AIResponse';
import { Shield, Search, Cpu, Save, RefreshCw, History, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cloudPermissionQueries } from '../../db/cloudQueries';
import { aiHistoryQueries } from '../../db/queries';
import { getAIService } from '../../lib/ai';
import { logAudit } from '../../lib/audit';
import type { PermissionMapEntry } from '../../db/schema';

const PermissionAdvisor = () => {
  const { profile, settings } = useAppStore();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('Oracle Fusion');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const data = await aiHistoryQueries.getByModule('permission-advisor');
    setHistory(data);
    setIsLoadingHistory(false);
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory(v => !v);
  };

  const restoreFromHistory = (item: any) => {
    setQuery(item.query);
    setPlatform(item.platform || 'Oracle Fusion');
    setAiResponse(item.response);
    setShowHistory(false);
  };

  const deleteHistoryItem = async (id: string) => {
    await aiHistoryQueries.delete(id);
    setHistory(h => h.filter(i => i.id !== id));
  };

  const handleAdvise = async () => {
    if (!query.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse(null);

    const ai = getAIService(settings.aiProvider as any);
    
    const platformContext = platform === 'Oracle Fusion' 
      ? "Oracle Fusion Applications (HCM, ERP, SCM). Focus on Job Roles, Duty Roles, Privilege Names, and Data Security Policies (DSP)."
      : "Salesforce Platform. Focus on Profiles, Permission Sets, Sharing Rules, and Object-Level Security (OWD).";

    const prompt = `User needs to perform this action in ${platform}: "${query}". 
    Identify the specific roles, permissions, or policies required. 
    Format your response with:
    1. Primary Role Required
    2. Specific Privileges/Permissions
    3. Navigation Path (if applicable)
    4. Common Security Traps/Gaps to watch for.
    5. Official Documentation URL.`;
    
    const context = `You are a Senior Security Architect for ${platformContext}. 
CRITICAL RULESET:
1. BE EXTREMELY CONCISE. Use a structured list.
2. EXACT NAMES ONLY: Provide the precise Role Codes and Privilege Names as they appear in the ${platform} Security Console (e.g., ORA_PER_HR_SPECIALIST_JOB).
3. PROVIDE A LINK to official documentation (e.g., Oracle Docs, Salesforce Security Guide) for verification.
4. DO NOT hallucinate roles. Use only verified RBAC standards for ${platform}.
5. Principle of Least Privilege is mandatory.
6. No fluff. Direct mappings only.`;
    
    const response = await ai.generateResponse(prompt, context);
    setAiResponse(response);
    setIsAiLoading(false);

    // Save to local history
    await aiHistoryQueries.create({
      module: 'permission-advisor',
      query,
      platform,
      response,
    });
  };

  const handleSaveToTeamBoard = async () => {
    if (!profile.email || !aiResponse) return;
    
    setIsSaving(true);
    const newEntry: PermissionMapEntry = {
      profile_email: profile.email,
      platform,
      action_desc: query,
      roles_json: { ai_generated: true },
      notes: aiResponse
    };

    const created = await cloudPermissionQueries.create(newEntry);
    if (created) {
      await logAudit(profile.email, 'CREATE', 'permission_map', created.id!, null, null, newEntry, true);
      alert('Mapping saved to shared repository!');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent-blue/10 rounded-2xl border border-accent-blue/20">
          <Shield className="text-accent-blue" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Permission Advisor</h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-black opacity-60">Security Mapping Intelligence</p>
        </div>
        <button
          onClick={toggleHistory}
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber' : 'bg-background-secondary border-border text-text-muted hover:text-white'}`}
        >
          <History size={14} />
          History
          {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="mb-6 bg-background-secondary border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-accent-amber">Past AI Queries</span>
            <button onClick={() => { aiHistoryQueries.clearModule('permission-advisor'); setHistory([]); }}
              className="text-[10px] text-text-muted hover:text-accent-red uppercase tracking-widest transition-colors">
              Clear All
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-border">
            {isLoadingHistory ? (
              <p className="text-xs text-text-muted text-center p-6 animate-pulse">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-text-muted text-center p-6">No history yet.</p>
            ) : history.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-background-tertiary group transition-colors">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => restoreFromHistory(item)}>
                  <p className="text-xs font-bold truncate">{item.query}</p>
                  <p className="text-[10px] text-text-muted">{item.platform} · {new Date(Number(item.created_at)).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteHistoryItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-red transition-all">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-background-secondary border border-border rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Describe the action or requirement</label>
            <div className="flex flex-col @sm:flex-row gap-4">
               <div className="flex-1 flex items-center gap-3 bg-background-primary border border-border/50 rounded-2xl px-5 py-2 group focus-within:border-accent-blue/40 transition-all">
                  <span className="text-accent-blue opacity-50"><Search size={20} /></span>
                  <input 
                    className="bg-transparent border-none text-base font-bold w-full py-4 focus:outline-none placeholder:text-text-muted/30"
                    placeholder="e.g. Give user access to manage payroll batch loader"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdvise()}
                  />
               </div>
               <select 
                 className="bg-background-tertiary border border-border rounded-2xl px-5 py-4 text-sm font-black uppercase text-accent-blue focus:outline-none focus:border-accent-blue transition-all cursor-pointer"
                 value={platform}
                 onChange={e => setPlatform(e.target.value)}
               >
                 <option value="Oracle Fusion">Oracle Fusion</option>
                 <option value="Salesforce">Salesforce</option>
               </select>
               <button 
                 onClick={handleAdvise}
                 disabled={isAiLoading || !query.trim()}
                 className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
               >
                 {isAiLoading ? <RefreshCw className="animate-spin" size={18} /> : "Query AI"}
               </button>
            </div>
          </div>

          {/* Response Container */}
          <div className="mt-8">
            {isAiLoading ? (
              <div className="py-24 text-center flex flex-col items-center gap-6">
                 <div className="w-12 h-12 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin" />
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-blue animate-pulse">Mapping Security Architecture...</p>
                 <p className="text-[10px] text-text-muted/50 uppercase italic max-w-xs leading-relaxed">Cross-referencing {platform} Role-Based Access Control (RBAC) standards.</p>
              </div>
            ) : aiResponse ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <Cpu size={14} className="text-accent-blue" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-accent-blue">AI Logic Recommendation</span>
                    </div>
                    <button 
                      onClick={handleSaveToTeamBoard}
                      disabled={isSaving}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-green hover:text-white transition-colors"
                    >
                      {isSaving ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                      Add to team wiki
                    </button>
                 </div>

                 <AIResponse content={aiResponse} />
 
                 <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-lg text-[10px] font-black uppercase">
                       <CheckCircle2 size={12} /> RBAC Scoped
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-lg text-[10px] font-black uppercase">
                       <Shield size={12} /> Least Privilege Aware
                    </div>
                 </div>
              </div>
            ) : (
              <div className="py-24 border border-dashed border-border/30 rounded-2xl flex flex-col items-center gap-4 text-text-muted opacity-30 group hover:opacity-100 transition-opacity">
                 <Shield size={48} strokeWidth={1} className="group-hover:text-accent-blue transition-colors" />
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-center">Enter a requirement above<br/><span className="text-[10px] opacity-60 font-medium lowercase italic">e.g. Manage Fusion Payables Invoices</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared History Prompt */}
      <div className="mt-12 p-6 bg-background-tertiary border border-border rounded-2xl flex flex-col @sm:flex-row items-center justify-between gap-4 group">
         <div className="flex items-center gap-4">
            <History className="text-text-muted" size={24} />
            <div>
               <p className="text-xs font-black uppercase tracking-widest text-white">Collaboration Power</p>
               <p className="text-[10px] text-text-muted uppercase tracking-tight font-medium mt-1">Permission mappings saved by your team will appear in the shared Knowledge Base.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PermissionAdvisor;
