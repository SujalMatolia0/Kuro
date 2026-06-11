import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';

const AuthCallback = () => {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'member',
          teamId: '',
        });
      }
    };
    handleAuthCallback();
  }, [setUser]);

  return null;
};

export default AuthCallback;
