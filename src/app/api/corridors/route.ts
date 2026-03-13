import { apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createCorridorsService } from '@/lib/services/corridors';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createClient();
    const service = createCorridorsService(supabase);
    const data = await service.getCorridors();
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/corridors', error);
    return apiError('Erreur interne', 500);
  }
}
