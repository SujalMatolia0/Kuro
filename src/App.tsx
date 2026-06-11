import React from 'react';
import { useAppStore } from './store';
import OnboardingWizard from './modules/onboarding/OnboardingWizard';
import LoginPage from './components/LoginPage';
import { Shell } from './components/Shell';
import { getSession, onAuthStateChange } from './lib/auth';
import { performAuditCleanup } from './lib/audit';
import { cloudProfileQueries } from './db/cloudQueries';
import { autoSyncNotes } from './lib/sync';
import { sfx } from './lib/sfx';
import { Spinner } from './components/Spinner';

function App() {
  const { user, setUser, settings, updateSettings, profile } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(true);

  // Play startup sound exactly once after login — not on every user/settings re-render
  const didPlayStartup = React.useRef(false);
  React.useEffect(() => {
    if (user && settings.isOnboarded && !didPlayStartup.current) {
      didPlayStartup.current = true;
      sfx.play('startup');
    }
  }, [user, settings.isOnboarded]);

  // Apply theme class to document
  React.useEffect(() => {
    document.documentElement.classList.toggle('light', settings.theme === 'light');
    document.documentElement.classList.toggle('dark', settings.theme !== 'light');
  }, [settings.theme]);

  // Sync profile & audit trail cleanup
  React.useEffect(() => {
    if (user && settings.isOnboarded && profile.email) {
      performAuditCleanup();
      cloudProfileQueries.syncProfile(profile);
      autoSyncNotes(profile.email);
    }
  }, [user, settings.isOnboarded, profile.email]);

  // Initialize Session
  React.useEffect(() => {
    const init = async () => {
      const sessionUser = await getSession();
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          role: 'member',
          teamId: '',
        });
        if (!settings.isOnboarded) {
          updateSettings({ isOnboarded: true });
        }
      }
      setIsLoading(false);
    };
    init();

    const sub = onAuthStateChange((authUser) => {
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          role: 'member',
          teamId: '',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      if (sub && typeof sub.data?.subscription?.unsubscribe === 'function') {
        sub.data.subscription.unsubscribe();
      }
    };
  }, [setUser, settings.isOnboarded, updateSettings]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'var(--bg0)' }}>
        <div className="flex flex-col items-center gap-4">
          <Spinner size={36} color="--jade2" />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onAuthSuccess={(u) => {
          setUser({ id: u.id, email: u.email, role: 'member', teamId: '' });
        }}
      />
    );
  }

  if (!settings.isOnboarded) {
    return <OnboardingWizard />;
  }

  return <Shell />;
}

export default App;
