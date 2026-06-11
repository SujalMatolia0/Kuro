import { useState, useEffect } from 'react';
import { auditQueries } from '../../db/queries';
import { 
  History, User, Activity, Clock, 
  ChevronDown, ChevronUp, 
  Database, RefreshCw, Send, Download, Globe
} from 'lucide-react';
import { cloudAuditQueries } from '../../db/cloudQueries';
import { useAppStore } from '../../store';
import EmptyState from '../../components/EmptyState';

const AuditModule = () => {
  const { profile } = useAppStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    
    // 1. Fetch Local Logs
    const localRaw = await auditQueries.getAll();
    const localLogs = localRaw.map(l => ({ ...l, isCloud: false }));

    // 2. Fetch Cloud Logs (if profile exists)
    let cloudLogs: any[] = [];
    if (profile.email) {
      const cloudRaw = await cloudAuditQueries.getAll();
      cloudLogs = cloudRaw.map(l => ({ 
        ...l, 
        isCloud: true,
        // Match the local schema's timestamp format (number)
        created_at: l.created_at ? new Date(l.created_at).getTime() : Date.now()
      }));
    }

    // 3. Merge and Sort
    const merged = [...localLogs, ...cloudLogs].sort((a, b) => {
      const timeA = Number(a.created_at);
      const timeB = Number(b.created_at);
      return timeB - timeA;
    });

    // Remove duplicates (if any sync logic caused overlaps)
    const unique = merged.filter((log, index, self) =>
      index === self.findIndex((t) => (
        t.id === log.id
      ))
    );

    setLogs(unique);
    setIsLoading(false);
  };

  const renderDiffContent = (log: any) => {
    if (!log.diff_json) return <p className="text-text-muted italic">No data diff recorded for this action.</p>;

    try {
      const diff = JSON.parse(log.diff_json);

      // If it's a character/word diff array (from diff library)
      if (Array.isArray(diff)) {
        return (
          <div className="p-4 bg-[#0d1117] rounded-lg border border-border/50 text-xs font-mono leading-relaxed max-h-60 overflow-y-auto scrollbar-thin">
            {diff.map((part, i) => (
              <span 
                key={i} 
                className={part.added ? 'text-accent-green bg-accent-green/10' : 
                           part.removed ? 'text-accent-red bg-accent-red/10 line-through' : 
                           'text-text-primary/70'}
              >
                {part.value}
              </span>
            ))}
          </div>
        );
      }

      // If it's a field-level object diff
      return (
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(diff).map(([key, value]: [string, any]) => (
            <div key={key} className="border-l-2 border-accent-green/30 pl-4 py-1">
              <p className="text-[10px] font-black uppercase text-accent-green tracking-widest mb-1">{key}</p>
              {Array.isArray(value) ? (
                // Nested word diff for this field
                <div className="text-[11px] font-mono leading-relaxed">
                   {value.map((part, i) => (
                     <span key={i} className={part.added ? 'text-accent-green underline' : part.removed ? 'text-accent-red line-through' : ''}>
                       {part.value}
                     </span>
                   ))}
                </div>
              ) : typeof value === 'object' && value.from !== undefined ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-accent-red line-through opacity-50">{String(value.from)}</span>
                  <span className="text-text-muted">→</span>
                  <span className="text-accent-green font-bold">{String(value.to)}</span>
                </div>
              ) : (
                <p className="text-xs text-text-primary/70">{JSON.stringify(value)}</p>
              )}
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <pre className="text-[10px] opacity-40">{log.diff_json}</pre>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Activity size={14} className="text-accent-green" />;
      case 'UPDATE': return <RefreshCw size={14} className="text-accent-blue" />;
      case 'DELETE': return <Activity size={14} className="text-accent-red" />;
      case 'SYNC_PUSH': return <Send size={14} className="text-accent-violet" />;
      case 'SYNC_PULL': return <Download size={14} className="text-accent-amber" />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <History size={28} className="text-accent-green" />
            Audit Trail
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium italic">Workspace activity and synchronization history (Last 30 Days)</p>
        </div>
        <button 
          onClick={loadLogs}
          className="btn-secondary !py-2 !px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Logs
        </button>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <EmptyState 
            icon={Database}
            title="No Logs Recorded Yet"
            description="Activity logs will appear here as you create, update, and sync data across your workspace."
          />
        ) : (
          logs.map((log) => (
            <div 
              key={log.id}
              className={`border rounded-xl transition-all ${expandedId === log.id ? 'border-border-hover bg-background-secondary shadow-lg' : 'border-border bg-background-primary hover:border-border-hover'}`}
            >
              <div 
                className="p-4 flex items-center justify-between cursor-pointer group"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-1.5 w-16">
                     <div className="p-2 bg-background-tertiary rounded-lg group-hover:bg-background-tertiary/50 transition-colors">
                        {getActionIcon(log.action)}
                     </div>
                     <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter">{log.action}</span>
                  </div>

                  <div>
                     <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black text-text-primary uppercase tracking-tight">
                           {log.entity_type} <span className="text-text-muted/40 opacity-50 font-medium">#{log.entity_id.split('-')[0]}</span>
                        </span>
                        <div className="h-1 w-1 rounded-full bg-text-muted/20" />
                        <span className="text-[10px] text-text-muted font-bold flex items-center gap-1.5">
                           <User size={10} /> {log.user_email || 'Local User'}
                        </span>
                     </div>
                      <p className="text-[10px] text-text-muted/70 flex items-center gap-1.5">
                        <Clock size={10} /> {new Date(Number(log.created_at)).toLocaleString()}
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   {log.isCloud && (
                     <div className="flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-accent-blue/20" title="Global Cloud Log">
                        <Globe size={10} /> Global
                     </div>
                   )}
                   {log.diff_json && (
                     <span className="bg-accent-green/10 text-accent-green px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-accent-green/20">
                        Detailed Diff Available
                     </span>
                   )}
                   {expandedId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedId === log.id && (
                <div className="px-14 pb-6 animate-in slide-in-from-top-2 duration-200">
                   <div className="h-[1px] bg-border mb-6" />
                   {renderDiffContent(log)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditModule;
