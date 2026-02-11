import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { getMessages } from '@/lib/services/messages';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const before = searchParams.get('before') || undefined;

  const messages = await getMessages(id, limit, before);
  return apiSuccess(messages);
}
