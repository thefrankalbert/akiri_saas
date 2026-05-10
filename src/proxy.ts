// ============================================
// Next.js 16 Proxy — Auth session refresh
// ============================================
// Migrated from middleware.ts to proxy.ts (Next.js 16 convention)

import { NextResponse, type NextRequest } from 'next/server';
import { buildCspHeader } from '@/lib/csp';

export async function proxy(request: NextRequest) {
  // SECURITY: Block x-middleware-subrequest header to prevent middleware bypass (CVE-2025-29927)
  if (request.headers.get('x-middleware-subrequest')) {
    return new NextResponse(null, { status: 403 });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCspHeader(nonce);

  // Forward nonce to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Skip auth entirely when Supabase is not configured (local dev without env vars)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', csp);
    return response;
  }

  // Dynamically import supabase middleware only when configured
  const { updateSession } = await import('@/lib/supabase/middleware');
  const response = await updateSession(request, requestHeaders);
  response.headers.set('Content-Security-Policy', csp);
  return response;
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
