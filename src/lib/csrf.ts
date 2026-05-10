import { NextResponse } from 'next/server';

/**
 * Verify that the request originates from an allowed origin.
 * Basic CSRF protection for public API routes.
 * Server Actions are already protected by Next.js built-in mechanisms.
 */
export function verifyOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (origin) {
    const isLocalDev =
      (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
      origin.startsWith('http://localhost:');

    if (isLocalDev || origin === appUrl || origin.startsWith(appUrl)) {
      return null;
    }
  }

  if (referer) {
    const isLocalReferer =
      (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
      referer.includes('localhost:');
    const appHost = new URL(appUrl).host;
    if (isLocalReferer || referer.includes(appHost)) {
      return null;
    }
  }

  // Unit tests do not send browser headers — allow in test env.
  // Webhooks (Stripe) must NOT call verifyOrigin — they use signature verification.
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
