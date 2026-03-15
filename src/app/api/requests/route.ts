import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createRequestService } from '@/lib/services/requests';
import { createTransactionService } from '@/lib/services/transactions';
import { getStripe } from '@/lib/stripe';
import { createRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

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
    return apiSuccess(data, 201);
  });
}
