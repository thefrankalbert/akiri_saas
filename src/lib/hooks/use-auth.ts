'use client';

// ============================================
// useAuth — Authentication hook
// ============================================

import { useCallback, useEffect, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
}

// Check for demo session in localStorage
function getDemoSession(): { user: User | null; profile: Profile | null } {
  if (typeof window === 'undefined') return { user: null, profile: null };

  const isDemoSession = localStorage.getItem('akiri_demo_session') === 'true';
  if (!isDemoSession) return { user: null, profile: null };

  try {
    const userStr = localStorage.getItem('akiri_demo_user');
    const profileStr = localStorage.getItem('akiri_demo_profile');

    const user = userStr ? JSON.parse(userStr) : null;
    const profile = profileStr ? JSON.parse(profileStr) : null;

    return { user, profile };
  } catch {
    return { user: null, profile: null };
  }
}

// Clear demo session
function clearDemoSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('akiri_demo_session');
  localStorage.removeItem('akiri_demo_user');
  localStorage.removeItem('akiri_demo_profile');
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    isDemo: false,
  });

  const supabase = createClient();

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }
      return data as Profile;
    },
    [supabase]
  );

  // Initialize auth state
  useEffect(() => {
    // Check for demo session first (works even without Supabase)
    const demoSession = getDemoSession();
    if (demoSession.user && demoSession.profile) {
      queueMicrotask(() => {
        setState({
          user: demoSession.user,
          profile: demoSession.profile,
          loading: false,
          error: null,
          isDemo: true,
        });
      });
      return;
    }

    // Skip Supabase when not configured (local dev without env vars)
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        setState({ user: null, profile: null, loading: false, error: null, isDemo: false });
      });
      return;
    }

    const initAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = await fetchProfile(user.id);
          setState({ user, profile, loading: false, error: null, isDemo: false });
        } else {
          setState({ user: null, profile: null, loading: false, error: null, isDemo: false });
        }
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Erreur de connexion',
        }));
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          loading: false,
          error: null,
          isDemo: false,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
          isDemo: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // Sign in with email/password
  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error: error.message };
      }

      return { error: null };
    },
    [supabase]
  );

  // Sign up with email/password
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata: { first_name: string; last_name: string }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return { error: error.message };
      }

      setState((prev) => ({ ...prev, loading: false }));
      return { error: null };
    },
    [supabase]
  );

  // Sign out
  const signOut = useCallback(async () => {
    // Clear demo session if in demo mode
    if (state.isDemo) {
      clearDemoSession();
      setState({ user: null, profile: null, loading: false, error: null, isDemo: false });
      return;
    }
    await supabase.auth.signOut();
  }, [supabase, state.isDemo]);

  // Reset password
  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    },
    [supabase]
  );

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!state.user,
    isDemo: state.isDemo,
  };
}
