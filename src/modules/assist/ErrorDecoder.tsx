import { useState } from 'react';
import { useAppStore } from '../../store';
import AIResponse from '../../components/AIResponse';
import { AlertCircle, Search, RefreshCw, Database, Save, Trash2, Cpu, History, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cloudErrorQueries } from '../../db/cloudQueries';
import { aiHistoryQueries } from '../../db/queries';
import { getAIService } from '../../lib/ai';
import { logAudit } from '../../lib/audit';
import type { ErrorDecoderEntry } from '../../db/schema';

const ErrorDecoder = () => {
  const { profile, settings } = useAppStore();
  const [errorCode, setErrorCode] = useState('');
  const [platform, setPlatform] = useState('Oracle Fusion');
  const [result, setResult] = useState<ErrorDecoderEntry | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const data = await aiHistoryQueries.getByModule('error-decoder');
    setHistory(data);
    setIsLoadingHistory(false);
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory(v => !v);
  };

  const restoreFromHistory = (item: any) => {
    setErrorCode(item.query);
    setPlatform(item.platform || 'Oracle Fusion');
    setAiExplanation(item.response);
    setResult(null);
    setShowHistory(false);
  };

  const deleteHistoryItem = async (id: string) => {
    await aiHistoryQueries.delete(id);
    setHistory(h => h.filter(i => i.id !== id));
  };

  const handleDecode = async () => {
    if (!errorCode.trim()) return;
    
    setIsSearching(true);
    setResult(null);
    setAiExplanation(null);

    // 1. Search Shared Database (Supabase)
    const sharedLogs = await cloudErrorQueries.getAll();
    const match = sharedLogs.find(l => 
      l.error_code.toLowerCase() === errorCode.toLowerCase() && 
      l.platform.toLowerCase() === platform.toLowerCase()
    );

    if (match) {
      setResult(match);
      setIsSearching(false);
      return;
    }

    // 2. If no match, Fallback to AI (Groq/Llama 3)
    setIsSearching(false);
    setIsAiLoading(true);
    
    const ai = getAIService(settings.aiProvider as any);
    const prompt = `Explain the following error code for ${platform}: ${errorCode}. Include: 
    1. A clear explanation of what happened.
    2. The most likely root cause.
    3. Step-by-step instructions to fix it.
    4. Official documentation / Source URL.`;
    
    const context = `You are an expert ${platform} developer assistant. 
CRITICAL RULESET:
1. BE EXTREMELY CONCISE. Use bullet points. No conversational filler.
2. DO NOT hallucinate. Only use official documented ${platform} solutions.
3. PROVIDE A LINK to official documentation (e.g., My Oracle Support, Salesforce Help, OCI Docs) for verification.
4. If solution is unknown, state "No confirmed solution found" and stop.
5. Focus only on the Root Cause and the most direct Fix Step.`;
    
    const response = await ai.generateResponse(prompt, context);
    setAiExplanation(response);
    setIsAiLoading(false);

    // Save to local history
    await aiHistoryQueries.create({
      module: 'error-decoder',
      query: errorCode,
      platform,
      response,
    });
  };

  const handleSaveToDb = async () => {
    if (!profile.email || !aiExplanation) return;
    
    setIsSaving(true);
    const newEntry: ErrorDecoderEntry = {
      profile_email: profile.email,
      platform,
      error_code: errorCode,
      title: `AI Decoded: ${errorCode}`,
      explanation: aiExplanation,
      root_cause: "AI Analysis",
      fix_steps: "Refer to Explanation"
    };

    const created = await cloudErrorQueries.create(newEntry);
    if (created) {
      setResult(created);
      setAiExplanation(null);
      await logAudit(profile.email, 'CREATE', 'error_decoder', created.id!, null, null, newEntry, true);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this error solution from the shared database?')) {
      await cloudErrorQueries.delete(id);
      setResult(null);
      await logAudit(profile.email, 'DELETE', 'error_decoder', id, null, null, null, true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent-red/10 rounded-2xl border border-accent-red/20">
          <AlertCircle className="text-accent-red" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Error Decoder</h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-black opacity-60">AI-Powered Debugging Engine</p>
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
            <button onClick={() => { aiHistoryQueries.clearModule('error-decoder'); setHistory([]); }}
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

      <div className="bg-background-secondary border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Search Bar Container */}
        <div className="flex flex-col @sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 bg-background-primary border border-border/50 rounded-2xl px-5 py-4 focus-within:border-accent-red/40 transition-all shadow-inner">
             <Search className="text-text-muted shrink-0" size={20} />
             <input 
               className="bg-transparent border-none text-lg font-bold w-full focus:outline-none placeholder:text-text-muted/30"
               placeholder="Paste error code (e.g. ORA-00942, PER-1530181)"
               value={errorCode}
               onChange={e => setErrorCode(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleDecode()}
             />
          </div>
          <select 
            className="bg-background-tertiary border border-border rounded-2xl px-5 py-4 text-sm font-black uppercase text-accent-red focus:outline-none focus:border-accent-red transition-all cursor-pointer"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
          >
            <option value="Oracle Fusion">Oracle Fusion</option>
            <option value="OCI">OCI</option>
            <option value="OIC">OIC</option>
            <option value="Salesforce">Salesforce</option>
            <option value="AWS">AWS</option>
          </select>
          <button 
            onClick={handleDecode}
            disabled={isSearching || isAiLoading}
            className="bg-accent-red hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching || isAiLoading ? <RefreshCw className="animate-spin" size={18} /> : "Decode"}
          </button>
        </div>

        {/* Results Area */}
        <div className="mt-12 space-y-6">
          {!result && !aiExplanation && !isAiLoading && !isSearching && (
             <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                <Cpu size={64} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-[0.3em]">Encoder Standby</p>
             </div>
          )}

          {isAiLoading && (
            <div className="py-20 text-center flex flex-col items-center gap-6">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-accent-red/20 border-t-accent-red rounded-full animate-spin" />
                  <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-red animate-pulse" size={24} />
               </div>
               <div>
                  <p className="text-sm font-black uppercase tracking-widest text-accent-red">Consulting AI Knowledge Base...</p>
                  <p className="text-[10px] text-text-muted mt-2 uppercase tracking-tight">Synthesizing solution for {errorCode}</p>
               </div>
            </div>
          )}

          {/* Database Result */}
          {result && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 bg-accent-green/10 text-accent-green border border-accent-green/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                     <Database size={10} /> Database Match
                  </span>
                  <button 
                    onClick={() => handleDelete(result.id!)}
                    className="p-1.5 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
               
               <div className="space-y-6">
                  <div className="p-6 bg-background-tertiary border border-border rounded-2xl">
                     <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Explanation</h3>
                     <p className="text-sm leading-relaxed text-text-primary/90">{result.explanation}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 @sm:grid-cols-2 gap-6">
                     <div className="p-6 bg-accent-red/5 border border-accent-red/10 rounded-2xl">
                        <h3 className="text-[10px] font-black text-accent-red uppercase tracking-[0.2em] mb-3">Root Cause</h3>
                        <p className="text-xs font-medium leading-relaxed">{result.root_cause}</p>
                     </div>
                     <div className="p-6 bg-accent-green/5 border border-accent-green/10 rounded-2xl">
                        <h3 className="text-[10px] font-black text-accent-green uppercase tracking-[0.2em] mb-3">Fix Steps</h3>
                        <p className="text-xs font-medium leading-relaxed">{result.fix_steps}</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

           {/* AI Result */}
           {aiExplanation && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between mb-6 pl-2">
                   <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <Cpu size={10} /> AI Synthesis
                   </span>
                   <button 
                     onClick={handleSaveToDb}
                     disabled={isSaving}
                     className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-green hover:text-white transition-colors"
                   >
                     {isSaving ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                     Save to Team Database
                   </button>
                </div>
                
                <AIResponse content={aiExplanation} />
             </div>
           )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 grid grid-cols-1 @sm:grid-cols-3 gap-6 opacity-40 grayscale group hover:grayscale-0 transition-all">
         <div className="flex flex-col items-center gap-2 text-center">
            <Database size={24} />
            <p className="text-[8px] font-black uppercase tracking-[0.2em]">Shared Workspace DB</p>
         </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <Cpu size={24} />
            <p className="text-[8px] font-black uppercase tracking-[0.2em]">Llama 3.3 70B Engine</p>
         </div>
         <div className="flex flex-col items-center gap-2 text-center">
            <RefreshCw size={24} />
            <p className="text-[8px] font-black uppercase tracking-[0.2em]">Real-time Synthesis</p>
         </div>
      </div>
    </div>
  );
};

export default ErrorDecoder;
