import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createReviewsService } from '@/lib/services/reviews';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/services/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// ============================================
// Test Data Factories
// ============================================

const MOCK_REVIEWER_ID = 'user-reviewer-123';
const MOCK_REVIEWED_ID = 'user-reviewed-456';
const MOCK_TRAVELER_ID = 'user-traveler-789';
const MOCK_REQUEST_ID = 'req-abc-001';

function mockReviewInput(overrides: Record<string, unknown> = {}) {
  return {
    request_id: MOCK_REQUEST_ID,
    reviewed_id: MOCK_REVIEWED_ID,
    rating: 5,
    comment: 'Excellent service!',
    ...overrides,
  };
}

function mockReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'review-001',
    reviewer_id: MOCK_REVIEWER_ID,
    reviewed_id: MOCK_REVIEWED_ID,
    request_id: MOCK_REQUEST_ID,
    rating: 5,
    comment: 'Excellent service!',
    reviewer: { id: MOCK_REVIEWER_ID, first_name: 'Jean', last_name: 'Dupont' },
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup() {
  const mockSupabase = createMockSupabase();
  const service = createReviewsService(asSupabase(mockSupabase));
  return { mockSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Reviews Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // createReview
  // -----------------------------------------
  describe('createReview', () => {
    it('creates review successfully (happy path)', async () => {
      const { mockSupabase, service } = setup();
      const input = mockReviewInput();
      const review = mockReview();

      const requestsChain = mockSupabase._getChain('shipment_requests');
      const reviewsChain = mockSupabase._getChain('reviews');
      const profilesChain = mockSupabase._getChain('profiles');

      // 1. shipment_requests: select().eq().eq().single() -> confirmed request
      requestsChain.single.mockResolvedValueOnce({
        data: {
          id: MOCK_REQUEST_ID,
          sender_id: MOCK_REVIEWER_ID,
          status: 'confirmed',
          listing: { traveler_id: MOCK_TRAVELER_ID },
        },
        error: null,
      });

      // 2. reviews: select('id').eq('reviewer_id').eq('request_id').single()
      //    Chain has 2 eq calls before single — first eq must return chain
      reviewsChain.eq
        .mockReturnValueOnce(reviewsChain) // eq('reviewer_id')
        .mockReturnValueOnce(reviewsChain); // eq('request_id') — single() resolves next
      reviewsChain.single
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
        // 4. reviews: insert().select().single() -> created review
        .mockResolvedValueOnce({ data: review, error: null });

      // 5. updateUserRating: reviews.select('rating').eq('reviewed_id', userId)
      //    Chain ends with .eq() which is awaited
      reviewsChain.eq.mockResolvedValueOnce({
        data: [{ rating: 5 }],
        error: null,
      });

      // 6. profiles: update().eq() -> void (chain ends with .eq())
      profilesChain.eq.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.createReview(MOCK_REVIEWER_ID, input);

      expect(result).toEqual(review);
    });

    it('throws VALIDATION when delivery is not confirmed', async () => {
      const { mockSupabase, service } = setup();
      const input = mockReviewInput();

      // shipment_requests query returns no confirmed request
      mockSupabase._getChain('shipment_requests').single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.createReview(MOCK_REVIEWER_ID, input);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('confirmée');
      }
    });

    it('throws AUTH when reviewer is not a participant', async () => {
      const { mockSupabase, service } = setup();
      const input = mockReviewInput();

      // Request exists but reviewer is neither sender nor traveler
      mockSupabase._getChain('shipment_requests').single.mockResolvedValueOnce({
        data: {
          id: MOCK_REQUEST_ID,
          sender_id: 'other-sender',
          status: 'confirmed',
          listing: { traveler_id: MOCK_TRAVELER_ID },
        },
        error: null,
      });

      try {
        await service.createReview(MOCK_REVIEWER_ID, input);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('AUTH');
        expect((e as ServiceError).message).toContain('Non autorisé');
      }
    });

    it('throws CONFLICT when review already exists', async () => {
      const { mockSupabase, service } = setup();
      const input = mockReviewInput();

      // Request is confirmed and reviewer is participant
      mockSupabase._getChain('shipment_requests').single.mockResolvedValueOnce({
        data: {
          id: MOCK_REQUEST_ID,
          sender_id: MOCK_REVIEWER_ID,
          status: 'confirmed',
          listing: { traveler_id: MOCK_TRAVELER_ID },
        },
        error: null,
      });

      // Existing review found
      mockSupabase._getChain('reviews').single.mockResolvedValueOnce({
        data: { id: 'existing-review' },
        error: null,
      });

      try {
        await service.createReview(MOCK_REVIEWER_ID, input);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('CONFLICT');
        expect((e as ServiceError).message).toContain('déjà laissé');
      }
    });

    it('throws VALIDATION when insert fails', async () => {
      const { mockSupabase, service } = setup();
      const input = mockReviewInput();

      const requestsChain = mockSupabase._getChain('shipment_requests');
      const reviewsChain = mockSupabase._getChain('reviews');

      // Request is confirmed and reviewer is participant
      requestsChain.single.mockResolvedValueOnce({
        data: {
          id: MOCK_REQUEST_ID,
          sender_id: MOCK_REVIEWER_ID,
          status: 'confirmed',
          listing: { traveler_id: MOCK_TRAVELER_ID },
        },
        error: null,
      });

      // No existing review
      reviewsChain.single
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
        // Insert fails
        .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

      try {
        await service.createReview(MOCK_REVIEWER_ID, input);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('Insert failed');
      }
    });
  });

  // -----------------------------------------
  // getReviewsByUser
  // -----------------------------------------
  describe('getReviewsByUser', () => {
    it('returns reviews for a user', async () => {
      const { mockSupabase, service } = setup();
      const reviews = [mockReview(), mockReview({ id: 'review-002', rating: 4 })];

      // Chain: select().eq().order() -> resolves (order is last)
      mockSupabase._getChain('reviews').order.mockResolvedValueOnce({
        data: reviews,
        error: null,
      });

      const result = await service.getReviewsByUser(MOCK_REVIEWED_ID);

      expect(result).toEqual(reviews);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no reviews', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('reviews').order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.getReviewsByUser(MOCK_REVIEWED_ID);

      expect(result).toEqual([]);
    });

    it('throws INTERNAL on error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('reviews').order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      try {
        await service.getReviewsByUser(MOCK_REVIEWED_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
      }
    });
  });
});
