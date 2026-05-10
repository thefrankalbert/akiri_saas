import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createMessagesService } from '@/lib/services/messages';
import { sendMessageSchema } from '@/lib/validations';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/messages', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorise', 401);

    const limit = await rateLimit(`messages-send:${user.id}`, {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!limit.success) return apiError('Trop de tentatives', 429);

    const body = await parseBody(request, sendMessageSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createMessagesService(supabase);
    const data = await service.sendMessage(
      user.id,
      body.conversation_id,
      body.content,
      body.content_type,
      body.media_url ?? undefined
    );
    return apiSuccess(data, 201);
  });
}
