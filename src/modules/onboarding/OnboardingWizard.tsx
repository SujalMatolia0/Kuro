import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { ChevronRight, ChevronLeft, Rocket, Shield, User, Layout, CheckCircle2 } from 'lucide-react';

const OnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const { profile, settings, updateProfile, updateSettings } = useAppStore();
  
  // Local state for setup
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [focus, setFocus] = useState<'fusion' | 'salesforce' | 'both'>(profile.focus || 'both');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const hashPin = async (input: string) => {
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleNext = async () => {
    setError('');
    
    if (step === 1) {
      if (!name || !email) {
        setError('Please provide your name and work email.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits.');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match.');
        return;
      }
      setStep(4);
    }
  };

  const handleFinish = async () => {
    const pinHash = await hashPin(pin);
    updateProfile({ name, email, focus });
    updateSettings({ pinHash, isOnboarded: true });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center text-accent-green mb-4">
                <User size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Personalize Your Hub</h2>
              <p className="text-text-muted text-sm max-w-sm">Welcome to Dev Companion. Let's start by getting to know you.</p>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-background-primary border border-border rounded-standard p-3 font-medium focus:border-accent-green focus:outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Work Email</label>
                <input 
                  type="email"
                  placeholder="john@company.com"
                  className="w-full bg-background-primary border border-border rounded-standard p-3 font-medium focus:border-accent-green focus:outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-4">
                <Layout size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Technical Focus</h2>
              <p className="text-text-muted text-sm max-w-sm">We'll tailor your dashboard based on the platforms you work with most.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              {[
                { id: 'fusion', label: 'Oracle Fusion Cloud' },
                { id: 'salesforce', label: 'Salesforce Platform' },
                { id: 'both', label: 'Cross-Platform (Both)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFocus(opt.id as any)}
                  className={`p-4 rounded-standard border text-left transition-all ${focus === opt.id ? 'border-accent-green bg-accent-green/5 text-accent-green' : 'border-border bg-background-primary text-text-muted hover:border-border-hover'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{opt.label}</span>
                    {focus === opt.id && <CheckCircle2 size={16} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-amber/10 flex items-center justify-center text-accent-amber mb-4">
                <Shield size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Secure Your Vault</h2>
              <p className="text-text-muted text-sm max-w-sm">This PIN will be required to view sensitive instance credentials once per session.</p>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center block w-full">Set Security PIN</label>
                <input 
                  type="password"
                  maxLength={6}
                  className="w-full bg-background-primary border border-border rounded-standard p-4 text-center text-2xl tracking-[1em] focus:border-accent-green focus:outline-none transition-all"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center block w-full">Confirm PIN</label>
                <input 
                  type="password"
                  maxLength={6}
                  className="w-full bg-background-primary border border-border rounded-standard p-4 text-center text-2xl tracking-[1em] focus:border-accent-green focus:outline-none transition-all"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 flex flex-col items-center text-center py-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green animate-bounce mb-2">
              <Rocket size={48} />
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase">Ready for Takeoff</h2>
            <p className="text-text-muted text-base max-w-sm">
              Welcome aboard, <strong>{name}</strong>!<br/>
              Your workspace is ready and secured. Let's start building your dev environment.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background-primary z-50 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-green/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl bg-background-secondary/50 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[32px] overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="h-1 bg-background-tertiary w-full">
          <div 
            className="h-full bg-accent-green transition-all duration-700 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 sm:p-12 flex-1">
          {renderStep()}
          
          {error && (
            <div className="mt-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-standard text-accent-red text-xs text-center font-bold animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}
        </div>

        <div className="p-8 sm:px-12 sm:pb-12 pt-0 flex items-center justify-between gap-4">
          {step > 1 && step < 4 ? (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button 
              onClick={handleNext}
              className="btn-primary py-3 px-8 flex items-center gap-2 text-sm font-black uppercase tracking-widest"
            >
              <span>{step === 3 ? 'Protect & Continue' : 'Continue'}</span>
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300"
            >
              <Rocket size={24} />
              <span>Enter Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
