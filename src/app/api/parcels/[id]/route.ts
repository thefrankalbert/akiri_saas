import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { getParcelById, updateParcelStatus } from '@/lib/services/parcels';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const result = await getParcelById(id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const body = await request.json();

  if (!body.status) return apiError('Statut requis', 400);

  const result = await updateParcelStatus(id, user.id, body.status);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
