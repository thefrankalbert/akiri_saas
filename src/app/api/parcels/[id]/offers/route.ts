import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getOffersByParcel, createOffer, acceptOffer, rejectOffer } from '@/lib/services/offers';
import { createCarryOfferSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const offers = await getOffersByParcel(id);
  return apiSuccess(offers);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const body = await parseBody(request, createCarryOfferSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  // Ensure parcel_id in body matches URL param
  if (body.parcel_id !== id) return apiError('ID de colis incoh\u00e9rent', 400);

  const result = await createOffer(user.id, body);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, 201);
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await request.json();
  const { offer_id, action } = body;

  if (!offer_id || !action) return apiError('offer_id et action requis', 400);

  if (action === 'accept') {
    const result = await acceptOffer(offer_id, user.id);
    if (result.error) return apiError(result.error, result.status);
    return apiSuccess(result.data);
  }

  if (action === 'reject') {
    const result = await rejectOffer(offer_id, user.id);
    if (result.error) return apiError(result.error, result.status);
    return apiSuccess(result.data);
  }

  return apiError('Action invalide', 400);
}
