import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createMessagesService } from '@/lib/services/messages';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// ============================================
// Test Data Factories
// ============================================

const MOCK_USER_1 = 'user-aaa-111';
const MOCK_USER_2 = 'user-bbb-222';
const MOCK_CONV_ID = 'conv-abc-789';
const MOCK_REQUEST_ID = 'req-xyz-456';
const MOCK_MESSAGE_ID = 'msg-001';

function mockConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_CONV_ID,
    participant_ids: [MOCK_USER_1, MOCK_USER_2],
    request_id: MOCK_REQUEST_ID,
    last_message: 'Bonjour',
    last_message_at: '2026-01-15T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    ...overrides,
  };
}

function mockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_MESSAGE_ID,
    conversation_id: MOCK_CONV_ID,
    sender_id: MOCK_USER_1,
    content: 'Bonjour, est-ce que le colis est prêt ?',
    content_type: 'text',
    media_url: null,
    is_read: false,
    created_at: '2026-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Adds `contains` to a mock chain since the base helper does not include it.
 */
function addContains(chain: Record<string, ReturnType<typeof vi.fn>>) {
  if (!chain.contains) {
    chain.contains = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function setup() {
  const mockSupabase = createMockSupabase();
  // Add `contains` to tables that need it
  addContains(mockSupabase._getChain('conversations'));
  addContains(mockSupabase._getChain('messages'));
  const service = createMessagesService(asSupabase(mockSupabase));
  return { mockSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Messages Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // getOrCreateConversation
  // -----------------------------------------
  describe('getOrCreateConversation', () => {
    it('returns existing conversation when one exists', async () => {
      const { mockSupabase, service } = setup();
      const conv = mockConversation();

      // Chain: .from('conversations').select('*').contains(...).maybeSingle()
      mockSupabase._getChain('conversations').maybeSingle.mockResolvedValue({
        data: conv,
        error: null,
      });

      const result = await service.getOrCreateConversation(
        MOCK_USER_1,
        MOCK_USER_2,
        MOCK_REQUEST_ID
      );

      expect(result.id).toBe(MOCK_CONV_ID);
      expect(result.participant_ids).toEqual([MOCK_USER_1, MOCK_USER_2]);
      // Should not have called insert
      expect(mockSupabase._getChain('conversations').insert).not.toHaveBeenCalled();
    });

    it('creates a new conversation when none exists', async () => {
      const { mockSupabase, service } = setup();
      const newConv = mockConversation();

      // maybeSingle returns null (no existing conversation)
      mockSupabase._getChain('conversations').maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      // insert -> select -> single
      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: newConv,
        error: null,
      });

      const result = await service.getOrCreateConversation(
        MOCK_USER_1,
        MOCK_USER_2,
        MOCK_REQUEST_ID
      );

      expect(result.id).toBe(MOCK_CONV_ID);
      expect(mockSupabase._getChain('conversations').insert).toHaveBeenCalledWith({
        participant_ids: [MOCK_USER_1, MOCK_USER_2],
        request_id: MOCK_REQUEST_ID,
      });
    });

    it('creates conversation with null request_id when not provided', async () => {
      const { mockSupabase, service } = setup();
      const newConv = mockConversation({ request_id: null });

      mockSupabase._getChain('conversations').maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: newConv,
        error: null,
      });

      await service.getOrCreateConversation(MOCK_USER_1, MOCK_USER_2);

      expect(mockSupabase._getChain('conversations').insert).toHaveBeenCalledWith({
        participant_ids: [MOCK_USER_1, MOCK_USER_2],
        request_id: null,
      });
    });

    it('throws VALIDATION when insert fails', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('conversations').maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      try {
        await service.getOrCreateConversation(MOCK_USER_1, MOCK_USER_2);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toBe('Insert failed');
      }
    });
  });

  // -----------------------------------------
  // getConversations
  // -----------------------------------------
  describe('getConversations', () => {
    it('returns conversations for a user', async () => {
      const { mockSupabase, service } = setup();
      const convs = [mockConversation(), mockConversation({ id: 'conv-2' })];

      // Chain: .from('conversations').select(...).contains(...).order(...) -> resolves
      mockSupabase._getChain('conversations').order.mockResolvedValue({
        data: convs,
        error: null,
      });

      const result = await service.getConversations(MOCK_USER_1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(MOCK_CONV_ID);
    });

    it('returns empty array when no conversations exist', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('conversations').order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getConversations(MOCK_USER_1);

      expect(result).toEqual([]);
    });

    it('throws INTERNAL when query fails', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('conversations').order.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      try {
        await service.getConversations(MOCK_USER_1);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
        expect((e as ServiceError).message).toContain('récupération des conversations');
      }
    });
  });

  // -----------------------------------------
  // getMessages
  // -----------------------------------------
  describe('getMessages', () => {
    it('returns messages in chronological order', async () => {
      const { mockSupabase, service } = setup();
      const msgs = [
        mockMessage({ id: 'msg-2', created_at: '2026-01-15T11:00:00Z' }),
        mockMessage({ id: 'msg-1', created_at: '2026-01-15T10:00:00Z' }),
      ];

      // Chain: .from('messages').select('*').eq(...).order(...).limit(...) -> resolves
      mockSupabase._getChain('messages').limit.mockResolvedValue({
        data: msgs,
        error: null,
      });

      const result = await service.getMessages(MOCK_CONV_ID);

      // Should be reversed to chronological order
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('msg-1');
      expect(result[1].id).toBe('msg-2');
    });

    it('returns empty array when no messages', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('messages').limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getMessages(MOCK_CONV_ID);

      expect(result).toEqual([]);
    });

    it('applies before filter when provided', async () => {
      const { mockSupabase, service } = setup();
      const msgs = [mockMessage()];
      const beforeDate = '2026-01-15T12:00:00Z';

      // When `before` is passed, the chain adds .lt() before being awaited
      // Chain: .select().eq().order().limit() -> returns chain, then .lt() -> resolves
      mockSupabase._getChain('messages').lt.mockResolvedValue({
        data: msgs,
        error: null,
      });

      const result = await service.getMessages(MOCK_CONV_ID, 50, beforeDate);

      expect(result).toHaveLength(1);
      expect(mockSupabase._getChain('messages').lt).toHaveBeenCalledWith('created_at', beforeDate);
    });

    it('throws INTERNAL when query fails', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('messages').limit.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      try {
        await service.getMessages(MOCK_CONV_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
        expect((e as ServiceError).message).toContain('récupération des messages');
      }
    });

    it('respects custom limit parameter', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('messages').limit.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.getMessages(MOCK_CONV_ID, 10);

      expect(mockSupabase._getChain('messages').limit).toHaveBeenCalledWith(10);
    });
  });

  // -----------------------------------------
  // sendMessage
  // -----------------------------------------
  describe('sendMessage', () => {
    it('sends a text message successfully', async () => {
      const { mockSupabase, service } = setup();
      const conv = mockConversation();
      const msg = mockMessage();

      // Verify participant: .from('conversations').select(...).eq(...).contains(...).single()
      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });

      // Insert message: .from('messages').insert(...).select().single()
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: msg,
        error: null,
      });

      const result = await service.sendMessage(
        MOCK_USER_1,
        MOCK_CONV_ID,
        'Bonjour, est-ce que le colis est prêt ?'
      );

      expect(result.id).toBe(MOCK_MESSAGE_ID);
      expect(result.content).toBe('Bonjour, est-ce que le colis est prêt ?');
      expect(mockSupabase._getChain('messages').insert).toHaveBeenCalledWith({
        conversation_id: MOCK_CONV_ID,
        sender_id: MOCK_USER_1,
        content: 'Bonjour, est-ce que le colis est prêt ?',
        content_type: 'text',
        media_url: null,
        is_read: false,
      });
    });

    it('sends an image message with media_url', async () => {
      const { mockSupabase, service } = setup();
      const conv = mockConversation();
      const msg = mockMessage({
        content_type: 'image',
        media_url: 'https://storage.example.com/image.jpg',
      });

      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: msg,
        error: null,
      });

      const result = await service.sendMessage(
        MOCK_USER_1,
        MOCK_CONV_ID,
        'Photo du colis',
        'image',
        'https://storage.example.com/image.jpg'
      );

      expect(result.content_type).toBe('image');
      expect(mockSupabase._getChain('messages').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          content_type: 'image',
          media_url: 'https://storage.example.com/image.jpg',
        })
      );
    });

    it('updates conversation last_message after sending', async () => {
      const { mockSupabase, service } = setup();
      const conv = mockConversation();
      const msg = mockMessage();

      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: msg,
        error: null,
      });

      await service.sendMessage(MOCK_USER_1, MOCK_CONV_ID, 'Bonjour');

      expect(mockSupabase._getChain('conversations').update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_message: 'Bonjour',
        })
      );
    });

    it('notifies other participants', async () => {
      const { mockSupabase, service } = setup();
      const { createNotification } = await import('../notifications');
      const conv = mockConversation();
      const msg = mockMessage();

      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: msg,
        error: null,
      });

      await service.sendMessage(MOCK_USER_1, MOCK_CONV_ID, 'Bonjour');

      expect(createNotification).toHaveBeenCalledWith(
        MOCK_USER_2,
        'new_message',
        'Nouveau message',
        'Bonjour',
        { conversation_id: MOCK_CONV_ID }
      );
    });

    it('sends image notification text for image messages', async () => {
      const { mockSupabase, service } = setup();
      const { createNotification } = await import('../notifications');
      const conv = mockConversation();
      const msg = mockMessage({ content_type: 'image' });

      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: msg,
        error: null,
      });

      await service.sendMessage(MOCK_USER_1, MOCK_CONV_ID, 'photo', 'image');

      expect(createNotification).toHaveBeenCalledWith(
        MOCK_USER_2,
        'new_message',
        'Nouveau message',
        'Vous avez reçu une image.',
        { conversation_id: MOCK_CONV_ID }
      );
    });

    it('truncates long messages in notification preview', async () => {
      const { mockSupabase, service } = setup();
      const { createNotification } = await import('../notifications');
      const conv = mockConversation();
      const longContent = 'A'.repeat(100);
      const msg = mockMessage({ content: longContent });

      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: msg,
        error: null,
      });

      await service.sendMessage(MOCK_USER_1, MOCK_CONV_ID, longContent);

      expect(createNotification).toHaveBeenCalledWith(
        MOCK_USER_2,
        'new_message',
        'Nouveau message',
        'A'.repeat(80) + '...',
        { conversation_id: MOCK_CONV_ID }
      );
    });

    it('throws NOT_FOUND when user is not a participant', async () => {
      const { mockSupabase, service } = setup();

      // .single() returns null when user is not a participant
      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: null,
        error: null,
      });

      try {
        await service.sendMessage(MOCK_USER_1, MOCK_CONV_ID, 'Hello');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('introuvable');
      }
    });

    it('throws VALIDATION when message insert fails', async () => {
      const { mockSupabase, service } = setup();
      const conv = mockConversation();

      mockSupabase._getChain('conversations').single.mockResolvedValue({
        data: conv,
        error: null,
      });
      mockSupabase._getChain('messages').single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      try {
        await service.sendMessage(MOCK_USER_1, MOCK_CONV_ID, 'Hello');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toBe('Insert failed');
      }
    });
  });

  // -----------------------------------------
  // markMessagesAsRead
  // -----------------------------------------
  describe('markMessagesAsRead', () => {
    it('marks unread messages from other users as read', async () => {
      const { mockSupabase, service } = setup();

      // Chain: .from('messages').update({is_read: true}).eq().neq().eq() -> resolves
      // The last call in chain is .eq('is_read', false)
      // Since all chained methods return the chain by default, this will resolve as undefined
      mockSupabase._getChain('messages').eq.mockReturnValue(mockSupabase._getChain('messages'));

      await service.markMessagesAsRead(MOCK_CONV_ID, MOCK_USER_1);

      expect(mockSupabase._getChain('messages').update).toHaveBeenCalledWith({ is_read: true });
      expect(mockSupabase._getChain('messages').neq).toHaveBeenCalledWith('sender_id', MOCK_USER_1);
    });

    it('does not throw on successful call', async () => {
      const { service } = setup();

      // Should complete without throwing
      await expect(service.markMessagesAsRead(MOCK_CONV_ID, MOCK_USER_1)).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------
  // getUnreadCount
  // -----------------------------------------
  describe('getUnreadCount', () => {
    it('returns unread count for a user', async () => {
      const { mockSupabase, service } = setup();

      // First query: get user's conversations
      // Chain: .from('conversations').select('id').contains(...) -> resolves
      mockSupabase._getChain('conversations').contains.mockResolvedValue({
        data: [{ id: MOCK_CONV_ID }, { id: 'conv-2' }],
        error: null,
      });

      // Second query: count unread messages
      // Chain: .from('messages').select('*', {...}).in(...).neq(...).eq(...) -> resolves
      // The last method is .eq('is_read', false)
      mockSupabase._getChain('messages').eq.mockResolvedValue({
        count: 5,
        data: null,
        error: null,
      });

      const result = await service.getUnreadCount(MOCK_USER_1);

      expect(result).toBe(5);
      expect(mockSupabase._getChain('messages').in).toHaveBeenCalledWith('conversation_id', [
        MOCK_CONV_ID,
        'conv-2',
      ]);
    });

    it('returns 0 when user has no conversations', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('conversations').contains.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getUnreadCount(MOCK_USER_1);

      expect(result).toBe(0);
    });

    it('returns 0 when conversations data is null', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('conversations').contains.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getUnreadCount(MOCK_USER_1);

      expect(result).toBe(0);
    });

    it('returns 0 when count is null', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('conversations').contains.mockResolvedValue({
        data: [{ id: MOCK_CONV_ID }],
        error: null,
      });

      mockSupabase._getChain('messages').eq.mockResolvedValue({
        count: null,
        data: null,
        error: null,
      });

      const result = await service.getUnreadCount(MOCK_USER_1);

      expect(result).toBe(0);
    });
  });
});
