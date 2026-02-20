// ============================================
// Supabase Browser Client (Client Components)
// ============================================
// Use this in 'use client' components

import { createBrowserClient } from '@supabase/ssr';

/**
 * Whether Supabase environment variables are configured.
 * When false, hooks and components should skip Supabase calls
 * to avoid network errors in local dev without a Supabase project.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured =
  !!supabaseUrl &&
  !!supabaseKey &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseKey !== 'your_supabase_anon_key';

// Module-level singleton — same reference across renders, safe for useEffect deps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedClient: any = null;

export function createClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createBrowserClient(
    supabaseUrl || 'http://localhost:54321',
    supabaseKey || 'placeholder-key'
  );
  return cachedClient;
}
