import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
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

const updateStatusSchema = z.object({
  action: z.enum([
    'accept',
    'cancel',
    'collect',
    'in_transit',
    'deliver',
    'dispute',
    'resolve_refund',
    'resolve_release',
  ]),
  reason: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const { id } = await params;
  const body = await parseBody(request, updateStatusSchema);
  if (!body) return apiError('Données invalides', 400);

  return withServiceHandler(`PATCH /api/requests/${id}`, async () => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const txService = createTransactionService(supabase, adminSupabase, getStripe());
    const service = createRequestService(supabase, adminSupabase, {
      capturePayment: (requestId) => txService.capturePayment(requestId),
      refundPayment: (requestId, userId) => txService.refundPayment(requestId, userId),
    });

    switch (body.action) {
      case 'accept': {
        const data = await service.acceptRequest(id, user.id);
        return apiSuccess(data);
      }
      case 'cancel': {
        const data = await service.cancelRequest(id, user.id);
        return apiSuccess(data);
      }
      case 'collect': {
        const data = await service.collectParcel(id, user.id);
        return apiSuccess(data);
      }
      case 'in_transit': {
        const data = await service.markInTransit(id, user.id);
        return apiSuccess(data);
      }
      case 'deliver': {
        const data = await service.markDelivered(id, user.id);
        return apiSuccess(data);
      }
      case 'dispute': {
        if (!body.reason) return apiError('Raison du litige requise', 400);
        const data = await service.openDispute(id, user.id, body.reason);
        return apiSuccess(data);
      }
      case 'resolve_refund': {
        const data = await service.resolveDispute(id, user.id, 'refund');
        return apiSuccess(data);
      }
      case 'resolve_release': {
        const data = await service.resolveDispute(id, user.id, 'release');
        return apiSuccess(data);
      }
      default:
        return apiError('Action non supportée', 400);
    }
  });
}
