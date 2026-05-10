import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { refundSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/api/rate-limit';
import { verifyOrigin } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const limit = await rateLimit(`refund:${user.id}`, { maxRequests: 3, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const body = await parseBody(request, refundSchema);
  if (!body) return apiError('Données invalides', 400);

  return withServiceHandler('POST /api/payments/refund', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createTransactionService(supabase, adminSupabase, getStripe());
    const data = await service.refundPayment(body.request_id, user.id);
    return apiSuccess(data);
  });
}
