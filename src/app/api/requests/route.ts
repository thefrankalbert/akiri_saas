import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createRequest } from '@/lib/services/requests';
import { createRequestSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, createRequestSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await createRequest(user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, 201);
}
