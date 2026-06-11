import React, { useState } from 'react';
import { LogIn, Mail, Lock, Chrome, Eye, EyeOff, AlertCircle, User } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsGuest } from '../lib/auth';

interface LoginPageProps {
  onAuthSuccess: (user: { id: string; email: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError('Check your email to confirm your account, then sign in.');
        setIsSignUp(false);
      } else {
        const data = await signInWithEmail(email, password);
        onAuthSuccess({ id: data.user?.id || '', email: data.user?.email || email });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background-primary z-50 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-green/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-green/10 flex items-center justify-center">
            <LogIn size={32} className="text-accent-green" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Kuro</h1>
          <p className="text-text-muted text-sm">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full bg-background-secondary border border-border rounded-standard p-3 pl-10 font-medium focus:border-accent-green focus:outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full bg-background-secondary border border-border rounded-standard p-3 pl-10 pr-10 font-medium focus:border-accent-green focus:outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/20 rounded-standard text-accent-red text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>{isSignUp ? 'Create Account' : 'Sign In'}</>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background-primary px-3 text-xs text-text-muted">OR</span></div>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-background-secondary border border-border rounded-standard p-3 text-sm font-bold hover:bg-background-tertiary transition-all disabled:opacity-60"
        >
          <Chrome size={20} />
          Continue with Google
        </button>

        <button
          onClick={async () => {
            const user = await signInAsGuest();
            onAuthSuccess({ id: user.id, email: user.email });
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-background-secondary/50 border border-dashed border-border rounded-standard p-3 text-sm font-bold text-text-muted hover:text-text-primary hover:bg-background-tertiary transition-all disabled:opacity-60 mt-2"
        >
          <User size={20} />
          Continue as Guest (Dev Mode)
        </button>

        <p className="text-center mt-6">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-xs text-text-muted hover:text-accent-green transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
