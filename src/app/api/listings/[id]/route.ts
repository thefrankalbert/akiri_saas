import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createListingsService } from '@/lib/services/listings';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { createListingSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.getListingById(id);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/listings/[id]', error);
    return apiError('Erreur interne', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const body = await parseBody(request, createListingSchema.partial());
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.updateListing(id, user.id, body);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('PATCH /api/listings/[id]', error);
    return apiError('Erreur interne', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const supabase = await createClient();
    const service = createListingsService(supabase);
    await service.cancelListing(id, user.id);
    return apiSuccess(null);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('DELETE /api/listings/[id]', error);
    return apiError('Erreur interne', 500);
  }
}
