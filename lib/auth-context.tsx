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

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (mounted && profile) {
        setUser(profile as UserProfile);
      }

      if (mounted) setLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) setUser(profile as UserProfile);

    return { success: true };
  }

  async function logout() {
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
