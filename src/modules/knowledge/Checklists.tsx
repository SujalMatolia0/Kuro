import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import {
  CheckSquare, Plus, Search, Tag, Trash2, Save,
  Settings, GripVertical, CheckCircle2, RotateCcw,
  Terminal, Copy, ChevronDown, ChevronUp
} from 'lucide-react';
import { cloudChecklistQueries } from '../../db/cloudQueries';
import type { ChecklistEntry, ChecklistCommand } from '../../db/schema';
import Fuse from 'fuse.js';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { logAudit } from '../../lib/audit';

const SHELL_COLORS: Record<string, string> = {
  bash:        'text-accent-green  border-accent-green/30  bg-accent-green/10',
  powershell:  'text-accent-blue   border-accent-blue/30   bg-accent-blue/10',
  cmd:         'text-accent-amber  border-accent-amber/30  bg-accent-amber/10',
  sql:         'text-[#a855f7]     border-[#a855f7]/30     bg-[#a855f7]/10',
  other:       'text-text-muted    border-border            bg-background-tertiary',
};

type ActiveTab = 'steps' | 'commands';

const Checklists = () => {
  const { profile } = useAppStore();
  const [checklists, setChecklists]           = useState<ChecklistEntry[]>([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [activeTab, setActiveTab]             = useState<ActiveTab>('steps');
  const [copiedIdx, setCopiedIdx]             = useState<number | null>(null);
  const [expandedCmd, setExpandedCmd]         = useState<number | null>(null);

  // ── Editor Modal ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editMode, setEditMode]         = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newPlatform, setNewPlatform]   = useState('');
  const [newSteps, setNewSteps]         = useState<{ text: string; completed?: boolean }[]>([]);
  const [newCommands, setNewCommands]   = useState<ChecklistCommand[]>([]);
  const [modalTab, setModalTab]         = useState<'steps' | 'commands'>('steps');

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadChecklists(); }, []);

  const loadChecklists = async () => {
    setIsLoading(true);
    const data = await cloudChecklistQueries.getAll();
    setChecklists(data);
    if (data.length > 0 && !activeChecklistId) setActiveChecklistId(data[0].id!);
    setIsLoading(false);
  };

  const activeChecklist = useMemo(
    () => checklists.find(c => c.id === activeChecklistId),
    [checklists, activeChecklistId]
  );

  const filteredChecklists = useMemo(() => {
    if (!searchQuery) return checklists;
    const fuse = new Fuse(checklists, { keys: ['title', 'platform'], threshold: 0.3 });
    return fuse.search(searchQuery).map(r => r.item);
  }, [checklists, searchQuery]);

  // ── Step actions ──────────────────────────────────────────────────────────
  const toggleStep = async (idx: number) => {
    if (!activeChecklist) return;
    const updated = [...activeChecklist.steps_json];
    updated[idx].completed = !updated[idx].completed;
    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? { ...c, steps_json: updated } : c));
    await cloudChecklistQueries.update(activeChecklist.id!, { steps_json: updated });
  };

  const resetProgress = async () => {
    if (!activeChecklist) return;
    const updated = activeChecklist.steps_json.map(s => ({ ...s, completed: false }));
    setChecklists(prev => prev.map(c => c.id === activeChecklist.id ? { ...c, steps_json: updated } : c));
    await cloudChecklistQueries.update(activeChecklist.id!, { steps_json: updated });
  };

  // ── Copy command ──────────────────────────────────────────────────────────
  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // ── Save template ─────────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!profile.email || !newTitle) return;

    const entryData: ChecklistEntry = {
      profile_email: profile.email,
      title:         newTitle,
      platform:      newPlatform,
      steps_json:    newSteps.filter(s => s.text.trim()),
      commands_json: newCommands.filter(c => c.label.trim() && c.command.trim()),
    };

    if (editMode && activeChecklistId) {
      const old = checklists.find(c => c.id === activeChecklistId);
      await cloudChecklistQueries.update(activeChecklistId, entryData);
      await logAudit(profile.email, 'UPDATE', 'checklist', activeChecklistId, null, old, entryData, true);
    } else {
      const created = await cloudChecklistQueries.create(entryData);
      if (created) {
        setActiveChecklistId(created.id!);
        await logAudit(profile.email, 'CREATE', 'checklist', created.id!, null, null, entryData, true);
      }
    }

    setIsModalOpen(false);
    loadChecklists();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this checklist template for everyone?')) return;
    const old = checklists.find(c => c.id === id);
    await cloudChecklistQueries.delete(id);
    await logAudit(profile.email, 'DELETE', 'checklist', id, null, old, null, true);
    if (activeChecklistId === id) setActiveChecklistId(null);
    loadChecklists();
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditMode(false);
    setNewTitle(''); setNewPlatform('');
    setNewSteps([{ text: '' }]);
    setNewCommands([]);
    setModalTab('steps');
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!activeChecklist) return;
    setEditMode(true);
    setNewTitle(activeChecklist.title);
    setNewPlatform(activeChecklist.platform || '');
    setNewSteps(activeChecklist.steps_json.map(s => ({ ...s })));
    setNewCommands((activeChecklist.commands_json || []).map(c => ({ ...c })));
    setModalTab('steps');
    setIsModalOpen(true);
  };

  // Step rows
  const addStepRow    = () => setNewSteps([...newSteps, { text: '' }]);
  const removeStepRow = (i: number) => setNewSteps(newSteps.filter((_, idx) => idx !== i));
  const updateStep    = (i: number, text: string) => { const n = [...newSteps]; n[i].text = text; setNewSteps(n); };

  // Command rows
  const addCmdRow    = () => setNewCommands([...newCommands, { label: '', command: '', shell: 'bash' }]);
  const removeCmdRow = (i: number) => setNewCommands(newCommands.filter((_, idx) => idx !== i));
  const updateCmd    = (i: number, field: keyof ChecklistCommand, val: string) => {
    const n = [...newCommands];
    (n[i] as any)[field] = val;
    setNewCommands(n);
  };

  const progress = useMemo(() => {
    if (!activeChecklist || activeChecklist.steps_json.length === 0) return 0;
    const done = activeChecklist.steps_json.filter(s => s.completed).length;
    return Math.round((done / activeChecklist.steps_json.length) * 100);
  }, [activeChecklist]);

  const cmdCount = activeChecklist?.commands_json?.length ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-40px)] flex flex-col sm:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500 pb-4">

      {/* ── Left pane: list ── */}
      <div className="w-full sm:w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-accent-blue" size={24} />
            <h1 className="text-2xl font-black tracking-tighter text-accent-blue uppercase">Runbooks</h1>
          </div>
          <button onClick={openCreateModal} className="p-2 bg-background-tertiary border border-border rounded-standard text-accent-blue hover:text-white transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-background-secondary border border-border rounded-standard px-3 py-2">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            placeholder="Search checklists..."
            className="bg-transparent border-none text-sm w-full focus:outline-none placeholder:text-text-muted/50"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-2">
          {isLoading ? (
            <div className="text-center text-text-muted text-xs p-4 animate-pulse uppercase tracking-widest font-black">Scanning runbooks...</div>
          ) : filteredChecklists.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No Checklists Found" description="Create a runbook template to standardize your team's workflows." action={{ label: '+ New Checklist', onClick: openCreateModal }} />
          ) : filteredChecklists.map(cl => (
            <button
              key={cl.id}
              onClick={() => { setActiveChecklistId(cl.id!); setActiveTab('steps'); }}
              className={`w-full text-left p-4 rounded-card transition-all border group ${activeChecklistId === cl.id ? 'bg-accent-blue/5 border-accent-blue shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]' : 'bg-background-secondary border-border hover:border-text-muted'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold truncate pr-3">{cl.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-text-muted opacity-40">{cl.steps_json.length} STEPS</span>
                  {(cl.commands_json?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-accent-amber opacity-60">
                      <Terminal size={10} /> {cl.commands_json!.length}
                    </span>
                  )}
                </div>
              </div>
              {cl.platform && (
                <span className="inline-flex items-center gap-1.5 text-[8px] font-black text-accent-blue uppercase tracking-widest bg-accent-blue/5 border border-accent-blue/20 px-2 py-0.5 rounded">
                  <Tag size={8} /> {cl.platform}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right pane: runner ── */}
      <div className="w-full sm:w-2/3 flex flex-col overflow-hidden min-h-0 bg-background-secondary border border-border rounded-[16px]">
        {activeChecklist ? (
          <div className="flex-1 flex flex-col min-h-0">

            {/* Header */}
            <div className="p-6 border-b border-border bg-background-tertiary flex items-start justify-between shrink-0">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{activeChecklist.title}</h2>
                  <button onClick={openEditModal} className="p-1.5 text-text-muted hover:bg-background-primary rounded-md transition-all" title="Edit Template">
                    <Settings size={14} />
                  </button>
                </div>

                {/* Progress bar — only shown on steps tab */}
                {activeTab === 'steps' && (
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 h-2 bg-background-primary rounded-full overflow-hidden border border-border/50">
                      <div className="h-full bg-accent-blue transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-accent-blue">{progress}%</span>
                      {progress === 100 && <CheckCircle2 size={14} className="text-accent-green animate-bounce" />}
                    </div>
                    <button onClick={resetProgress} className="p-1 text-text-muted hover:text-white transition-colors" title="Reset Progress">
                      <RotateCcw size={12} />
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => handleDelete(activeChecklist.id!)} className="ml-4 p-2 bg-background-primary hover:bg-accent-red/10 text-text-muted hover:text-accent-red rounded-standard transition-colors">
                <Trash2 size={16} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-6 pt-4 border-b border-border shrink-0">
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === 'steps' ? 'text-accent-blue border-accent-blue' : 'text-text-muted border-transparent hover:text-text-primary'}`}
              >
                <CheckSquare size={14} /> Steps
                <span className="text-[10px] opacity-60">({activeChecklist.steps_json.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('commands')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === 'commands' ? 'text-accent-amber border-accent-amber' : 'text-text-muted border-transparent hover:text-text-primary'}`}
              >
                <Terminal size={14} /> Commands
                {cmdCount > 0 && <span className="text-[10px] opacity-60">({cmdCount})</span>}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-[#0d1117]/30">

              {/* ── Steps tab ── */}
              {activeTab === 'steps' && (
                <div className="max-w-xl mx-auto space-y-3">
                  {activeChecklist.steps_json.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${step.completed ? 'bg-accent-green/5 border-accent-green/20 opacity-60' : 'bg-background-tertiary border-border hover:border-accent-blue/40'}`}
                    >
                      <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${step.completed ? 'bg-accent-green border-accent-green' : 'border-border-hover'}`}>
                        {step.completed && <CheckSquare size={14} className="text-background-primary" />}
                      </div>
                      <span className={`text-sm font-medium leading-relaxed ${step.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Commands tab ── */}
              {activeTab === 'commands' && (
                <div className="max-w-2xl mx-auto space-y-3">
                  {!cmdCount ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted border-2 border-dashed border-border rounded-xl gap-3">
                      <Terminal size={40} className="opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest">No commands yet</p>
                      <button onClick={openEditModal} className="text-[10px] text-accent-amber hover:underline uppercase tracking-widest">
                        + Add commands via Edit
                      </button>
                    </div>
                  ) : activeChecklist.commands_json!.map((cmd, idx) => {
                    const colorClass = SHELL_COLORS[cmd.shell || 'other'];
                    const isExpanded = expandedCmd === idx;
                    return (
                      <div key={idx} className="bg-background-secondary border border-border rounded-xl overflow-hidden hover:border-accent-amber/40 transition-all group">
                        {/* Command header row */}
                        <div className="flex items-center gap-3 p-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest shrink-0 ${colorClass}`}>
                            {cmd.shell || 'other'}
                          </span>
                          <span className="text-sm font-bold flex-1 truncate">{cmd.label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Copy button */}
                            <button
                              onClick={() => copyCommand(cmd.command, idx)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-[10px] font-black uppercase tracking-widest transition-all ${copiedIdx === idx ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' : 'bg-background-tertiary text-text-muted hover:text-accent-amber border border-border'}`}
                            >
                              {copiedIdx === idx ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                              {copiedIdx === idx ? 'Copied!' : 'Copy'}
                            </button>
                            {/* Expand toggle */}
                            <button
                              onClick={() => setExpandedCmd(isExpanded ? null : idx)}
                              className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded: show full command + description */}
                        {isExpanded && (
                          <div className="border-t border-border animate-in fade-in slide-in-from-top-2 duration-150">
                            <pre className="p-4 bg-[#0d1117] text-sm font-mono text-accent-green overflow-x-auto scrollbar-thin whitespace-pre-wrap break-all">
                              {cmd.command}
                            </pre>
                            {cmd.description && (
                              <p className="px-4 pb-4 text-xs text-text-muted leading-relaxed">{cmd.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Ghost tab bar — always visible so user knows tabs exist */}
            <div className="flex items-center gap-1 px-6 pt-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-text-muted/30 border-b-2 border-transparent -mb-px">
                <CheckSquare size={14} /> Steps
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-text-muted/30 border-b-2 border-transparent -mb-px">
                <Terminal size={14} /> Commands
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4">
              <CheckSquare size={48} className="opacity-10" />
              <p className="text-xs uppercase tracking-[0.2em] font-black">Select a runbook template</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? 'EDIT RUNBOOK TEMPLATE' : 'NEW GUIDED CHECKLIST'}>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">

            {/* Title + Platform */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Runbook Title</label>
                <input className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-blue focus:outline-none"
                  placeholder="e.g. Weekly Production Deployment" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Platform</label>
                <input className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-blue focus:outline-none"
                  placeholder="e.g. HCM, OIC, GitHub" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} />
              </div>
            </div>

            {/* Modal tab switcher */}
            <div className="flex gap-1 border-b border-border pb-2">
              <button onClick={() => setModalTab('steps')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all ${modalTab === 'steps' ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>
                <CheckSquare size={13} /> Steps ({newSteps.length})
              </button>
              <button onClick={() => setModalTab('commands')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all ${modalTab === 'commands' ? 'bg-accent-amber/10 text-accent-amber' : 'text-text-muted hover:text-text-primary'}`}>
                <Terminal size={13} /> Commands ({newCommands.length})
              </button>
            </div>

            {/* Steps editor */}
            {modalTab === 'steps' && (
              <div className="space-y-2">
                {newSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-background-primary border border-border rounded-standard px-3 py-1">
                      <GripVertical size={14} className="text-text-muted/30 cursor-grab" />
                      <input className="flex-1 bg-transparent border-none text-sm p-1 focus:outline-none"
                        placeholder={`Step ${idx + 1}`} value={step.text} onChange={e => updateStep(idx, e.target.value)} />
                    </div>
                    <button onClick={() => removeStepRow(idx)} className="p-2 text-text-muted hover:text-accent-red"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={addStepRow} className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-standard text-xs text-text-muted hover:text-white hover:border-accent-blue transition-all">
                  <Plus size={14} /> Add Step
                </button>
              </div>
            )}

            {/* Commands editor */}
            {modalTab === 'commands' && (
              <div className="space-y-3">
                {newCommands.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4 border border-dashed border-border rounded-standard">
                    No commands yet. Add shell, Git, SQL or any CLI commands below.
                  </p>
                )}
                {newCommands.map((cmd, idx) => (
                  <div key={idx} className="bg-background-primary border border-border rounded-standard p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Shell type */}
                      <select
                        className="bg-background-tertiary border border-border rounded px-2 py-1.5 text-xs font-black focus:outline-none focus:border-accent-amber shrink-0"
                        value={cmd.shell || 'bash'}
                        onChange={e => updateCmd(idx, 'shell', e.target.value)}
                      >
                        <option value="bash">bash</option>
                        <option value="powershell">powershell</option>
                        <option value="cmd">cmd</option>
                        <option value="sql">sql</option>
                        <option value="other">other</option>
                      </select>
                      {/* Label */}
                      <input className="flex-1 bg-background-tertiary border border-border rounded px-2 py-1.5 text-xs focus:border-accent-amber focus:outline-none"
                        placeholder="Label (e.g. Push to GitHub)" value={cmd.label} onChange={e => updateCmd(idx, 'label', e.target.value)} />
                      <button onClick={() => removeCmdRow(idx)} className="p-1.5 text-text-muted hover:text-accent-red shrink-0"><Trash2 size={13} /></button>
                    </div>
                    {/* Command */}
                    <textarea
                      className="w-full bg-[#0d1117] border border-border rounded px-3 py-2 text-xs font-mono text-accent-green focus:border-accent-amber focus:outline-none scrollbar-thin h-16 resize-none"
                      placeholder="git push origin main"
                      value={cmd.command}
                      onChange={e => updateCmd(idx, 'command', e.target.value)}
                    />
                    {/* Optional description */}
                    <input className="w-full bg-background-tertiary border border-border rounded px-2 py-1.5 text-xs text-text-muted focus:border-accent-amber focus:outline-none"
                      placeholder="Optional description..." value={cmd.description || ''} onChange={e => updateCmd(idx, 'description', e.target.value)} />
                  </div>
                ))}
                <button onClick={addCmdRow} className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-border rounded-standard text-xs text-text-muted hover:text-accent-amber hover:border-accent-amber transition-all">
                  <Plus size={14} /> Add Command
                </button>
              </div>
            )}

            <button
              onClick={handleSaveTemplate}
              disabled={!newTitle || newSteps.some(s => !s.text.trim())}
              className="w-full btn-primary !bg-accent-blue py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span className="font-black text-xs uppercase tracking-widest">{editMode ? 'UPDATE TEMPLATE' : 'PUBLISH RUNBOOK'}</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Checklists;
