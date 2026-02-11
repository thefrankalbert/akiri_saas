import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getProfileByUserId, updateProfile } from '@/lib/services/profiles';
import { updateProfileSchema } from '@/lib/validations';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const result = await getProfileByUserId(user.id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, updateProfileSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await updateProfile(user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
