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
import { createRequestService } from '@/lib/services/requests';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { createRequestSchema } from '@/lib/validations';
import { sendConfirmationCodeEmail } from '@/lib/email';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const limit = await rateLimit(`create-request:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const body = await parseBody(request, createRequestSchema);
  if (!body) return apiError('Données invalides', 400);

  return withServiceHandler('POST /api/requests', async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const txService = createTransactionService(supabase, adminSupabase, getStripe());
    const service = createRequestService(supabase, adminSupabase, {
      capturePayment: (requestId) => txService.capturePayment(requestId),
      refundPayment: (requestId, userId) => txService.refundPayment(requestId, userId),
    });
    const data = await service.createRequest(user.id, body);
    if (data.confirmationCode && user.email) {
      await sendConfirmationCodeEmail(user.email, data.confirmationCode, 'votre trajet');
    }
    return apiSuccess(data, 201);
  });
}
