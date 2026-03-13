import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody, parseSearchParams } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createListingsService } from '@/lib/services/listings';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { createListingSchema, searchListingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.url, searchListingsSchema);
    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.getListings(params || {});
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/listings', error);
    return apiError('Erreur interne', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await parseBody(request, createListingSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.createListing(user.id, body);
    return apiSuccess(data, 201);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('POST /api/listings', error);
    return apiError('Erreur interne', 500);
  }
}
