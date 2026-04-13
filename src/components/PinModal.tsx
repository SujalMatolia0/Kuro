import React, { useState } from 'react';
import Modal from './Modal';
import { useAppStore } from '../store';
import { Lock, Unlock } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'setup' | 'verify';
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, mode }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const { settings, updateSettings, setUnlocked } = useAppStore();

  const hashPin = async (input: string) => {
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAction = async () => {
    const hashedInput = await hashPin(pin);
    
    if (mode === 'setup') {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
      updateSettings({ pinHash: hashedInput }); 
      setUnlocked(true);
      onSuccess();
    } else {
      // Logic: Compare hash. Support plain-text fallback once for migration.
      if (hashedInput === settings.pinHash || pin === settings.pinHash) {
        setUnlocked(true);
        // If it was a plain text match, upgrade it to hash
        if (pin === settings.pinHash && hashedInput !== settings.pinHash) {
          updateSettings({ pinHash: hashedInput });
        }
        onSuccess();
      } else {
        setError('Incorrect PIN');
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'setup' ? 'SET SECURITY PIN' : 'UNLOCK VAULT'}
    >
      <div className="space-y-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center text-accent-green mb-2">
          {mode === 'setup' ? <Lock size={32} /> : <Unlock size={32} />}
        </div>
        
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center block w-full">
              {mode === 'setup' ? 'Enter New PIN' : 'Enter your PIN to continue'}
            </label>
            <input 
              type="password"
              autoFocus
              maxLength={6}
              className="w-full bg-background-primary border border-border rounded-standard p-4 text-center text-2xl tracking-[1em] focus:border-accent-green focus:outline-none transition-colors"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {mode === 'setup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center block w-full">Confirm PIN</label>
              <input 
                type="password"
                maxLength={6}
                className="w-full bg-background-primary border border-border rounded-standard p-4 text-center text-2xl tracking-[1em] focus:border-accent-green focus:outline-none transition-colors"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          {error && <p className="text-accent-red text-center text-xs font-bold animate-pulse">{error}</p>}

          <button 
            onClick={handleAction}
            className="w-full btn-primary py-4 font-black"
          >
            {mode === 'setup' ? 'CONFIRM PIN' : 'UNLOCK'}
          </button>
        </div>

        <p className="text-[10px] text-text-muted text-center max-w-[200px]">
          {mode === 'setup' 
            ? 'This PIN is required to access sensitive credentials once per session.' 
            : 'Forgot PIN? Contact your administrator to reset it.'}
        </p>
      </div>
    </Modal>
  );
};

export default PinModal;
