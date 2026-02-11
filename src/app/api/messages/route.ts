import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { sendMessage } from '@/lib/services/messages';
import { sendMessageSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, sendMessageSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await sendMessage(
    user.id,
    body.conversation_id,
    body.content,
    body.content_type,
    body.media_url ?? undefined
  );

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, 201);
}
