import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createOffersService } from '@/lib/services/offers';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { createCarryOfferSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const service = createOffersService(supabase);
    const data = await service.getOffersByParcel(id);
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('GET /api/parcels/[id]/offers', error);
    return apiError('Erreur interne', 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const body = await parseBody(request, createCarryOfferSchema);
    if (!body) return apiError('Données invalides', 400);

    // Ensure parcel_id in body matches URL param
    if (body.parcel_id !== id) return apiError('ID de colis incohérent', 400);

    const supabase = await createClient();
    const service = createOffersService(supabase);
    const data = await service.createOffer(user.id, body);
    return apiSuccess(data, 201);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('POST /api/parcels/[id]/offers', error);
    return apiError('Erreur interne', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await request.json();
    const { offer_id, action } = body;

    if (!offer_id || !action) return apiError('offer_id et action requis', 400);

    const supabase = await createClient();
    const service = createOffersService(supabase);

    if (action === 'accept') {
      const data = await service.acceptOffer(offer_id, user.id);
      return apiSuccess(data);
    }

    if (action === 'reject') {
      const data = await service.rejectOffer(offer_id, user.id);
      return apiSuccess(data);
    }

    return apiError('Action invalide', 400);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('PATCH /api/parcels/[id]/offers', error);
    return apiError('Erreur interne', 500);
  }
}
