import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createParcelsService } from '@/lib/services/parcels';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const service = createParcelsService(supabase);
    const data = await service.getParcelById(id);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/parcels/[id]', error);
    return apiError('Erreur interne', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const body = await request.json();

    if (!body.status) return apiError('Statut requis', 400);

    const supabase = await createClient();
    const service = createParcelsService(supabase);
    const data = await service.updateParcelStatus(id, user.id, body.status);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('PATCH /api/parcels/[id]', error);
    return apiError('Erreur interne', 500);
  }
}
