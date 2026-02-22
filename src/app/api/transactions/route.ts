import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { getTransactionsByUser } from '@/lib/services/transactions';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page')) || 20));

  const result = await getTransactionsByUser(user.id, page, perPage);
  return apiSuccess(result);
}
