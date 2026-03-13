import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createOffersService } from '@/lib/services/offers';
import { createCarryOfferSchema } from '@/lib/validations';
import { z } from 'zod/v4';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('GET /api/parcels/[id]/offers', async () => {
    const { id } = await params;
    const supabase = await createClient();
    const service = createOffersService(supabase);
    const data = await service.getOffersByParcel(id);
    return apiSuccess(data);
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('POST /api/parcels/[id]/offers', async () => {
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
  });
}

const offerActionSchema = z.object({
  offer_id: z.string().uuid(),
  action: z.enum(['accept', 'reject']),
});

export async function PATCH(request: NextRequest) {
  return withServiceHandler('PATCH /api/parcels/[id]/offers', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await parseBody(request, offerActionSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createOffersService(supabase);

    if (body.action === 'accept') {
      const data = await service.acceptOffer(body.offer_id, user.id);
      return apiSuccess(data);
    }

    const data = await service.rejectOffer(body.offer_id, user.id);
    return apiSuccess(data);
  });
}
