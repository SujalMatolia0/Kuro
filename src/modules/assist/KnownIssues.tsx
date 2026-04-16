import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { Bug, Plus, Search, ChevronRight, Save, Trash2, Filter, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { getAIService } from '../../lib/ai';
import { cloudIssueQueries } from '../../db/cloudQueries';
import { logAudit } from '../../lib/audit';
import type { KnownIssueEntry } from '../../db/schema';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import AIResponse from '../../components/AIResponse';

const KnownIssues = () => {
  const { profile, settings } = useAppStore();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [issues, setIssues] = useState<KnownIssueEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<KnownIssueEntry | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Oracle Fusion');
  const [description, setDescription] = useState('');
  const [workaround, setWorkaround] = useState('');
  const [status, setStatus] = useState<'Open' | 'Resolved'>('Open');

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    const data = await cloudIssueQueries.getAll();
    setIssues(data);
  };

  const handleSave = async () => {
    if (!profile.email || !title) return;

    const entryData: KnownIssueEntry = {
      profile_email: profile.email,
      title,
      platform,
      description,
      workaround,
      status
    };

    if (editingIssue?.id) {
       await cloudIssueQueries.update(editingIssue.id, entryData);
       await logAudit(profile.email, 'UPDATE', 'known_issue', editingIssue.id, null, editingIssue, entryData, true);
    } else {
       const created = await cloudIssueQueries.create(entryData);
       if (created) {
         await logAudit(profile.email, 'CREATE', 'known_issue', created.id!, null, null, entryData, true);
       }
    }

    setIsModalOpen(false);
    loadIssues();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this issue report?')) {
      const old = issues.find(i => i.id === id);
      await cloudIssueQueries.delete(id);
      await logAudit(profile.email, 'DELETE', 'known_issue', id, null, old || null, null, true);
      loadIssues();
    }
  };

  const resetForm = () => {
    setEditingIssue(null);
    setTitle('');
    setPlatform('Oracle Fusion');
    setDescription('');
    setWorkaround('');
    setStatus('Open');
  };

  const handleAiSuggest = async () => {
    if (!title) return;
    setIsAiLoading(true);
    
    try {
      const ai = getAIService(settings.aiProvider as any);
      const prompt = `Title: ${title}\nPlatform: ${platform}\nDescription: ${description}\n\nSuggest a verified, official workaround or solution for this issue. Include an official documentation or source URL.`;
      const context = `You are an expert ${platform} technical architect. 
CRITICAL RULESET:
1. BE CONCISE. Use short bullet points for the workaround.
2. PROVIDE AN OFFICIAL URL for the source of this workaround for verification.
3. NO HALLUCINATION. If no verified workaround exists, state "No documented workaround found".
4. Provide only the most direct official or recommended fix.`;

      const response = await ai.generateResponse(prompt, context);
      setWorkaround(response);
    } catch (error) {
      console.error('AI Suggest Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const openEdit = (issue: KnownIssueEntry) => {
    setEditingIssue(issue);
    setTitle(issue.title);
    setPlatform(issue.platform || 'Oracle Fusion');
    setDescription(issue.description || '');
    setWorkaround(issue.workaround || '');
    setStatus(issue.status);
    setIsModalOpen(true);
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          issue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'All' || issue.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-blue/10 rounded-2xl border border-accent-blue/20 text-accent-blue">
            <Bug size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Known Issues</h1>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-black opacity-60">Team-Shared Bug Tracker & Workarounds</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary !py-3 !px-6 flex items-center gap-2"
        >
          <Plus size={18} /> REPORT ISSUE
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
         <div className="sm:col-span-2 flex items-center gap-3 bg-background-secondary border border-border rounded-xl px-4 py-3 group focus-within:border-accent-blue/40 transition-all">
            <Search className="text-text-muted" size={18} />
            <input 
              className="bg-transparent border-none text-sm w-full focus:outline-none placeholder:text-text-muted/40"
              placeholder="Search issues or workarounds..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3 bg-background-secondary border border-border rounded-xl px-4 py-3">
            <Filter className="text-text-muted" size={16} />
            <select 
              className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-text-muted w-full focus:outline-none"
              value={filterPlatform}
              onChange={e => setFilterPlatform(e.target.value)}
            >
               <option value="All">All Platforms</option>
               <option value="Oracle Fusion">Oracle Fusion</option>
               <option value="OCI">OCI</option>
               <option value="Salesforce">Salesforce</option>
               <option value="OIC">OIC</option>
            </select>
         </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {filteredIssues.length === 0 ? (
           <div className="col-span-full">
             <EmptyState 
               icon={Bug}
               title="No Issues Reported"
               description="Your team hasn't reported any known issues yet. Report one to help the team."
               action={{ label: '+ Report Issue', onClick: () => { resetForm(); setIsModalOpen(true); } }}
             />
           </div>
         ) : (
           filteredIssues.map(issue => (
           <div 
             key={issue.id}
             className="bg-background-secondary border border-border rounded-3xl p-6 hover:border-accent-blue/30 transition-all group relative overflow-hidden"
           >
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] ${issue.status === 'Open' ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' : 'bg-accent-green/10 text-accent-green border border-accent-green/20'}`}>
                       {issue.status}
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-text-muted uppercase opacity-40">{issue.platform}</span>
                 </div>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(issue)} className="p-1.5 text-text-muted hover:text-white"><ChevronRight size={14} /></button>
                    <button onClick={() => handleDelete(issue.id!)} className="p-1.5 text-text-muted hover:text-accent-red"><Trash2 size={14} /></button>
                 </div>
              </div>

              <h2 className="text-lg font-black tracking-tight mb-2 group-hover:text-accent-blue transition-colors line-clamp-1">{issue.title}</h2>
              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-6">{issue.description}</p>

              <div className="p-4 bg-background-tertiary rounded-2xl border border-border/50">
                 <div className="flex items-center gap-2 text-[8px] font-black text-accent-green uppercase tracking-[0.2em] mb-2">
                    <CheckCircle2 size={10} /> Workaround
                 </div>
                 <p className="text-[11px] font-medium leading-relaxed italic text-text-primary/70 line-clamp-2">
                    {issue.workaround || "No workaround provided yet."}
                 </p>
              </div>
           </div>
         ))
         )}
      </div>

      {/* Editor Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingIssue ? "EDIT ISSUE REPORT" : "REPORT KNOWN ISSUE"}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                 <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Issue Title</label>
                 <input 
                   className="w-full bg-background-primary border border-border rounded-xl p-3 text-sm focus:border-accent-blue focus:outline-none"
                   placeholder="e.g. OIC Mapper failing for deep nested JSON"
                   value={title}
                   onChange={e => setTitle(e.target.value)}
                 />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                 <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Platform</label>
                 <select 
                   className="w-full bg-background-primary border border-border rounded-xl p-3 text-sm focus:border-accent-blue focus:outline-none"
                   value={platform}
                   onChange={e => setPlatform(e.target.value)}
                 >
                    <option value="Oracle Fusion">Oracle Fusion</option>
                    <option value="OCI">OCI</option>
                    <option value="OIC">OIC</option>
                    <option value="Salesforce">Salesforce</option>
                 </select>
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Description</label>
              <textarea 
                className="w-full bg-background-primary border border-border rounded-xl p-3 text-sm h-24 focus:border-accent-blue focus:outline-none resize-none"
                placeholder="Details about the bug or limitation..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
           </div>

           <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Workaround / Fix</label>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isAiLoading || !title}
                  className="text-[10px] font-black text-accent-blue hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  AI Suggest
                </button>
              </div>
              <textarea 
                className="w-full bg-background-primary border border-border rounded-xl p-3 text-sm h-24 focus:border-accent-blue focus:outline-none resize-none"
                placeholder="How to bypass this issue..."
                value={workaround}
                onChange={e => setWorkaround(e.target.value)}
              />

              {workaround && (
                <div className="mt-4">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Workaround Preview</label>
                   <AIResponse content={workaround} />
                </div>
              )}
           </div>

           <div className="flex items-center gap-4 py-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Status:</label>
              <button 
                onClick={() => setStatus('Open')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${status === 'Open' ? 'bg-accent-red text-white' : 'bg-background-tertiary text-text-muted'}`}
              >
                OPEN
              </button>
              <button 
                onClick={() => setStatus('Resolved')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${status === 'Resolved' ? 'bg-accent-green text-white' : 'bg-background-tertiary text-text-muted'}`}
              >
                RESOLVED
              </button>
           </div>

           <button 
             onClick={handleSave}
             disabled={!title}
             className="w-full py-4 bg-accent-blue text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
           >
             <Save size={16} className="inline mr-2" />
             {editingIssue ? 'UPDATE REPORT' : 'SUBMIT REPORT'}
           </button>
        </div>
      </Modal>
    </div>
  );
};

export default KnownIssues;
