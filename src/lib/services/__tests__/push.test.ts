import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { ServiceError } from '@/lib/services/errors';

// Set VAPID keys BEFORE push module loads so sendPushToUser doesn't early-return
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key';
  process.env.VAPID_PRIVATE_KEY = 'test-private-key';
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));

// Import AFTER env and mocks are configured
import { createPushService } from '@/lib/services/push';

// ============================================
// Test Data Factories
// ============================================

const MOCK_USER_ID = 'user-push-123';
const MOCK_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';
const MOCK_ENDPOINT_2 = 'https://fcm.googleapis.com/fcm/send/def456';

function mockSubscription(overrides: Partial<PushSubscriptionJSON> = {}): PushSubscriptionJSON {
  return {
    endpoint: MOCK_ENDPOINT,
    keys: {
      p256dh:
        'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlSn_g-LYvfXNvFR_0UVBLCiJxq7y7XnzJDVZSw',
      auth: 'tBHItJI5svbpC7htgNy8hw',
    },
    ...overrides,
  };
}

function mockPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Notification Test',
    body: 'Ceci est un test',
    url: '/test',
    tag: 'test_tag',
    ...overrides,
  };
}

function setup() {
  const mockSupabase = createMockSupabase();
  const service = createPushService(asSupabase(mockSupabase));
  return { mockSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Push Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // saveSubscription
  // -----------------------------------------
  describe('saveSubscription', () => {
    it('saves a push subscription successfully', async () => {
      const { mockSupabase, service } = setup();
      const subscription = mockSubscription();

      // Chain: .from('push_subscriptions').upsert(..., { onConflict: 'endpoint' })
      // upsert is the last call (awaited directly)
      mockSupabase._getChain('push_subscriptions').upsert.mockResolvedValueOnce({
        error: null,
      });

      await service.saveSubscription(MOCK_USER_ID, subscription);

      expect(mockSupabase.from).toHaveBeenCalledWith('push_subscriptions');
      expect(mockSupabase._getChain('push_subscriptions').upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: MOCK_USER_ID,
          endpoint: MOCK_ENDPOINT,
          keys: subscription.keys,
        }),
        { onConflict: 'endpoint' }
      );
    });

    it('throws ServiceError on database error', async () => {
      const { mockSupabase, service } = setup();
      const subscription = mockSubscription();

      mockSupabase._getChain('push_subscriptions').upsert.mockResolvedValueOnce({
        error: { message: 'Duplicate key violation' },
      });

      try {
        await service.saveSubscription(MOCK_USER_ID, subscription);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('Duplicate key violation');
      }
    });
  });

  // -----------------------------------------
  // removeSubscription
  // -----------------------------------------
  describe('removeSubscription', () => {
    it('removes a subscription successfully', async () => {
      const { mockSupabase, service } = setup();

      // Chain: .from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
      // Second .eq() is the last call
      const chain = mockSupabase._getChain('push_subscriptions');
      chain.eq
        .mockReturnValueOnce(chain) // first .eq('user_id', userId)
        .mockResolvedValueOnce({ error: null }); // second .eq('endpoint', endpoint)

      await service.removeSubscription(MOCK_USER_ID, MOCK_ENDPOINT);

      expect(mockSupabase.from).toHaveBeenCalledWith('push_subscriptions');
    });

    it('does not throw even if delete has an error (fire-and-forget)', async () => {
      const { mockSupabase, service } = setup();

      const chain = mockSupabase._getChain('push_subscriptions');
      chain.eq
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ error: { message: 'Delete failed' } });

      // removeSubscription does not check for errors, so no throw
      await service.removeSubscription(MOCK_USER_ID, MOCK_ENDPOINT);
    });
  });

  // -----------------------------------------
  // sendPushToUser
  // -----------------------------------------
  describe('sendPushToUser', () => {
    it('sends push notifications to all user subscriptions', async () => {
      const { mockSupabase, service } = setup();
      const webpush = (await import('web-push')).default;
      const payload = mockPayload();
      const subscriptions = [
        { endpoint: MOCK_ENDPOINT, keys: { p256dh: 'key1', auth: 'auth1' } },
        { endpoint: MOCK_ENDPOINT_2, keys: { p256dh: 'key2', auth: 'auth2' } },
      ];

      // Chain: .from('push_subscriptions').select('endpoint, keys').eq('user_id', userId)
      // .eq() is the last call
      mockSupabase._getChain('push_subscriptions').eq.mockResolvedValueOnce({
        data: subscriptions,
        error: null,
      });

      (webpush.sendNotification as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await service.sendPushToUser(MOCK_USER_ID, payload);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: MOCK_ENDPOINT, keys: { p256dh: 'key1', auth: 'auth1' } },
        JSON.stringify(payload)
      );
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: MOCK_ENDPOINT_2, keys: { p256dh: 'key2', auth: 'auth2' } },
        JSON.stringify(payload)
      );
    });

    it('does nothing when no subscriptions exist', async () => {
      const { mockSupabase, service } = setup();
      const webpush = (await import('web-push')).default;
      const payload = mockPayload();

      mockSupabase._getChain('push_subscriptions').eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await service.sendPushToUser(MOCK_USER_ID, payload);

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('does nothing when data is null', async () => {
      const { mockSupabase, service } = setup();
      const webpush = (await import('web-push')).default;
      const payload = mockPayload();

      mockSupabase._getChain('push_subscriptions').eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await service.sendPushToUser(MOCK_USER_ID, payload);

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('removes expired subscription on 410 error', async () => {
      const { mockSupabase, service } = setup();
      const webpush = (await import('web-push')).default;
      const payload = mockPayload();
      const subscriptions = [{ endpoint: MOCK_ENDPOINT, keys: { p256dh: 'key1', auth: 'auth1' } }];

      mockSupabase._getChain('push_subscriptions').eq.mockResolvedValueOnce({
        data: subscriptions,
        error: null,
      });

      // Simulate 410 Gone error
      (webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        statusCode: 410,
      });

      // The cleanup delete chain: .from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      // After first eq resolves for the select query, subsequent calls are for cleanup
      // Reset eq mock for cleanup call
      const chain = mockSupabase._getChain('push_subscriptions');
      chain.eq.mockResolvedValueOnce({ error: null });

      await service.sendPushToUser(MOCK_USER_ID, payload);

      // Verify delete was called for cleanup
      expect(mockSupabase._getChain('push_subscriptions').delete).toHaveBeenCalled();
    });

    it('does not remove subscription for non-410 errors', async () => {
      const { mockSupabase, service } = setup();
      const webpush = (await import('web-push')).default;
      const payload = mockPayload();
      const subscriptions = [{ endpoint: MOCK_ENDPOINT, keys: { p256dh: 'key1', auth: 'auth1' } }];

      mockSupabase._getChain('push_subscriptions').eq.mockResolvedValueOnce({
        data: subscriptions,
        error: null,
      });

      // Simulate a 500 error (not 410)
      (webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        statusCode: 500,
      });

      await service.sendPushToUser(MOCK_USER_ID, payload);

      // delete should not be called for non-410 errors
      expect(mockSupabase._getChain('push_subscriptions').delete).not.toHaveBeenCalled();
    });
  });
});
