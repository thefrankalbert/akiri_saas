import { NextRequest, NextResponse } from 'next/server';

const VALID_LOCALES = ['fr', 'en'];

export async function POST(request: NextRequest) {
  const { locale } = await request.json();

  if (!locale || !VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: 'Locale invalide' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
  });

  return response;
}
