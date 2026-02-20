// ============================================
// Phone OTP Send API Route
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPhoneOtpSchema } from '@/lib/validations';
import { sendPhoneOtp } from '@/lib/services/verification';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const limit = rateLimit(`otp-send:${user.id}`, { maxRequests: 3, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives, réessayez plus tard' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = sendPhoneOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await sendPhoneOtp(user.id, parsed.data.phone);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
