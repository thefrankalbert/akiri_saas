import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody, parseSearchParams } from '@/lib/api/helpers';
import { getListings, createListing } from '@/lib/services/listings';
import { createListingSchema, searchListingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.url, searchListingsSchema);

  const result = await getListings(params || {});
  return apiSuccess(result);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, createListingSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await createListing(user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, 201);
}
