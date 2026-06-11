import { supabase } from './supabase';
import { useAppStore } from '../store';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const stored = localStorage.getItem('kuro_dev_user');
    if (stored) {
      return JSON.parse(stored);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
        avatarUrl: session.user.user_metadata?.avatar_url,
      };
      localStorage.setItem('kuro_dev_user', JSON.stringify(user));
      return user;
    }
    return null;
  } catch {
    const stored = localStorage.getItem('kuro_dev_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }
}

export async function signInAsGuest(): Promise<AuthUser> {
  const user: AuthUser = {
    id: crypto.randomUUID(),
    email: 'dev@local.dev',
    name: 'Dev User',
  };
  localStorage.setItem('kuro_dev_user', JSON.stringify(user));
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  useAppStore.getState().setUser(null);
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
        avatarUrl: session.user.user_metadata?.avatar_url,
      });
    } else {
      callback(null);
    }
  });
}
