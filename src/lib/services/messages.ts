// ============================================
// Messages Service — DI factory pattern
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Conversation, Message } from '@/types';
import { createNotification } from './notifications';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';

export function createMessagesService(supabase: SupabaseClient) {
  return {
    /**
     * Get or create a conversation between two users
     */
    async getOrCreateConversation(
      userId1: string,
      userId2: string,
      requestId?: string
    ): Promise<Conversation> {
      // Check for existing conversation between these users
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userId1, userId2])
        .maybeSingle();

      if (existing) {
        return existing as Conversation;
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
        logger.error('getOrCreateConversation: erreur lors de la création', error);
        throw new ServiceError(error.message, 'VALIDATION', error);
      }

      return data as Conversation;
    },

    /**
     * Get conversations for a user
     */
    async getConversations(userId: string): Promise<Conversation[]> {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, request:shipment_requests!request_id(*)')
        .contains('participant_ids', [userId])
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        logger.error('getConversations: erreur lors de la récupération', error);
        throw new ServiceError(
          'Erreur lors de la récupération des conversations',
          'INTERNAL',
          error
        );
      }

      return (data as Conversation[]) || [];
    },

    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId: string, limit = 50, before?: string): Promise<Message[]> {
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

      if (error) {
        logger.error('getMessages: erreur lors de la récupération', error);
        throw new ServiceError('Erreur lors de la récupération des messages', 'INTERNAL', error);
      }

      // Return in chronological order
      return ((data as Message[]) || []).reverse();
    },

    /**
     * Send a message
     */
    async sendMessage(
      senderId: string,
      conversationId: string,
      content: string,
      contentType: 'text' | 'image' | 'voice' | 'system' = 'text',
      mediaUrl?: string
    ): Promise<Message> {
      // Verify the user is a participant
      const { data: conv } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .contains('participant_ids', [senderId])
        .single();

      if (!conv) {
        throw new ServiceError('Conversation introuvable', 'NOT_FOUND');
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
        logger.error("sendMessage: erreur lors de l'envoi", error);
        throw new ServiceError(error.message, 'VALIDATION', error);
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
          contentType === 'image' ? 'Vous avez reçu une image.' : preview,
          { conversation_id: conversationId }
        );
      }

      return message as Message;
    },

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);
    },

    /**
     * Get unread message count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
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
    },
  };
}
