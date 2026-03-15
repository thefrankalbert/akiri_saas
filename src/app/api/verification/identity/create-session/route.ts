// ============================================
// Identity Verification Session Create API Route
// ============================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createIdentitySessionSchema } from '@/lib/validations';
import { createVerificationService } from '@/lib/services/verification';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';

export async function POST(request: Request) {
  return withServiceHandler('POST /api/verification/identity/create-session', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Non autorisé', 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createIdentitySessionSchema.safeParse(body);

    const returnUrl = parsed.success ? parsed.data.return_url : undefined;

    const adminSupabase = await createAdminClient();
    const service = createVerificationService(supabase, adminSupabase);
    const data = await service.createIdentitySession(user.id, returnUrl);

    return apiSuccess(data);
  });
}
