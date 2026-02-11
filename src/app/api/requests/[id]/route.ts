import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { acceptRequest } from '@/lib/services/requests';

const updateStatusSchema = z.object({
  action: z.enum(['accept', 'cancel']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const body = await parseBody(request, updateStatusSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  if (body.action === 'accept') {
    const result = await acceptRequest(id, user.id);
    if (result.error) return apiError(result.error, result.status);
    return apiSuccess(result.data);
  }

  return apiError('Action non support\u00e9e', 400);
}
