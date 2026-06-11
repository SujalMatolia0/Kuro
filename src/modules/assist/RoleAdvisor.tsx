import { useState } from 'react';
import { useAppStore } from '../../store';
import AIResponse from '../../components/AIResponse';
import { Cpu, RefreshCw, History, X } from 'lucide-react';
import { aiHistoryQueries } from '../../db/queries';
import { getAIService } from '../../lib/ai';

const RoleAdvisor = () => {
  const { settings } = useAppStore();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('Oracle Fusion');
  const [roleType, setRoleType] = useState('standard');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const data = await aiHistoryQueries.getByModule('role-advisor');
    setHistory(data);
    setIsLoadingHistory(false);
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory((v) => !v);
  };

  const restoreFromHistory = (item: any) => {
    setQuery(item.query);
    setPlatform(item.platform || 'Oracle Fusion');
    setAiResponse(item.response);
    setShowHistory(false);
  };

  const deleteHistoryItem = async (id: string) => {
    await aiHistoryQueries.delete(id);
    setHistory((h) => h.filter((i) => i.id !== id));
  };

  const handleAdvise = async () => {
    if (!query.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);

    const systemPrompt = `You are a Role Advisor for ${platform}. Provide detailed role configuration advice based on standard ${roleType} roles. Include: role name, description, key permissions, prerequisites.`;

    try {
      const provider = settings.aiProvider as 'openai' | 'anthropic' | 'groq';
      const ai = getAIService(provider);
      const response = await ai.generateResponse(query, systemPrompt);

      setAiResponse(response);
      await aiHistoryQueries.create({
        module: 'role-advisor',
        query,
        platform,
        response,
      });
    } catch (err: any) {
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">Role Advisor</h2>
          <p className="text-sm text-text-muted">AI-powered role configuration for your platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleHistory} className="flex items-center gap-2 px-3 py-2 rounded-standard text-xs font-bold text-text-muted hover:text-text-primary hover:bg-background-tertiary transition-all">
            <History size={14} />
            History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-background-secondary border border-border rounded-standard p-3 text-sm focus:border-accent-violet focus:outline-none"
          >
            <option>Oracle Fusion</option>
            <option>Salesforce</option>
            <option>Both</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Role Type</label>
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            className="w-full bg-background-secondary border border-border rounded-standard p-3 text-sm focus:border-accent-violet focus:outline-none"
          >
            <option value="standard">Standard</option>
            <option value="custom">Custom</option>
            <option value="composite">Composite</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Describe the role you need</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Create a role for a junior Oracle Fusion consultant who needs access to procurement and supplier management..."
          rows={4}
          className="w-full bg-background-secondary border border-border rounded-standard p-3 text-sm focus:border-accent-violet focus:outline-none resize-none"
        />
      </div>

      <button
        onClick={handleAdvise}
        disabled={isAiLoading || !query.trim()}
        className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-60"
      >
        {isAiLoading ? <RefreshCw size={18} className="animate-spin" /> : <Cpu size={18} />}
        {isAiLoading ? 'Analyzing...' : 'Get Role Advice'}
      </button>

      {aiResponse && (
        <AIResponse
          content={aiResponse}
        />
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-black/50" onClick={toggleHistory} />
          <div className="relative bg-background-secondary border border-border rounded-card w-full max-w-lg max-h-[60vh] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm text-accent-green">Role Advisor History</h3>
              <button onClick={toggleHistory} className="p-1 hover:bg-background-tertiary rounded"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto max-h-[calc(60vh-60px)] p-2 space-y-1">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8"><RefreshCw size={20} className="animate-spin text-text-muted" /></div>
              ) : history.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">No history yet</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-standard hover:bg-background-tertiary group cursor-pointer transition-colors"
                    onClick={() => restoreFromHistory(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.query}</p>
                      <p className="text-[10px] text-text-muted">{item.platform} - {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                      className="p-1 text-text-muted/40 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAdvisor;
