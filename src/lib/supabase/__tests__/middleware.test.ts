import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimitAsync: vi.fn().mockResolvedValue({ success: true, remaining: 10, retryAfterMs: 0 }),
}));

// ---------------------------------------------------------------------------
// Helpers — lightweight NextRequest / NextResponse stand-ins
// ---------------------------------------------------------------------------

function makeRequest(path: string, method = 'GET'): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  return new NextRequest(url, { method });
}

/** Shared mock Supabase instance returned by createServerClient */
const mockGetUser = vi.fn();

(createServerClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
  auth: { getUser: mockGetUser },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('updateSession middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default env — Supabase configured
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    // Re-wire createServerClient mock after clearAllMocks
    (createServerClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      auth: { getUser: mockGetUser },
    }));
  });

  // -----------------------------------------------------------------------
  // Helper to import middleware fresh (env vars may differ per test)
  // -----------------------------------------------------------------------
  async function callMiddleware(request: NextRequest) {
    const { updateSession } = await import('../middleware');
    return updateSession(request);
  }

  // =======================================================================
  // 1. Unauthenticated user on protected routes
  // =======================================================================
  describe('unauthenticated user on protected routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it.each(['/dashboard', '/messages', '/transactions', '/profil', '/parametres', '/admin'])(
      'redirects %s to /login',
      async (path) => {
        const request = makeRequest(path);
        const response = await callMiddleware(request);

        expect(response.status).toBe(307);
        const location = new URL(response.headers.get('location')!);
        expect(location.pathname).toBe('/login');
        expect(location.searchParams.get('redirect')).toBe(path);
      }
    );
  });

  // =======================================================================
  // 2. Unauthenticated user on public routes — should pass through
  // =======================================================================
  describe('unauthenticated user on public routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it.each(['/', '/annonces', '/login', '/register'])(
      'passes through for %s (no redirect to /login)',
      async (path) => {
        const request = makeRequest(path);
        const response = await callMiddleware(request);

        // Should be a normal "next" response (200), not a redirect to /login
        const location = response.headers.get('location');
        if (location) {
          const locUrl = new URL(location);
          expect(locUrl.pathname).not.toBe('/login');
        } else {
          expect(response.status).toBe(200);
        }
      }
    );
  });

  // =======================================================================
  // 3. Authenticated user on auth pages — redirect to /dashboard
  // =======================================================================
  describe('authenticated user on auth pages', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it.each(['/login', '/register'])('redirects %s to /dashboard', async (path) => {
      const request = makeRequest(path);
      const response = await callMiddleware(request);

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location')!);
      expect(location.pathname).toBe('/dashboard');
    });
  });

  // =======================================================================
  // 4. Authenticated user on protected routes — should pass through
  // =======================================================================
  describe('authenticated user on protected routes', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
    });

    it.each(['/dashboard', '/messages', '/transactions', '/profil', '/parametres'])(
      'passes through for %s without redirect',
      async (path) => {
        const request = makeRequest(path);
        const response = await callMiddleware(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      }
    );
  });

  // =======================================================================
  // 5. Supabase not configured — should pass through for any route
  // =======================================================================
  describe('Supabase not configured (no env vars)', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    });

    it('passes through without calling Supabase', async () => {
      vi.resetModules();
      const { updateSession } = await import('../middleware');
      const request = makeRequest('/dashboard');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
      expect(createServerClient).not.toHaveBeenCalled();
    });
  });

  // =======================================================================
  // 6. Rate limiting — POST to auth endpoints
  // =======================================================================
  describe('rate limiting on auth POST requests', () => {
    beforeEach(async () => {
      vi.resetModules();
      mockGetUser.mockResolvedValue({ data: { user: null } });
      (createServerClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        auth: { getUser: mockGetUser },
      }));
    });

    it('returns 429 when rate limit is exceeded on POST /login', async () => {
      const { rateLimitAsync } = await import('@/lib/api/rate-limit');
      (rateLimitAsync as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ success: false, remaining: 0, retryAfterMs: 60000 })
        .mockResolvedValue({ success: true, remaining: 10, retryAfterMs: 0 });

      const request = makeRequest('/login', 'POST');
      const { updateSession } = await import('../middleware');
      const response = await updateSession(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('allows request when rate limit is not exceeded', async () => {
      const { rateLimitAsync } = await import('@/lib/api/rate-limit');
      (rateLimitAsync as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        remaining: 4,
        retryAfterMs: 0,
      });

      const request = makeRequest('/login', 'POST');
      const { updateSession } = await import('../middleware');
      const response = await updateSession(request);

      // Should not be 429 — either pass-through (200) or redirect
      expect(response.status).not.toBe(429);
    });
  });

  // =======================================================================
  // 7. Rate limiting — page-level GET rate limit
  // =======================================================================
  describe('rate limiting on auth page GET requests', () => {
    beforeEach(async () => {
      vi.resetModules();
      mockGetUser.mockResolvedValue({ data: { user: null } });
      (createServerClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        auth: { getUser: mockGetUser },
      }));
    });

    it('redirects to / with error=rate_limited when page rate limit exceeded', async () => {
      const { rateLimitAsync } = await import('@/lib/api/rate-limit');
      // First call (POST check) succeeds, second call (page-level) fails
      (rateLimitAsync as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        retryAfterMs: 30000,
      });

      const request = makeRequest('/login');
      const { updateSession } = await import('../middleware');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location')!);
      expect(location.pathname).toBe('/');
      expect(location.searchParams.get('error')).toBe('rate_limited');
    });
  });

  // =======================================================================
  // 8. Redirect includes original path for deep links
  // =======================================================================
  describe('redirect preserves original path', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('sets redirect query param to the protected path', async () => {
      const request = makeRequest('/dashboard/settings');
      const response = await callMiddleware(request);

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location')!);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('redirect')).toBe('/dashboard/settings');
    });
  });
});
