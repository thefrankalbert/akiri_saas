// ============================================
// Messages Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { Conversation, Message, ApiResponse } from '@/types';
import { createNotification } from './notifications';

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  requestId?: string
): Promise<ApiResponse<Conversation>> {
  const supabase = await createClient();

  // Check for existing conversation between these users
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [userId1, userId2])
    .maybeSingle();

  if (existing) {
    return { data: existing as Conversation, error: null, status: 200 };
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participant_ids: [userId1, userId2],
      request_id: requestId || null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  return { data: data as Conversation, error: null, status: 201 };
}

/**
 * Get conversations for a user
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*, request:shipment_requests!request_id(*)')
    .contains('participant_ids', [userId])
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return (data as Conversation[]) || [];
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<Message[]> {
  const supabase = await createClient();

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) return [];

  // Return in chronological order
  return ((data as Message[]) || []).reverse();
}

/**
 * Send a message
 */
export async function sendMessage(
  senderId: string,
  conversationId: string,
  content: string,
  contentType: 'text' | 'image' | 'voice' | 'system' = 'text',
  mediaUrl?: string
): Promise<ApiResponse<Message>> {
  const supabase = await createClient();

  // Verify the user is a participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('participant_ids')
    .eq('id', conversationId)
    .contains('participant_ids', [senderId])
    .single();

  if (!conv) {
    return { data: null, error: 'Conversation introuvable', status: 404 };
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      content_type: contentType,
      media_url: mediaUrl || null,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 400 };
  }

  // Update conversation last_message
  await supabase
    .from('conversations')
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  // Notify other participants
  const otherParticipants = (conv.participant_ids as string[]).filter((id) => id !== senderId);
  const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;
  for (const recipientId of otherParticipants) {
    await createNotification(
      recipientId,
      'new_message',
      'Nouveau message',
      contentType === 'image' ? 'Vous avez re\u00e7u une image.' : preview,
      { conversation_id: conversationId }
    );
  }

  return { data: message as Message, error: null, status: 201 };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get user's conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .contains('participant_ids', [userId]);

  if (!conversations || conversations.length === 0) return 0;

  const conversationIds = conversations.map((c) => c.id);

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .neq('sender_id', userId)
    .eq('is_read', false);

  return count || 0;
}
