import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createRequestService } from '@/lib/services/requests';
import { calculateTransactionFees } from '@/lib/utils';
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

const MOCK_SENDER_ID = 'user-sender-123';
const MOCK_TRAVELER_ID = 'user-traveler-456';
const MOCK_REQUEST_ID = 'req-abc-789';
const MOCK_LISTING_ID = 'listing-001';
const MOCK_CONFIRMATION_CODE = '123456';

function mockListing(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_LISTING_ID,
    traveler_id: MOCK_TRAVELER_ID,
    status: 'active',
    available_kg: 20,
    price_per_kg: 10,
    departure_city: 'Paris',
    arrival_city: 'Douala',
    currency: 'EUR',
    ...overrides,
  };
}

function mockShipmentRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_REQUEST_ID,
    sender_id: MOCK_SENDER_ID,
    listing_id: MOCK_LISTING_ID,
    weight_kg: 5,
    item_description: 'Vêtements pour la famille',
    item_photos: [],
    special_instructions: null,
    status: 'pending',
    total_price: 50,
    listing: {
      id: MOCK_LISTING_ID,
      traveler_id: MOCK_TRAVELER_ID,
      available_kg: 20,
      departure_city: 'Paris',
      arrival_city: 'Douala',
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup(deps = {}) {
  const mockSupabase = createMockSupabase();
  const mockAdminSupabase = createMockSupabase();
  const mockCapturePayment = vi.fn().mockResolvedValue(undefined);
  const mockRefundPayment = vi.fn().mockResolvedValue(undefined);
  const service = createRequestService(asSupabase(mockSupabase), asSupabase(mockAdminSupabase), {
    capturePayment: mockCapturePayment,
    refundPayment: mockRefundPayment,
    ...deps,
  });
  return { mockSupabase, mockAdminSupabase, mockCapturePayment, mockRefundPayment, service };
}

// ============================================
// Tests
// ============================================

describe('Request Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // createRequest
  // -----------------------------------------
  describe('createRequest', () => {
    const validInput = {
      listing_id: MOCK_LISTING_ID,
      weight_kg: 5,
      item_description: 'Vêtements',
      item_photos: [],
      special_instructions: null,
    };

    it('creates request successfully (happy path)', async () => {
      const { mockSupabase, service } = setup();
      const listing = mockListing();
      const newRequest = mockShipmentRequest();

      mockSupabase._getChain('listings').single.mockResolvedValue({
        data: listing,
        error: null,
      });
      // Active requests weight check
      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: newRequest,
        error: null,
      });
      // Use in() for active requests list — return empty (no reserved kg)
      mockSupabase._getChain('shipment_requests').in.mockReturnValue({
        ...mockSupabase._getChain('shipment_requests'),
        // Simulate the final resolution returning no active requests
      });
      // Mock the in query returning []
      mockSupabase.from.mockImplementation((table: string) => {
        const chain = mockSupabase._getChain(table);
        if (table === 'listings') {
          chain.single.mockResolvedValueOnce({ data: listing, error: null });
        } else if (table === 'shipment_requests') {
          // First call: weight check (returns empty array via range/then)
          // Second call: insert new request
          chain.single.mockResolvedValueOnce({ data: newRequest, error: null });
        }
        return chain;
      });

      // Simple mock: listings returns listing, shipment_requests insert returns new request
      // Reset and use a simpler approach
      const mockSupabase2 = createMockSupabase();
      const mockAdminSupabase2 = createMockSupabase();

      // listings.select().eq().eq().single()
      mockSupabase2._getChain('listings').single.mockResolvedValue({
        data: listing,
        error: null,
      });

      // shipment_requests weight check: we need the chain to resolve to [] for active requests
      // The query is: .from('shipment_requests').select('weight_kg').eq().in() -> resolves
      // Since our mock returns the chain for chained calls, we need .in() to resolve to []
      // But our mock's .in() returns the chain (for further chaining)
      // The actual resolution happens when awaited — we need to make the final awaitable return []
      // Looking at the code: await supabase.from(...).select(...).eq(...).in(...)
      // In our mock, .in() returns the chain, and when awaited the chain itself resolves
      // We need chain to be thenable — but it's not by default
      // We'll mock the in() to return a promise-like

      // Override: make the shipment_requests.in() return an object that resolves to { data: [], error: null }
      const requestsChain = mockSupabase2._getChain('shipment_requests');
      requestsChain.in.mockResolvedValue({ data: [], error: null });
      requestsChain.single.mockResolvedValue({ data: newRequest, error: null });

      const service2 = createRequestService(
        asSupabase(mockSupabase2),
        asSupabase(mockAdminSupabase2),
        {}
      );

      const result = await service2.createRequest(MOCK_SENDER_ID, validInput);

      expect(result.id).toBe(MOCK_REQUEST_ID);
      expect(result.status).toBe('pending');
    });

    it('throws NOT_FOUND when listing is not found', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('listings').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.createRequest(MOCK_SENDER_ID, validInput);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('introuvable');
      }
    });

    it('throws CONFLICT when sender tries to book their own listing', async () => {
      const { mockSupabase, service } = setup();
      const listing = mockListing({ traveler_id: MOCK_SENDER_ID });

      mockSupabase._getChain('listings').single.mockResolvedValue({
        data: listing,
        error: null,
      });

      try {
        await service.createRequest(MOCK_SENDER_ID, validInput);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('CONFLICT');
        expect((e as ServiceError).message).toContain('propre annonce');
      }
    });

    it('throws VALIDATION when requested weight exceeds available', async () => {
      const { mockSupabase, service } = setup();
      const listing = mockListing({ available_kg: 3 }); // only 3kg available

      mockSupabase._getChain('listings').single.mockResolvedValue({
        data: listing,
        error: null,
      });

      // No reserved kg
      const requestsChain = mockSupabase._getChain('shipment_requests');
      requestsChain.in.mockResolvedValue({ data: [], error: null });

      try {
        await service.createRequest(MOCK_SENDER_ID, { ...validInput, weight_kg: 5 }); // 5 > 3
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('disponibles');
      }
    });

    it('throws VALIDATION when all kg are already reserved', async () => {
      const { mockSupabase, service } = setup();
      const listing = mockListing({ available_kg: 5 });

      mockSupabase._getChain('listings').single.mockResolvedValue({
        data: listing,
        error: null,
      });

      // All 5kg reserved by others
      const requestsChain = mockSupabase._getChain('shipment_requests');
      requestsChain.in.mockResolvedValue({
        data: [{ weight_kg: 5 }],
        error: null,
      });

      try {
        await service.createRequest(MOCK_SENDER_ID, validInput);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('réservés');
      }
    });
  });

  // -----------------------------------------
  // confirmDelivery
  // -----------------------------------------
  describe('confirmDelivery', () => {
    it('confirms delivery with correct code', async () => {
      const { mockSupabase, mockCapturePayment, service } = setup();
      const request = mockShipmentRequest({ status: 'delivered' });
      const confirmedRequest = { ...request, status: 'confirmed' };

      mockSupabase
        ._getChain('shipment_requests')
        .single.mockResolvedValueOnce({ data: request, error: null })
        .mockResolvedValueOnce({ data: confirmedRequest, error: null });

      mockSupabase._getChain('confirmation_codes').single.mockResolvedValue({
        data: { code: MOCK_CONFIRMATION_CODE },
        error: null,
      });

      const result = await service.confirmDelivery(
        MOCK_REQUEST_ID,
        MOCK_SENDER_ID,
        MOCK_CONFIRMATION_CODE
      );

      expect(result.status).toBe('confirmed');
      expect(mockCapturePayment).toHaveBeenCalledWith(MOCK_REQUEST_ID);
    });

    it('throws VALIDATION with wrong confirmation code', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'delivered' });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      mockSupabase._getChain('confirmation_codes').single.mockResolvedValue({
        data: { code: MOCK_CONFIRMATION_CODE },
        error: null,
      });

      try {
        await service.confirmDelivery(MOCK_REQUEST_ID, MOCK_SENDER_ID, '000000');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('incorrect');
      }
    });

    it('throws AUTH when non-sender tries to confirm delivery', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'delivered', sender_id: 'other-user' });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      try {
        await service.confirmDelivery(MOCK_REQUEST_ID, MOCK_SENDER_ID, MOCK_CONFIRMATION_CODE);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('AUTH');
        expect((e as ServiceError).message).toContain('expéditeur');
      }
    });

    it('throws NOT_FOUND when request not in delivered status', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.confirmDelivery(MOCK_REQUEST_ID, MOCK_SENDER_ID, MOCK_CONFIRMATION_CODE);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
      }
    });

    it('still returns success even if capturePayment fails', async () => {
      const { mockSupabase, service } = setup({
        capturePayment: vi.fn().mockRejectedValue(new Error('Stripe unavailable')),
      });
      const request = mockShipmentRequest({ status: 'delivered' });
      const confirmedRequest = { ...request, status: 'confirmed' };

      mockSupabase
        ._getChain('shipment_requests')
        .single.mockResolvedValueOnce({ data: request, error: null })
        .mockResolvedValueOnce({ data: confirmedRequest, error: null });

      mockSupabase._getChain('confirmation_codes').single.mockResolvedValue({
        data: { code: MOCK_CONFIRMATION_CODE },
        error: null,
      });

      // Should not throw — capturePayment failure is logged but not propagated
      const result = await service.confirmDelivery(
        MOCK_REQUEST_ID,
        MOCK_SENDER_ID,
        MOCK_CONFIRMATION_CODE
      );

      expect(result.status).toBe('confirmed');
    });
  });

  // -----------------------------------------
  // cancelRequest
  // -----------------------------------------
  describe('cancelRequest', () => {
    it('cancels a pending request successfully', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'pending' });
      const cancelledRequest = { ...request, status: 'cancelled' };

      mockSupabase
        ._getChain('shipment_requests')
        .single.mockResolvedValueOnce({ data: request, error: null })
        .mockResolvedValueOnce({ data: cancelledRequest, error: null });

      const result = await service.cancelRequest(MOCK_REQUEST_ID, MOCK_SENDER_ID);

      expect(result.status).toBe('cancelled');
    });

    it('throws CONFLICT when request is in confirmed status', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'confirmed' });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      try {
        await service.cancelRequest(MOCK_REQUEST_ID, MOCK_SENDER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('CONFLICT');
        expect((e as ServiceError).message).toContain('annuler');
      }
    });

    it('throws CONFLICT when request is in paid status', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'paid' });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      try {
        await service.cancelRequest(MOCK_REQUEST_ID, MOCK_SENDER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('CONFLICT');
      }
    });

    it('throws AUTH when unrelated user tries to cancel', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({
        status: 'pending',
        sender_id: 'other-sender',
      });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      try {
        await service.cancelRequest(MOCK_REQUEST_ID, MOCK_SENDER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('AUTH');
      }
    });

    it('throws NOT_FOUND when request does not exist', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.cancelRequest(MOCK_REQUEST_ID, MOCK_SENDER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
      }
    });
  });

  // -----------------------------------------
  // State transitions
  // -----------------------------------------
  describe('acceptRequest', () => {
    it('accepts a pending request (traveler perspective)', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'pending' });
      const acceptedRequest = { ...request, status: 'accepted' };

      mockSupabase
        ._getChain('shipment_requests')
        .single.mockResolvedValueOnce({ data: request, error: null })
        .mockResolvedValueOnce({ data: acceptedRequest, error: null });

      const result = await service.acceptRequest(MOCK_REQUEST_ID, MOCK_TRAVELER_ID);

      expect(result.status).toBe('accepted');
    });

    it('throws NOT_FOUND when request is not in pending status', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.acceptRequest(MOCK_REQUEST_ID, MOCK_TRAVELER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
      }
    });

    it('throws AUTH when non-traveler tries to accept', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'pending' });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      try {
        await service.acceptRequest(MOCK_REQUEST_ID, MOCK_SENDER_ID); // sender != traveler
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('AUTH');
      }
    });
  });

  describe('markDelivered', () => {
    it('marks an in_transit request as delivered', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'in_transit' });
      const deliveredRequest = { ...request, status: 'delivered' };

      mockSupabase
        ._getChain('shipment_requests')
        .single.mockResolvedValueOnce({ data: request, error: null })
        .mockResolvedValueOnce({ data: deliveredRequest, error: null });

      const result = await service.markDelivered(MOCK_REQUEST_ID, MOCK_TRAVELER_ID);

      expect(result.status).toBe('delivered');
    });

    it('throws VALIDATION when request is not in_transit', async () => {
      const { mockSupabase, service } = setup();
      const request = mockShipmentRequest({ status: 'pending' }); // invalid transition

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: request,
        error: null,
      });

      try {
        await service.markDelivered(MOCK_REQUEST_ID, MOCK_TRAVELER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
        expect((e as ServiceError).message).toContain('Impossible');
      }
    });
  });
});

// ============================================
// Pure utility function tests
// ============================================
describe('calculateTransactionFees', () => {
  it('calculates 10% fee on 100', () => {
    const { platformFee, payoutAmount } = calculateTransactionFees(100);
    expect(platformFee).toBe(10);
    expect(payoutAmount).toBe(90);
  });

  it('calculates 10% fee on 50', () => {
    const { platformFee, payoutAmount } = calculateTransactionFees(50);
    expect(platformFee).toBe(5);
    expect(payoutAmount).toBe(45);
  });

  it('rounds correctly for 33.33', () => {
    const { platformFee } = calculateTransactionFees(33.33);
    expect(platformFee).toBe(3.33);
  });

  it('handles 0', () => {
    const { platformFee, payoutAmount } = calculateTransactionFees(0);
    expect(platformFee).toBe(0);
    expect(payoutAmount).toBe(0);
  });
});
