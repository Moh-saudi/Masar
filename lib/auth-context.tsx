'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from './types';
import { createBrowserClient, isSupabaseConfigured } from './supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  configured: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const PROFILE_COLUMNS = [
  'id',
  'email',
  'full_name',
  'national_id',
  'role',
  'role_title_ar',
  'active',
  'governorate_id',
  'governorate_name_ar',
  'district_id',
  'district_name_ar',
].join(',');

type ProfileRow = UserProfile & { active?: boolean };

const profilePromiseCache = new Map<string, Promise<ProfileRow | null>>();

function clearProfileCache(userId?: string) {
  if (userId) profilePromiseCache.delete(userId);
  else profilePromiseCache.clear();
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const cached = profilePromiseCache.get(userId);
  if (cached) return cached;

  const request = (async () => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as ProfileRow | null) ?? null;
  })();

  profilePromiseCache.set(userId, request);

  try {
    return await request;
  } catch (error) {
    profilePromiseCache.delete(userId);
    throw error;
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  configured: false,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient();
    let mounted = true;

    async function applySession(userId?: string) {
      if (!userId) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await fetchProfile(userId);

        if (!mounted) return;

        if (!profile || profile.active === false) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(profile);
      } catch (error) {
        console.error('Failed to load user profile.', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session?.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearProfileCache();
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user.id) {
        void applySession(session.user.id);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [configured]);

  async function login(identifier: string, password: string) {
    if (!configured) {
      return { success: false, error: 'SYSTEM_NOT_CONFIGURED' };
    }

    const supabase = createBrowserClient();
    const email = identifier.includes('@')
      ? identifier
      : `${identifier}@masar.gov.eg`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login failed' };
    }

    try {
      const profile = await fetchProfile(data.user.id);

      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'PROFILE_NOT_FOUND' };
      }

      if (profile.active === false) {
        await supabase.auth.signOut();
        return { success: false, error: 'ACCOUNT_DISABLED' };
      }

      setUser(profile);
      return { success: true };
    } catch {
      await supabase.auth.signOut();
      return { success: false, error: 'PROFILE_LOAD_FAILED' };
    }
  }

  async function logout() {
    clearProfileCache();

    if (!configured) {
      setUser(null);
      return;
    }

    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, configured, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
