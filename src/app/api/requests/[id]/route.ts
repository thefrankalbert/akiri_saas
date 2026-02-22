import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import {
  acceptRequest,
  cancelRequest,
  collectParcel,
  markInTransit,
  markDelivered,
  openDispute,
  resolveDispute,
} from '@/lib/services/requests';

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
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const body = await parseBody(request, updateStatusSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  switch (body.action) {
    case 'accept': {
      const result = await acceptRequest(id, user.id);
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'cancel': {
      const result = await cancelRequest(id, user.id);
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'collect': {
      const result = await collectParcel(id, user.id);
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'in_transit': {
      const result = await markInTransit(id, user.id);
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'deliver': {
      const result = await markDelivered(id, user.id);
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'dispute': {
      if (!body.reason) return apiError('Raison du litige requise', 400);
      const result = await openDispute(id, user.id, body.reason);
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'resolve_refund': {
      const result = await resolveDispute(id, user.id, 'refund');
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    case 'resolve_release': {
      const result = await resolveDispute(id, user.id, 'release');
      if (result.error) return apiError(result.error, result.status);
      return apiSuccess(result.data);
    }
    default:
      return apiError('Action non support\u00e9e', 400);
  }
}
