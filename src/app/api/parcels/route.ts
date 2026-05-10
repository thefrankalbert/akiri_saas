import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  parseSearchParams,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createParcelsService } from '@/lib/services/parcels';
import { createParcelPostingSchema, searchParcelsSchema } from '@/lib/validations';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function GET(request: NextRequest) {
  return withServiceHandler('GET /api/parcels', async () => {
    const params = parseSearchParams(request.url, searchParcelsSchema);
    const supabase = await createClient();
    const service = createParcelsService(supabase);
    const data = await service.getParcels(params || {});
    return apiSuccess(data);
  });
}

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/parcels', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`parcels-create:${user.id}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const body = await parseBody(request, createParcelPostingSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createParcelsService(supabase);
    const data = await service.createParcel(user.id, body);
    return apiSuccess(data, 201);
  });
}
