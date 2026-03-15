import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createNotificationsService } from '@/lib/services/notifications';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../push', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}));

// ============================================
// Test Data Factories
// ============================================

const MOCK_USER_ID = 'user-123';
const MOCK_NOTIFICATION_ID_1 = 'notif-001';
const MOCK_NOTIFICATION_ID_2 = 'notif-002';

function mockNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_NOTIFICATION_ID_1,
    user_id: MOCK_USER_ID,
    type: 'new_request',
    title: 'Nouvelle demande',
    body: 'Vous avez reçu une nouvelle demande',
    data: {},
    is_read: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup() {
  const mockSupabase = createMockSupabase();
  const service = createNotificationsService(asSupabase(mockSupabase));
  return { mockSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Notifications Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // getNotifications
  // -----------------------------------------
  describe('getNotifications', () => {
    it('returns paginated notifications (happy path)', async () => {
      const { mockSupabase, service } = setup();
      const notifications = [mockNotification(), mockNotification({ id: MOCK_NOTIFICATION_ID_2 })];

      // Chain: .from('notifications').select('*', { count: 'exact' }).eq('user_id', userId).order(...).range(...)
      // range is the last call and it resolves
      mockSupabase._getChain('notifications').range.mockResolvedValueOnce({
        data: notifications,
        error: null,
        count: 2,
      });

      const result = await service.getNotifications(MOCK_USER_ID, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(10);
      expect(result.total_pages).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('returns empty list when no notifications', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('notifications').range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.getNotifications(MOCK_USER_ID);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.total_pages).toBe(0);
    });

    it('calculates pagination correctly for page 2', async () => {
      const { mockSupabase, service } = setup();
      const notifications = [mockNotification()];

      mockSupabase._getChain('notifications').range.mockResolvedValueOnce({
        data: notifications,
        error: null,
        count: 15,
      });

      const result = await service.getNotifications(MOCK_USER_ID, 2, 10);

      expect(result.page).toBe(2);
      expect(result.total).toBe(15);
      expect(result.total_pages).toBe(2);
    });

    it('throws ServiceError on database error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('notifications').range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      try {
        await service.getNotifications(MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
        expect((e as ServiceError).message).toContain('récupération des notifications');
      }
    });
  });

  // -----------------------------------------
  // markNotificationsAsRead
  // -----------------------------------------
  describe('markNotificationsAsRead', () => {
    it('marks notifications as read successfully', async () => {
      const { mockSupabase, service } = setup();
      const ids = [MOCK_NOTIFICATION_ID_1, MOCK_NOTIFICATION_ID_2];

      // Chain: .from('notifications').update({ is_read: true }).eq('user_id', userId).in('id', notificationIds)
      // .in() is last in the chain
      mockSupabase._getChain('notifications').in.mockResolvedValueOnce({
        error: null,
      });

      await service.markNotificationsAsRead(MOCK_USER_ID, ids);

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('throws ServiceError on database error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('notifications').in.mockResolvedValueOnce({
        error: { message: 'Update failed' },
      });

      try {
        await service.markNotificationsAsRead(MOCK_USER_ID, [MOCK_NOTIFICATION_ID_1]);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('mise à jour des notifications');
      }
    });
  });

  // -----------------------------------------
  // createNotification
  // -----------------------------------------
  describe('createNotification', () => {
    it('creates a notification and fires push (happy path)', async () => {
      const { mockSupabase, service } = setup();
      const notification = mockNotification();

      // Chain: .from('notifications').insert(...).select().single()
      mockSupabase._getChain('notifications').single.mockResolvedValueOnce({
        data: notification,
        error: null,
      });

      const result = await service.createNotification(
        MOCK_USER_ID,
        'new_request' as never,
        'Nouvelle demande',
        'Vous avez reçu une nouvelle demande',
        { url: '/demandes/123' }
      );

      expect(result.id).toBe(MOCK_NOTIFICATION_ID_1);
      expect(result.type).toBe('new_request');
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');

      // Verify push was called
      const { sendPushToUser } = await import('../push');
      expect(sendPushToUser).toHaveBeenCalledWith(MOCK_USER_ID, {
        title: 'Nouvelle demande',
        body: 'Vous avez reçu une nouvelle demande',
        url: '/demandes/123',
        tag: 'new_request',
      });
    });

    it('uses default url when data.url is not a string', async () => {
      const { mockSupabase, service } = setup();
      const notification = mockNotification();

      mockSupabase._getChain('notifications').single.mockResolvedValueOnce({
        data: notification,
        error: null,
      });

      await service.createNotification(
        MOCK_USER_ID,
        'new_request' as never,
        'Nouvelle demande',
        'Body text',
        { someOtherField: 42 }
      );

      const { sendPushToUser } = await import('../push');
      expect(sendPushToUser).toHaveBeenCalledWith(MOCK_USER_ID, {
        title: 'Nouvelle demande',
        body: 'Body text',
        url: '/',
        tag: 'new_request',
      });
    });

    it('uses empty data by default', async () => {
      const { mockSupabase, service } = setup();
      const notification = mockNotification();

      mockSupabase._getChain('notifications').single.mockResolvedValueOnce({
        data: notification,
        error: null,
      });

      await service.createNotification(MOCK_USER_ID, 'new_request' as never, 'Titre', 'Corps');

      const { sendPushToUser } = await import('../push');
      expect(sendPushToUser).toHaveBeenCalledWith(MOCK_USER_ID, {
        title: 'Titre',
        body: 'Corps',
        url: '/',
        tag: 'new_request',
      });
    });

    it('throws ServiceError on database error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('notifications').single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      try {
        await service.createNotification(MOCK_USER_ID, 'new_request' as never, 'Titre', 'Corps');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('création de la notification');
      }
    });
  });

  // -----------------------------------------
  // getUnreadNotificationCount
  // -----------------------------------------
  describe('getUnreadNotificationCount', () => {
    it('returns unread count (happy path)', async () => {
      const { mockSupabase, service } = setup();

      // Chain: .from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)
      // Second .eq() is last in the chain
      const chain = mockSupabase._getChain('notifications');
      chain.eq
        .mockReturnValueOnce(chain) // first .eq('user_id', userId)
        .mockResolvedValueOnce({ count: 5, error: null }); // second .eq('is_read', false)

      const result = await service.getUnreadNotificationCount(MOCK_USER_ID);

      expect(result).toBe(5);
    });

    it('returns 0 when no unread notifications', async () => {
      const { mockSupabase, service } = setup();

      const chain = mockSupabase._getChain('notifications');
      chain.eq.mockReturnValueOnce(chain).mockResolvedValueOnce({ count: 0, error: null });

      const result = await service.getUnreadNotificationCount(MOCK_USER_ID);

      expect(result).toBe(0);
    });

    it('returns 0 when count is null', async () => {
      const { mockSupabase, service } = setup();

      const chain = mockSupabase._getChain('notifications');
      chain.eq.mockReturnValueOnce(chain).mockResolvedValueOnce({ count: null, error: null });

      const result = await service.getUnreadNotificationCount(MOCK_USER_ID);

      expect(result).toBe(0);
    });

    it('returns 0 on database error', async () => {
      const { mockSupabase, service } = setup();

      const chain = mockSupabase._getChain('notifications');
      chain.eq
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ count: null, error: { message: 'DB error' } });

      const result = await service.getUnreadNotificationCount(MOCK_USER_ID);

      expect(result).toBe(0);
    });
  });
});
