import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createMessagesService } from '@/lib/services/messages';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('GET /api/conversations/[id]/messages', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const supabase = await createClient();

    // Verify the authenticated user is a participant in this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', id)
      .single();

    if (!conversation || !conversation.participant_ids.includes(user.id)) {
      return apiError('Accès non autorisé à cette conversation', 403);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const before = searchParams.get('before') || undefined;

    const service = createMessagesService(supabase);
    const data = await service.getMessages(id, limit, before);
    return apiSuccess(data);
  });
}
