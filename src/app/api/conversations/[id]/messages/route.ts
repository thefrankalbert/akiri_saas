import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { getMessages } from '@/lib/services/messages';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const { id } = await params;

  // Verify the authenticated user is a participant in this conversation
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participant_ids')
    .eq('id', id)
    .single();

  if (!conversation || !conversation.participant_ids.includes(user.id)) {
    return apiError('Acc\u00e8s non autoris\u00e9 \u00e0 cette conversation', 403);
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const before = searchParams.get('before') || undefined;

  const messages = await getMessages(id, limit, before);
  return apiSuccess(messages);
}
