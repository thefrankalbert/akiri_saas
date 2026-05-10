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
import { confirmDeliverySchema } from '@/lib/validations';
import { rateLimitAsync } from '@/lib/api/rate-limit';
import { verifyOrigin } from '@/lib/csrf';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const limit = await rateLimitAsync(`confirm:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const { id } = await params;
  const body = await parseBody(request, confirmDeliverySchema);
  if (!body) return apiError('Données invalides', 400);

  return withServiceHandler(`POST /api/requests/${id}/confirm`, async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const txService = createTransactionService(supabase, adminSupabase, getStripe());
    const service = createRequestService(supabase, adminSupabase, {
      capturePayment: (requestId) => txService.capturePayment(requestId),
      refundPayment: (requestId, userId) => txService.refundPayment(requestId, userId),
    });
    const data = await service.confirmDelivery(id, user.id, body.confirmation_code);
    return apiSuccess(data);
  });
}
