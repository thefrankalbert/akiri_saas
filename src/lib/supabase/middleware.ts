// ============================================
// Supabase Middleware Client (for Next.js Middleware)
// ============================================
// Used in src/proxy.ts to refresh auth tokens on every request

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit } from '@/lib/api/rate-limit';

// Rate limit configurations for auth paths (IP-based)
const AUTH_RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  '/login': { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 minutes
  '/register': { maxRequests: 3, windowMs: 10 * 60 * 1000 }, // 3 attempts per 10 minutes
  '/reset-password': { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 minutes
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth when Supabase is not configured (local dev without env vars)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  // Rate limit auth pages (only on POST-like navigation, i.e., form submissions)
  const pathname = request.nextUrl.pathname;
  for (const [authPath, limits] of Object.entries(AUTH_RATE_LIMITS)) {
    if (pathname.startsWith(authPath) && request.method === 'POST') {
      const ip = getClientIp(request);
      const result = rateLimit(`auth:${authPath}:${ip}`, limits);

      if (!result.success) {
        const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
        return NextResponse.json(
          {
            data: null,
            error: `Trop de tentatives. R\u00e9essayez dans ${retryAfterSeconds} secondes.`,
            status: 429,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfterSeconds) },
          }
        );
      }
    }
  }

  // Also rate limit Supabase auth API calls proxied through the app
  // Auth actions on page GET (initial load with Supabase client-side auth)
  for (const [authPath, limits] of Object.entries(AUTH_RATE_LIMITS)) {
    if (pathname.startsWith(authPath)) {
      const ip = getClientIp(request);
      const result = rateLimit(`auth_page:${authPath}:${ip}`, {
        maxRequests: limits.maxRequests * 3, // More lenient for page loads
        windowMs: limits.windowMs,
      });

      if (!result.success) {
        const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('error', 'rate_limited');
        return NextResponse.redirect(url);
      }
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard
  // to debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/annonces/new',
    '/messages',
    '/transactions',
    '/profil',
    '/parametres',
    '/activite',
    '/demandes',
  ];

  const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // Redirect unauthenticated users trying to access protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/register'];
  const isAuthRoute = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
