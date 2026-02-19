// ============================================
// Identity Verification Session Create API Route
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createIdentitySessionSchema } from '@/lib/validations';
import { createIdentitySession } from '@/lib/services/verification';

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
    const result = await createIdentitySession(user.id, returnUrl);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
