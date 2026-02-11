'use client';

// ============================================
// useAuth — Authentication hook
// ============================================

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
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
    const initAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = await fetchProfile(user.id);
          setState({ user, profile, loading: false, error: null });
        } else {
          setState({ user: null, profile: null, loading: false, error: null });
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          loading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
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
    await supabase.auth.signOut();
  }, [supabase]);

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
  };
}
