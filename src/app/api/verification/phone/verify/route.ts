// ============================================
// Phone OTP Verify API Route
// ============================================

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPhoneOtpSchema } from '@/lib/validations';
import { createVerificationService } from '@/lib/services/verification';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
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

    const limit = rateLimit(`otp-verify:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives, réessayez plus tard' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = verifyPhoneOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const service = createVerificationService(supabase, adminSupabase);
    const data = await service.verifyPhoneOtp(user.id, parsed.data.phone, parsed.data.code);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: serviceErrorToStatus(error.code) }
      );
    }
    logger.error('POST /api/verification/phone/verify', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
