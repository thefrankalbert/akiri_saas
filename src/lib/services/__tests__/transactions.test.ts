import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase, createMockStripe, asStripe } from './helpers';
import { createTransactionService, amountToCents } from '@/lib/services/transactions';
import { calculateTransactionFees, calculatePaginationOffset } from '@/lib/utils';
import { ServiceError } from '@/lib/services/errors';
import { PLATFORM_FEE_PERCENT, DEFAULT_PAGE_SIZE } from '@/constants';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/email', () => ({
  sendPayoutEmail: vi.fn().mockResolvedValue(undefined),
}));

// ============================================
// Test Data Factories
// ============================================

const MOCK_USER_ID = 'user-sender-123';
const MOCK_TRAVELER_ID = 'user-traveler-456';
const MOCK_REQUEST_ID = 'req-abc-789';

function mockRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: MOCK_REQUEST_ID,
    sender_id: MOCK_USER_ID,
    total_price: 50,
    weight_kg: 5,
    item_description: 'Vêtements pour la famille',
    listing_id: 'listing-001',
    listing: {
      traveler_id: MOCK_TRAVELER_ID,
      currency: 'EUR',
      departure_city: 'Paris',
      arrival_city: 'Douala',
    },
    status: 'accepted',
    ...overrides,
  };
}

function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-001',
    request_id: MOCK_REQUEST_ID,
    payer_id: MOCK_USER_ID,
    payee_id: MOCK_TRAVELER_ID,
    amount: 50,
    currency: 'EUR',
    platform_fee: 5,
    payout_amount: 45,
    stripe_payment_intent_id: 'pi_test_123',
    status: 'held',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup() {
  const mockSupabase = createMockSupabase();
  const mockAdminSupabase = createMockSupabase();
  const mockStripe = createMockStripe();
  const service = createTransactionService(
    asSupabase(mockSupabase),
    asSupabase(mockAdminSupabase),
    asStripe(mockStripe)
  );
  return { mockSupabase, mockAdminSupabase, mockStripe, service };
}

// ============================================
// Tests
// ============================================

describe('Transactions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // createCheckoutSession
  // -----------------------------------------
  describe('createCheckoutSession', () => {
    it('throws NOT_FOUND when request is not found', async () => {
      const { mockSupabase, service } = setup();
      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID)).rejects.toThrow(
        ServiceError
      );

      try {
        await service.createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('introuvable');
      }
    });

    it('throws AUTH when user is not the sender', async () => {
      const { mockSupabase, service } = setup();
      const req = mockRequest({ sender_id: 'other-user' });

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: req,
        error: null,
      });

      try {
        await service.createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('AUTH');
        expect((e as ServiceError).message).toContain('expéditeur');
      }
    });

    it('throws CONFLICT when a non-pending transaction already exists', async () => {
      const { mockSupabase, service } = setup();
      const req = mockRequest();
      const existingTx = mockTransaction({ status: 'held' });

      // First call: shipment_requests.single
      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: req,
        error: null,
      });
      // Second call: transactions.maybeSingle
      mockSupabase._getChain('transactions').maybeSingle.mockResolvedValue({
        data: existingTx,
        error: null,
      });

      try {
        await service.createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('CONFLICT');
        expect((e as ServiceError).message).toContain('existe déjà');
      }
    });

    it('creates checkout session with manual capture for escrow', async () => {
      const { mockSupabase, mockAdminSupabase, mockStripe, service } = setup();
      const req = mockRequest();

      mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: req,
        error: null,
      });
      mockSupabase._getChain('transactions').maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      mockAdminSupabase._getChain('transactions').single.mockResolvedValue({
        data: { id: 'tx-new' },
        error: null,
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
        payment_intent: 'pi_test_new',
      });

      const result = await service.createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.url).toContain('stripe.com');

      const stripeCallArgs = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(stripeCallArgs.payment_intent_data.capture_method).toBe('manual');
      expect(stripeCallArgs.mode).toBe('payment');
      expect(stripeCallArgs.metadata.request_id).toBe(MOCK_REQUEST_ID);
    });
  });

  // -----------------------------------------
  // capturePayment
  // -----------------------------------------
  describe('capturePayment', () => {
    it('throws NOT_FOUND when no held transaction exists', async () => {
      const { mockAdminSupabase, service } = setup();
      mockAdminSupabase._getChain('transactions').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.capturePayment(MOCK_REQUEST_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('introuvable');
      }
    });

    it('captures payment via Stripe and updates status to released', async () => {
      const { mockAdminSupabase, mockStripe, service } = setup();
      const tx = mockTransaction({ status: 'held' });
      const releasedTx = { ...tx, status: 'released' };

      let adminCallCount = 0;
      mockAdminSupabase.from.mockImplementation((table: string) => {
        const chain = mockAdminSupabase._getChain(table);
        if (table === 'transactions') {
          adminCallCount++;
          if (adminCallCount === 1) {
            chain.single.mockResolvedValueOnce({ data: tx, error: null });
          } else if (adminCallCount === 3) {
            chain.single.mockResolvedValueOnce({ data: releasedTx, error: null });
          }
        }
        if (table === 'profiles') {
          chain.single.mockResolvedValue({ data: null, error: null });
        }
        return chain;
      });

      mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'traveler@test.com' } },
      });

      mockStripe.paymentIntents.capture.mockResolvedValue({ id: tx.stripe_payment_intent_id });

      // Re-setup: use a simpler approach
      const mockSupabase2 = createMockSupabase();
      const mockAdminSupabase2 = createMockSupabase();
      const mockStripe2 = createMockStripe();

      // tx lookup
      mockAdminSupabase2
        ._getChain('transactions')
        .single.mockResolvedValueOnce({ data: tx, error: null }) // find held tx
        .mockResolvedValueOnce({ data: releasedTx, error: null }); // update result

      // profiles lookup
      mockAdminSupabase2._getChain('profiles').single.mockResolvedValue({
        data: null,
        error: null,
      });

      mockAdminSupabase2.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email: 'traveler@test.com' } },
      });

      mockStripe2.paymentIntents.capture.mockResolvedValue({ id: tx.stripe_payment_intent_id });

      const service2 = createTransactionService(
        asSupabase(mockSupabase2),
        asSupabase(mockAdminSupabase2),
        asStripe(mockStripe2)
      );

      const result = await service2.capturePayment(MOCK_REQUEST_ID);

      expect(mockStripe2.paymentIntents.capture).toHaveBeenCalledWith('pi_test_123');
      expect(result).toMatchObject({ status: 'released' });
    });

    it('throws INTERNAL when Stripe capture fails', async () => {
      const { mockAdminSupabase, mockStripe, service } = setup();
      const tx = mockTransaction({ status: 'held' });

      mockAdminSupabase._getChain('transactions').single.mockResolvedValue({
        data: tx,
        error: null,
      });
      mockStripe.paymentIntents.capture.mockRejectedValue(
        new Error('Payment intent has already been captured')
      );

      try {
        await service.capturePayment(MOCK_REQUEST_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
        expect((e as ServiceError).message).toContain('already been captured');
      }
    });
  });

  // -----------------------------------------
  // refundPayment
  // -----------------------------------------
  describe('refundPayment', () => {
    it('throws NOT_FOUND when no refundable transaction exists', async () => {
      const { mockAdminSupabase, service } = setup();
      mockAdminSupabase._getChain('transactions').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
        expect((e as ServiceError).message).toContain('introuvable');
      }
    });

    it('cancels Stripe PaymentIntent for held transactions', async () => {
      const { mockAdminSupabase, mockStripe, service } = setup();
      const tx = mockTransaction({ status: 'held' });
      const refundedTx = { ...tx, status: 'refunded' };

      mockAdminSupabase
        ._getChain('transactions')
        .single.mockResolvedValueOnce({ data: tx, error: null })
        .mockResolvedValueOnce({ data: refundedTx, error: null });

      mockAdminSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: null,
        error: null,
      });

      mockStripe.paymentIntents.cancel.mockResolvedValue({ id: tx.stripe_payment_intent_id });

      const result = await service.refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test_123');
      expect(result).toMatchObject({ status: 'refunded' });
    });

    it('does not call Stripe for pending transactions', async () => {
      const { mockAdminSupabase, mockStripe, service } = setup();
      const tx = mockTransaction({ status: 'pending' });
      const refundedTx = { ...tx, status: 'refunded' };

      mockAdminSupabase
        ._getChain('transactions')
        .single.mockResolvedValueOnce({ data: tx, error: null })
        .mockResolvedValueOnce({ data: refundedTx, error: null });

      mockAdminSupabase._getChain('shipment_requests').single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result).toMatchObject({ status: 'refunded' });
      expect(mockStripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });

    it('throws INTERNAL when Stripe cancellation fails', async () => {
      const { mockAdminSupabase, mockStripe, service } = setup();
      const tx = mockTransaction({ status: 'held' });

      mockAdminSupabase._getChain('transactions').single.mockResolvedValue({
        data: tx,
        error: null,
      });
      mockStripe.paymentIntents.cancel.mockRejectedValue(
        new Error('PaymentIntent cannot be canceled')
      );

      try {
        await service.refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
        expect((e as ServiceError).message).toContain('cannot be canceled');
      }
    });

    it('throws AUTH when user is not the payer', async () => {
      const { mockAdminSupabase, mockStripe, service } = setup();
      const tx = mockTransaction({ payer_id: 'other-user-999' });

      mockAdminSupabase._getChain('transactions').single.mockResolvedValue({
        data: tx,
        error: null,
      });

      try {
        await service.refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('AUTH');
        expect((e as ServiceError).message).toContain('Non autorisé');
      }
      expect(mockStripe.paymentIntents.cancel).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------
  // getTransactionsByUser — Pagination logic
  // -----------------------------------------
  describe('getTransactionsByUser', () => {
    it('returns paginated transactions for page 1', async () => {
      const { mockSupabase, service } = setup();
      const txList = [mockTransaction()];

      mockSupabase._getChain('transactions').range.mockResolvedValue({
        data: txList,
        error: null,
        count: 1,
      });

      const result = await service.getTransactionsByUser(MOCK_USER_ID, 1, 20);

      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
      expect(result.data).toHaveLength(1);
    });

    it('calculates correct total_pages', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('transactions').range.mockResolvedValue({
        data: [],
        error: null,
        count: 45,
      });

      const result = await service.getTransactionsByUser(MOCK_USER_ID, 1, DEFAULT_PAGE_SIZE);

      expect(result.total).toBe(45);
      expect(result.total_pages).toBe(Math.ceil(45 / DEFAULT_PAGE_SIZE));
    });

    it('returns empty result on Supabase error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('transactions').range.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
        count: null,
      });

      const result = await service.getTransactionsByUser(MOCK_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.total_pages).toBe(0);
    });
  });

  // -----------------------------------------
  // getTransactionByRequest
  // -----------------------------------------
  describe('getTransactionByRequest', () => {
    it('returns transaction on success', async () => {
      const { mockSupabase, service } = setup();
      const tx = mockTransaction();

      mockSupabase._getChain('transactions').single.mockResolvedValue({
        data: tx,
        error: null,
      });

      const result = await service.getTransactionByRequest(MOCK_REQUEST_ID);
      expect(result).toEqual(tx);
    });

    it('throws NOT_FOUND when transaction not found', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('transactions').single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      try {
        await service.getTransactionByRequest(MOCK_REQUEST_ID);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
      }
    });
  });
});

// ============================================
// Pure Business Logic Tests (no mocks needed)
// ============================================
describe('Transaction Business Logic', () => {
  describe('calculateTransactionFees', () => {
    it('calculates 10% platform fee of 100€', () => {
      const { platformFee, payoutAmount } = calculateTransactionFees(100);
      expect(platformFee).toBe(10);
      expect(payoutAmount).toBe(90);
    });

    it('calculates 10% of 0€', () => {
      const { platformFee, payoutAmount } = calculateTransactionFees(0);
      expect(platformFee).toBe(0);
      expect(payoutAmount).toBe(0);
    });

    it('rounds correctly for 33.33€', () => {
      const { platformFee } = calculateTransactionFees(33.33);
      expect(platformFee).toBe(3.33);
    });

    it('calculates 10% of 49.99€', () => {
      const { platformFee } = calculateTransactionFees(49.99);
      expect(platformFee).toBe(5);
    });

    it('handles large amounts', () => {
      const { platformFee } = calculateTransactionFees(9999);
      expect(platformFee).toBe(999.9);
    });
  });

  describe('amountToCents', () => {
    it('converts 50€ to 5000 cents', () => expect(amountToCents(50)).toBe(5000));
    it('converts 0.01€ to 1 cent', () => expect(amountToCents(0.01)).toBe(1));
    it('converts 99.99€ to 9999 cents', () => expect(amountToCents(99.99)).toBe(9999));
    it('handles 0€', () => expect(amountToCents(0)).toBe(0));
    it('handles floating point: 19.99€', () => expect(amountToCents(19.99)).toBe(1999));
  });

  describe('calculatePaginationOffset', () => {
    it('page 1 starts at offset 0', () => {
      expect(calculatePaginationOffset(1, DEFAULT_PAGE_SIZE)).toBe(0);
    });

    it('page 2 starts at offset DEFAULT_PAGE_SIZE', () => {
      expect(calculatePaginationOffset(2, DEFAULT_PAGE_SIZE)).toBe(DEFAULT_PAGE_SIZE);
    });

    it('page 3 starts at offset 2 * DEFAULT_PAGE_SIZE', () => {
      expect(calculatePaginationOffset(3, DEFAULT_PAGE_SIZE)).toBe(2 * DEFAULT_PAGE_SIZE);
    });
  });

  describe('Platform fee calculation (PLATFORM_FEE_PERCENT)', () => {
    it('is 10%', () => expect(PLATFORM_FEE_PERCENT).toBe(10));
  });
});
