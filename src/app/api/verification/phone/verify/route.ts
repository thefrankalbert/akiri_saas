// ============================================
// Phone OTP Verify API Route
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPhoneOtpSchema } from '@/lib/validations';
import { verifyPhoneOtp } from '@/lib/services/verification';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifyPhoneOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await verifyPhoneOtp(user.id, parsed.data.phone, parsed.data.code);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
