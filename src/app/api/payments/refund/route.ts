import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { refundPayment } from '@/lib/services/transactions';
import { refundSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, refundSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  // Additional authorization check could be added here
  const result = await refundPayment(body.request_id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
