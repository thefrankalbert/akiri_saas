import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createMessagesService } from '@/lib/services/messages';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { sendMessageSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

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
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('POST /api/messages', error);
    return apiError('Erreur interne', 500);
  }
}
