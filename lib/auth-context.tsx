'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { UserProfile } from './types';
import { createBrowserClient, isSupabaseConfigured } from './supabase/client';

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_INACTIVE'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'SYSTEM_NOT_CONFIGURED'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  configured: boolean;
  sessionError: AuthErrorCode | null;
  clearSessionError: () => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: AuthErrorCode }>;
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

// Safely report auth audit events to the server API
async function recordAuthAudit(payload: {
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_EXPIRED';
  userId?: string;
  identifier?: string;
  role?: string;
  roleTitleAr?: string;
  reason?: string;
}) {
  try {
    await fetch('/api/auth/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Audit reporting failure shouldn't crash auth flow
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  configured: false,
  sessionError: null,
  clearSessionError: () => {},
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);
  const [sessionError, setSessionError] = useState<AuthErrorCode | null>(null);
  const activeUserRef = useRef<UserProfile | null>(null);

  activeUserRef.current = user;

  const clearSessionError = useCallback(() => {
    setSessionError(null);
  }, []);

  const logout = useCallback(async () => {
    const currentUser = activeUserRef.current;
    clearProfileCache();

    if (currentUser) {
      void recordAuthAudit({
        action: 'LOGOUT',
        userId: currentUser.id,
        identifier: currentUser.email,
        role: currentUser.role,
        roleTitleAr: currentUser.role_title_ar,
      });
    }

    if (configured) {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    }

    setUser(null);
  }, [configured]);

  // Check user active status in real-time or upon refocus to prevent suspended users from lingering
  const verifyActiveStatus = useCallback(async (userId: string) => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, active')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data || data.active === false) {
        setSessionError('ACCOUNT_SUSPENDED');
        void logout();
      }
    } catch {
      // Ignore background check failure
    }
  }, [logout]);

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

        if (!profile) {
          setSessionError('INVALID_CREDENTIALS');
          setUser(null);
          setLoading(false);
          return;
        }

        if (profile.active === false) {
          setSessionError('ACCOUNT_SUSPENDED');
          setUser(null);
          setLoading(false);
          await supabase.auth.signOut();
          return;
        }

        setUser(profile);
      } catch (error) {
        console.error('Failed to load user profile.', error);
        if (mounted) {
          setSessionError('NETWORK_ERROR');
          setUser(null);
        }
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

      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        if (session?.user.id) {
          void applySession(session.user.id);
        }
      }
    });

    // Periodic check every 25 seconds for active status
    const interval = setInterval(() => {
      if (activeUserRef.current?.id) {
        void verifyActiveStatus(activeUserRef.current.id);
      }
    }, 25_000);

    return () => {
      mounted = false;
      clearInterval(interval);
      listener.subscription.unsubscribe();
    };
  }, [configured, verifyActiveStatus]);

  async function login(identifier: string, password: string): Promise<{ success: boolean; error?: AuthErrorCode }> {
    if (!configured) {
      return { success: false, error: 'SYSTEM_NOT_CONFIGURED' };
    }

    const trimmedIdent = identifier.trim().toLowerCase();
    const email = trimmedIdent.includes('@')
      ? trimmedIdent
      : `${trimmedIdent}@masar.gov.eg`;

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        // Record failed login audit event safely
        void recordAuthAudit({
          action: 'LOGIN_FAILED',
          identifier: trimmedIdent,
          reason: 'INVALID_CREDENTIALS',
        });

        const isNetworkErr = error?.message?.toLowerCase().includes('fetch') ||
                             error?.message?.toLowerCase().includes('network') ||
                             error?.message?.toLowerCase().includes('failed to fetch');

        return {
          success: false,
          error: isNetworkErr ? 'NETWORK_ERROR' : 'INVALID_CREDENTIALS',
        };
      }

      // Fetch profile to verify active state and roles
      clearProfileCache(data.user.id);
      const profile = await fetchProfile(data.user.id);

      if (!profile) {
        await supabase.auth.signOut();
        void recordAuthAudit({
          action: 'LOGIN_FAILED',
          userId: data.user.id,
          identifier: trimmedIdent,
          reason: 'PROFILE_NOT_FOUND',
        });
        return { success: false, error: 'INVALID_CREDENTIALS' };
      }

      if (profile.active === false) {
        await supabase.auth.signOut();
        void recordAuthAudit({
          action: 'LOGIN_FAILED',
          userId: data.user.id,
          identifier: trimmedIdent,
          role: profile.role,
          roleTitleAr: profile.role_title_ar,
          reason: 'ACCOUNT_SUSPENDED',
        });
        return { success: false, error: 'ACCOUNT_SUSPENDED' };
      }

      // Login Success!
      setUser(profile);
      setSessionError(null);

      void recordAuthAudit({
        action: 'LOGIN_SUCCESS',
        userId: profile.id,
        identifier: profile.email,
        role: profile.role,
        roleTitleAr: profile.role_title_ar,
      });

      return { success: true };
    } catch (err: unknown) {
      void recordAuthAudit({
        action: 'LOGIN_FAILED',
        identifier: trimmedIdent,
        reason: 'UNEXPECTED_EXCEPTION',
      });
      return { success: false, error: 'NETWORK_ERROR' };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured,
        sessionError,
        clearSessionError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
