import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createProfilesService } from '@/lib/services/profiles';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { updateProfileSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const supabase = await createClient();
    const service = createProfilesService(supabase);
    const data = await service.getProfileByUserId(user.id);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/profile', error);
    return apiError('Erreur interne', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await parseBody(request, updateProfileSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createProfilesService(supabase);
    const data = await service.updateProfile(user.id, body);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('PATCH /api/profile', error);
    return apiError('Erreur interne', 500);
  }
}
