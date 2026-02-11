import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { getConversations, getOrCreateConversation } from '@/lib/services/messages';

const createConversationSchema = z.object({
  participant_id: z.string().uuid('ID participant invalide'),
  request_id: z.string().uuid('ID demande invalide').optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const conversations = await getConversations(user.id);
  return apiSuccess(conversations);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const body = await parseBody(request, createConversationSchema);
  if (!body) return apiError('Donn\u00e9es invalides', 400);

  const result = await getOrCreateConversation(user.id, body.participant_id, body.request_id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data, result.status);
}
