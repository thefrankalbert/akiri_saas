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
import { createListingsService } from '@/lib/services/listings';
import { createListingSchema, searchListingsSchema } from '@/lib/validations';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function GET(request: NextRequest) {
  return withServiceHandler('GET /api/listings', async () => {
    const params = parseSearchParams(request.url, searchListingsSchema);
    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.getListings(params || {});
    return apiSuccess(data);
  });
}

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/listings', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`listings-create:${user.id}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const body = await parseBody(request, createListingSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.createListing(user.id, body);
    return apiSuccess(data, 201);
  });
}
