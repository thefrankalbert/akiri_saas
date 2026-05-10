import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createReviewsService } from '@/lib/services/reviews';
import { createReviewSchema } from '@/lib/validations';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/reviews', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`reviews-create:${user.id}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const body = await parseBody(request, createReviewSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createReviewsService(supabase);
    const data = await service.createReview(user.id, body);
    return apiSuccess(data, 201);
  });
}
