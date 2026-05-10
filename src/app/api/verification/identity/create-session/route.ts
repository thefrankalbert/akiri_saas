// ============================================
// Identity Verification Session Create API Route
// ============================================

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createIdentitySessionSchema } from '@/lib/validations';
import { createVerificationService } from '@/lib/services/verification';
import { apiSuccess, apiError, withServiceHandler } from '@/lib/api/helpers';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: Request) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/verification/identity/create-session', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Non autorise', 401);
    }

    const limit = await rateLimit(`identity-session:${user.id}`, {
      maxRequests: 3,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives, reessayez plus tard', 429);

    const body = await request.json().catch(() => ({}));
    const parsed = createIdentitySessionSchema.safeParse(body);

    const returnUrl = parsed.success ? parsed.data.return_url : undefined;

    const adminSupabase = await createAdminClient();
    const service = createVerificationService(supabase, adminSupabase);
    const data = await service.createIdentitySession(user.id, returnUrl);

    return apiSuccess(data);
  });
}
