import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createProfilesService } from '@/lib/services/profiles';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const supabase = await createClient();
    const service = createProfilesService(supabase);
    const data = await service.getProfileByUserId(id);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/profile/[id]', error);
    return apiError('Erreur interne', 500);
  }
}
