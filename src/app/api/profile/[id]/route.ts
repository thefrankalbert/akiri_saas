import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { getProfileByUserId } from '@/lib/services/profiles';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  const { id } = await params;

  const result = await getProfileByUserId(id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
