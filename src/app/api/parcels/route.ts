import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody, parseSearchParams } from '@/lib/api/helpers';
import { getParcels, createParcel } from '@/lib/services/parcels';
import { createParcelPostingSchema, searchParcelsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.url, searchParcelsSchema);

  const result = await getParcels(params || {});
  return apiSuccess(result);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, createParcelPostingSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await createParcel(user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, 201);
}
