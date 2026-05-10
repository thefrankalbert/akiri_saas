import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createListingsService } from '@/lib/services/listings';
import { createListingSchema } from '@/lib/validations';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('GET /api/listings/[id]', async () => {
    const { id } = await params;
    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.getListingById(id);
    return apiSuccess(data);
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('PATCH /api/listings/[id]', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`listings-update:${user.id}`, {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const { id } = await params;
    const body = await parseBody(request, createListingSchema.partial());
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createListingsService(supabase);
    const data = await service.updateListing(id, user.id, body);
    return apiSuccess(data);
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('DELETE /api/listings/[id]', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`listings-delete:${user.id}`, {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const { id } = await params;
    const supabase = await createClient();
    const service = createListingsService(supabase);
    await service.cancelListing(id, user.id);
    return apiSuccess(null);
  });
}
