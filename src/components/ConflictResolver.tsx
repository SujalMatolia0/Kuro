import React from 'react';
import { diffWordsWithSpace } from 'diff';
import { AlertTriangle, CheckCircle2, Cloud, HardDrive, ArrowLeftRight } from 'lucide-react';
import Modal from './Modal';

interface ConflictResolverProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  localData: any;
  cloudData: any;
  onResolve: (action: 'LOCAL' | 'CLOUD' | 'MERGE') => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
  isOpen, onClose, entityType, localData, cloudData, onResolve
}) => {

  // Guard: don't render content if data isn't ready yet
  if (!localData || !cloudData) return null;

  const renderDiff = (localStr: string, cloudStr: string) => {
    const diff = diffWordsWithSpace(cloudStr, localStr);
    return (
      <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
        {diff.map((part, index) => {
          const color = part.added ? 'text-accent-green bg-accent-green/10' : 
                        part.removed ? 'text-accent-red bg-accent-red/10 line-through' : 
                        'text-text-primary/70';
          return <span key={index} className={color}>{part.value}</span>;
        })}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolve Sync Conflict" accent="copper">
      <div className="space-y-6 max-w-4xl">
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl flex items-center gap-4">
          <AlertTriangle className="text-accent-red" size={24} />
          <div>
            <h3 className="text-sm font-black text-accent-red uppercase tracking-tight">Version Mismatch Detected</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">
              A teammate updated the cloud version of this {entityType} while you were working. Choose which version to keep.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-6 h-[500px] @sm:h-[400px]">
          {/* Local Version */}
          <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-background-primary">
            <div className="p-3 border-b border-border bg-background-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={14} className="text-accent-green" />
                <span className="text-[10px] font-black uppercase tracking-widest">Your Local Version</span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
               <h4 className="font-bold text-sm mb-2">{localData.title}</h4>
               <p className="text-xs text-text-muted mb-4 italic">Last updated: {new Date(Number(localData.updated_at)).toLocaleString()}</p>
               <div className="opacity-80 line-clamp-[12] text-xs font-medium">
                 {localData.body}
               </div>
            </div>
            <button 
              onClick={() => onResolve('LOCAL')}
              className="m-3 btn-primary !bg-accent-green hover:!bg-accent-green/85 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={14} /> Keep My Changes
            </button>
          </div>

          {/* Cloud Version */}
          <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-background-primary">
            <div className="p-3 border-b border-border bg-background-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud size={14} className="text-accent-violet" />
                <span className="text-[10px] font-black uppercase tracking-widest">Shared Cloud Version</span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
              <h4 className="font-bold text-sm mb-2">{cloudData.title}</h4>
              <p className="text-xs text-text-muted mb-4 italic">Last updated: {new Date(cloudData.updated_at).toLocaleString()}</p>
              <div className="opacity-80 line-clamp-[12] text-xs font-medium">
                 {cloudData.body}
              </div>
            </div>
            <button 
              onClick={() => onResolve('CLOUD')}
              className="m-3 btn-primary !bg-accent-violet hover:!bg-accent-violet/85 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ArrowLeftRight size={14} /> Overwrite with Cloud
            </button>
          </div>
        </div>

        <div className="p-4 bg-background-secondary border border-border rounded-xl">
          <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
             <ArrowLeftRight size={12} /> Live Visual Comparison (Added vs Removed)
          </h4>
          <div className="bg-[#0d1117] p-4 rounded-lg border border-border/50 max-h-[200px] overflow-y-auto scrollbar-thin">
            {renderDiff(localData.body || '', cloudData.body || '')}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConflictResolver;
