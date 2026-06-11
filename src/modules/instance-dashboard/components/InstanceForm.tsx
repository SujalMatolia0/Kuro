import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { useAppStore } from '../../../store';
import { instanceQueries } from '../../../db/queries';
import PinModal from '../../../components/PinModal';

interface InstanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InstanceForm: React.FC<InstanceFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeWorkspace, isUnlocked, settings } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    platform: 'fusion',
    type: 'project',
    expiryDate: '',
    notes: '',
    username: '',
    password: '',
    rememberPassword: false
  });
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // If remember password is checked and not unlocked, show PIN modal
    if (formData.rememberPassword && !isUnlocked) {
      if (!settings.pinHash) {
        setIsPinModalOpen(true); // PIN Setup
        return;
      }
      setIsPinModalOpen(true); // PIN Verification
      return;
    }

    setIsSubmitting(true);
    try {
      await instanceQueries.create({
        ...formData,
        workspaceId: activeWorkspace?.id,
        credentials: formData.rememberPassword ? {
          username: formData.username,
          password: formData.password
        } : null
      });
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="ADD NEW INSTANCE" accent="copper">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* ... existing fields ... */}
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Platform</label>
              <select 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
              >
                <option value="fusion">Oracle Fusion</option>
                <option value="salesforce">Salesforce</option>
                <option value="oic">Oracle Integration (OIC)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Type</label>
              <select 
                className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="project">Project Environment</option>
                <option value="demo">Demo / Sandbox</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Instance Name</label>
            <input 
              className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
              placeholder="e.g. Production ERP"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Instance URL</label>
            <input 
              className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
              placeholder="https://fa-xxxx.oraclecloud.com"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Expiry Date (Optional)</label>
            <input 
              type="date"
              className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Credentials</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={formData.rememberPassword}
                  onChange={(e) => setFormData({...formData, rememberPassword: e.target.checked})}
                />
                <div className={`w-8 h-4 rounded-full transition-colors relative ${formData.rememberPassword ? 'bg-accent-blue' : 'bg-background-tertiary'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.rememberPassword ? 'left-4.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase">Remember Password</span>
              </label>
            </div>
            
            <div className={`space-y-3 transition-opacity duration-300 ${!formData.rememberPassword && 'opacity-30 pointer-events-none'}`}>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Username</label>
                <input 
                  disabled={!formData.rememberPassword}
                  className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                  placeholder="e.g. john.doe@oracle.com"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Password</label>
                <input 
                  type="password"
                  disabled={!formData.rememberPassword}
                  className="w-full bg-background-primary border border-border rounded-standard p-2 text-sm focus:border-accent-blue focus:outline-none"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full btn-primary py-3 mt-4"
          >
            {isSubmitting ? 'INITIALIZING...' : 'ADD TO DASHBOARD'}
          </button>
        </div>
      </Modal>

      {isPinModalOpen && (
        <PinModal 
          isOpen={isPinModalOpen}
          mode={settings.pinHash ? 'verify' : 'setup'}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => {
            setIsPinModalOpen(false);
            handleSubmit();
          }}
        />
      )}
    </>
  );
};

export default InstanceForm;
