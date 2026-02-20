import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { confirmDelivery } from '@/lib/services/requests';
import { confirmDeliverySchema } from '@/lib/validations';
import { rateLimit } from '@/lib/api/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const limit = rateLimit(`confirm:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const { id } = await params;
  const body = await parseBody(request, confirmDeliverySchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await confirmDelivery(id, user.id, body.confirmation_code);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
