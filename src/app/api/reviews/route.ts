import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createReview } from '@/lib/services/reviews';
import { createReviewSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, createReviewSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await createReview(user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, 201);
}
