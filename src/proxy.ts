// ============================================
// Next.js 16 Proxy — Auth session refresh
// ============================================
// Migrated from middleware.ts to proxy.ts (Next.js 16 convention)

import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Skip auth entirely when Supabase is not configured (local dev without env vars)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  // Dynamically import supabase middleware only when configured
  const { updateSession } = await import('@/lib/supabase/middleware');
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only match actual page routes, not internal Next.js requests.
     * Exclude:
     * - _next (all internal Next.js requests including RSC)
     * - api routes
     * - static files
     */
    '/((?!_next|api|favicon.ico|manifest|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$).*)',
  ],
};
