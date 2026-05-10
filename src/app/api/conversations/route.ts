import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createMessagesService } from '@/lib/services/messages';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

const createConversationSchema = z.object({
  participant_id: z.string().uuid('ID participant invalide'),
  request_id: z.string().uuid('ID demande invalide').optional(),
});

export async function GET() {
  return withServiceHandler('GET /api/conversations', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const supabase = await createClient();
    const service = createMessagesService(supabase);
    const data = await service.getConversations(user.id);
    return apiSuccess(data);
  });
}

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/conversations', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`conversations-create:${user.id}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const body = await parseBody(request, createConversationSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createMessagesService(supabase);
    const data = await service.getOrCreateConversation(
      user.id,
      body.participant_id,
      body.request_id
    );
    return apiSuccess(data, 201);
  });
}
