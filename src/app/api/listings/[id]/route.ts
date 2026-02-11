import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getListingById, updateListing, cancelListing } from '@/lib/services/listings';
import { createListingSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const result = await getListingById(id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const body = await parseBody(request, createListingSchema.partial());
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await updateListing(id, user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const result = await cancelListing(id, user.id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(null);
}
