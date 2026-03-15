import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createParcelsService } from '@/lib/services/parcels';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('GET /api/parcels/[id]', async () => {
    const { id } = await params;
    const supabase = await createClient();
    const service = createParcelsService(supabase);
    const data = await service.getParcelById(id);
    return apiSuccess(data);
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('PATCH /api/parcels/[id]', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const body = await request.json();

    if (!body.status) return apiError('Statut requis', 400);

    const supabase = await createClient();
    const service = createParcelsService(supabase);
    const data = await service.updateParcelStatus(id, user.id, body.status);
    return apiSuccess(data);
  });
}
