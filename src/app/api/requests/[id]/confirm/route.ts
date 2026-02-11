import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { confirmDelivery } from '@/lib/services/requests';
import { confirmDeliverySchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;
  const body = await parseBody(request, confirmDeliverySchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await confirmDelivery(id, user.id, body.confirmation_code);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
