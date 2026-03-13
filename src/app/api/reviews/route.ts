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

export async function POST(request: NextRequest) {
  return withServiceHandler('POST /api/reviews', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await parseBody(request, createReviewSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createReviewsService(supabase);
    const data = await service.createReview(user.id, body);
    return apiSuccess(data, 201);
  });
}
