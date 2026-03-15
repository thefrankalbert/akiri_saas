import { NextRequest } from 'next/server';
import { apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createReviewsService } from '@/lib/services/reviews';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('GET /api/reviews/[userId]', async () => {
    const { userId } = await params;
    const supabase = await createClient();
    const service = createReviewsService(supabase);
    const data = await service.getReviewsByUser(userId);
    return apiSuccess(data);
  });
}
