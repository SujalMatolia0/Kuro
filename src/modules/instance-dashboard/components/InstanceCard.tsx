import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, Shield, AlertTriangle, CheckCircle2, MoreVertical, Key, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useAppStore } from '../../../store';
import { instanceQueries } from '../../../db/queries';
import PinModal from '../../../components/PinModal';

interface InstanceCardProps {
  instance: any;
  onUpdate: () => void;
  refreshKey?: number;
}

const InstanceCard: React.FC<InstanceCardProps> = ({ instance, onUpdate, refreshKey }) => {
  const { settings, isUnlocked } = useAppStore();
  const [status, setStatus] = useState<'checking' | 'active' | 'unreachable' | 'expired'>('checking');
  const [creds, setCreds] = useState<{username?: string, password?: string} | null>(null);
  const [showCreds, setShowCreds] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'view' | 'launch' | null>(null);
  
  useEffect(() => {
    checkStatus();
  }, [instance.url, refreshKey]);

  const checkStatus = async () => {
    setStatus('checking');
    try {
      if (instance.expiryDate && new Date(instance.expiryDate) < new Date()) {
        setStatus('expired');
        return;
      }
      const isActive = await window.electron.net.checkStatus(instance.url);
      setStatus(isActive ? 'active' : 'unreachable');
    } catch (e) {
      setStatus('unreachable');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${instance.name}"? This action cannot be undone.`)) {
      await instanceQueries.delete(instance.id);
      onUpdate();
    }
  };

  const handleToggleCreds = async () => {
    if (showCreds) {
      setShowCreds(false);
      return;
    }

    if (!isUnlocked) {
      setPendingAction('view');
      setIsPinModalOpen(true);
      return;
    }

    await loadAndShowCreds();
  };

  const loadAndShowCreds = async () => {
    const data = await instanceQueries.getCredentials(instance.id);
    if (data) {
      setCreds(typeof data === 'string' ? { password: data } : data);
      setShowCreds(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple visual feedback could be added here
  };

  const handleLaunch = async () => {
    const data = await instanceQueries.getCredentials(instance.id);
    
    if (data) {
      if (!isUnlocked) {
        setPendingAction('launch');
        setIsPinModalOpen(true);
        return;
      }
      const credentials = typeof data === 'string' ? { password: data } : data;
      
      // OPTION 1: Auto-copy password and open system browser
      if (credentials.password) {
        copyToClipboard(credentials.password);
      }
    }
    
    // Always open in system browser as requested
    window.electron.shell.openUrl(instance.url);
  };

  const platformColors = {
    fusion: 'text-accent-green bg-accent-green/10',
    salesforce: 'text-accent-blue bg-accent-blue/10',
    oic: 'text-accent-amber bg-accent-amber/10',
  };

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${platformColors[instance.platform] || 'bg-background-tertiary text-text-muted'}`}>
              {instance.platform}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-accent-green' : status === 'unreachable' ? 'bg-accent-red' : 'bg-accent-amber'}`} />
              <span className="uppercase">{status}</span>
            </div>
          </div>
          <h3 className="font-bold text-lg group-hover:text-accent-green transition-colors truncate">
            {instance.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleDelete}
            className="p-1.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-standard transition-all"
            title="Delete Instance"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-xs text-text-muted bg-background-primary p-2 rounded-standard truncate font-mono flex items-center justify-between group/url">
          <span className="truncate">{instance.url}</span>
          <button onClick={handleLaunch} className="opacity-0 group-hover/url:opacity-100 p-1 text-accent-green hover:bg-accent-green/10 rounded transition-all">
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Credentials Section */}
        <div className="bg-background-tertiary/30 rounded-standard border border-border/50 p-2 space-y-2">
          {!showCreds ? (
            <button 
              onClick={handleToggleCreds}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] font-black text-text-muted hover:text-accent-green hover:bg-accent-green/5 rounded transition-all uppercase tracking-widest"
            >
              <Key size={12} />
              <span>View Credentials</span>
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex flex-col truncate">
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Username</span>
                  <span className="text-[11px] font-mono truncate">{creds?.username || 'N/A'}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(creds?.username || '')}
                  className="p-1 text-text-muted hover:text-accent-green transition-colors"
                >
                  <Copy size={12} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex flex-col truncate">
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Password</span>
                  <span className="text-[11px] font-mono truncate">••••••••••••</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => copyToClipboard(creds?.password || '')}
                    className="p-1 text-text-muted hover:text-accent-green transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                  <button 
                    onClick={() => setShowCreds(false)}
                    className="p-1 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <EyeOff size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {instance.expiryDate ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
              <Clock size={12} />
              <span>{new Date(instance.expiryDate).toLocaleDateString()}</span>
            </div>
          ) : <div />}

          <button 
            onClick={handleLaunch}
            className="btn-primary py-1.5 px-4 text-[10px] font-black tracking-widest"
          >
            LAUNCH
          </button>
        </div>
      </div>

      {isPinModalOpen && (
        <PinModal 
          isOpen={isPinModalOpen}
          mode="verify"
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingAction(null);
          }}
          onSuccess={() => {
            setIsPinModalOpen(false);
            if (pendingAction === 'launch') {
              handleLaunch();
            } else {
              loadAndShowCreds();
            }
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
};

import { RefreshCw } from 'lucide-react';

export default InstanceCard;
