// ============================================
// Identity Verification Session Create API Route
// ============================================

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createIdentitySessionSchema } from '@/lib/validations';
import { createVerificationService } from '@/lib/services/verification';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createIdentitySessionSchema.safeParse(body);

    const returnUrl = parsed.success ? parsed.data.return_url : undefined;

    const adminSupabase = await createAdminClient();
    const service = createVerificationService(supabase, adminSupabase);
    const data = await service.createIdentitySession(user.id, returnUrl);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: serviceErrorToStatus(error.code) }
      );
    }
    logger.error('POST /api/verification/identity/create-session', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
