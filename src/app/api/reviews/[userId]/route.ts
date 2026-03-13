import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createReviewsService } from '@/lib/services/reviews';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const service = createReviewsService(supabase);
    const data = await service.getReviewsByUser(userId);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/reviews/[userId]', error);
    return apiError('Erreur interne', 500);
  }
}
