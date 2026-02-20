import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { refundPayment } from '@/lib/services/transactions';
import { refundSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const limit = rateLimit(`refund:${user.id}`, { maxRequests: 3, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const body = await parseBody(request, refundSchema);
  if (!body) return apiError('Données invalides', 400);

  const result = await refundPayment(body.request_id, user.id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
