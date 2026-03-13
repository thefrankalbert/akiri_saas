import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createRequestService } from '@/lib/services/requests';
import { createTransactionService } from '@/lib/services/transactions';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe';
import { confirmDeliverySchema } from '@/lib/validations';
import { rateLimitAsync } from '@/lib/api/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const limit = await rateLimitAsync(`confirm:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const { id } = await params;
  const body = await parseBody(request, confirmDeliverySchema);
  if (!body) return apiError('Données invalides', 400);

  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const txService = createTransactionService(supabase, adminSupabase, getStripe());
    const service = createRequestService(supabase, adminSupabase, {
      capturePayment: (requestId) => txService.capturePayment(requestId),
      refundPayment: (requestId, userId) => txService.refundPayment(requestId, userId),
    });
    const data = await service.confirmDelivery(id, user.id, body.confirmation_code);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error(`POST /api/requests/${id}/confirm`, error, { userId: user.id });
    return apiError('Erreur interne', 500);
  }
}
