import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api/helpers';
import { getReviewsByUser } from '@/lib/services/reviews';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await params;

  const reviews = await getReviewsByUser(userId);
  return apiSuccess(reviews);
}
