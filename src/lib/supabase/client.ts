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
export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Module-level singleton — same reference across renders, safe for useEffect deps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedClient: any = null;

export function createClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  );
  return cachedClient;
}
