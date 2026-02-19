// ============================================
// Supabase Server Client (Server Components, Route Handlers, Server Actions)
// ============================================
// Use this in Server Components, Route Handlers, and Server Actions

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const FALLBACK_URL = 'http://localhost:54321';
const FALLBACK_KEY = 'placeholder-key';

/**
 * Whether Supabase environment variables are configured.
 * When false, services should return empty data to avoid errors.
 */
export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Create an admin client with service role key
 * Use only in server-side code for admin operations
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
