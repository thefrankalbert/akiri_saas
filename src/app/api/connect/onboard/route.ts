import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/connect/onboard', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const limit = await rateLimit(`connect-onboard:${user.id}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createTransactionService(supabase, adminSupabase, getStripe());
    const data = await service.createConnectOnboardingLink(user.id);
    return apiSuccess(data);
  });
}
