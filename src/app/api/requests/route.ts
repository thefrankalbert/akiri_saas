import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createRequestService } from '@/lib/services/requests';
import { createTransactionService } from '@/lib/services/transactions';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe';
import { createRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const body = await parseBody(request, createRequestSchema);
  if (!body) return apiError('Données invalides', 400);

  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const txService = createTransactionService(supabase, adminSupabase, getStripe());
    const service = createRequestService(supabase, adminSupabase, {
      capturePayment: (requestId) => txService.capturePayment(requestId),
      refundPayment: (requestId, userId) => txService.refundPayment(requestId, userId),
    });
    const data = await service.createRequest(user.id, body);
    return apiSuccess(data, 201);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('POST /api/requests', error, { userId: user.id });
    return apiError('Erreur interne', 500);
  }
}
