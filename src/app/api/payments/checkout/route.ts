import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createCheckoutSession } from '@/lib/services/transactions';
import { createCheckoutSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, createCheckoutSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await createCheckoutSession(body.request_id, user.id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
