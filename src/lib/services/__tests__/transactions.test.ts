import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLATFORM_FEE_PERCENT, DEFAULT_PAGE_SIZE } from '@/constants';

// ============================================
// Mock Setup — Supabase & Stripe
// ============================================

// Chainable Supabase query builder mock
function createQueryBuilder(resolvedValue: { data: unknown; error: unknown; count?: number }) {
  const builder: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'or',
    'order',
    'range',
    'single',
    'maybeSingle',
    'limit',
  ];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods return the resolved value
  builder['single'] = vi.fn().mockResolvedValue(resolvedValue);
  builder['maybeSingle'] = vi.fn().mockResolvedValue(resolvedValue);

  // select with count returns with count property
  builder['select'] = vi.fn().mockImplementation(() => {
    const selectBuilder = { ...builder };
    selectBuilder['range'] = vi.fn().mockResolvedValue({
      ...resolvedValue,
      count: resolvedValue.count ?? 0,
    });
    return selectBuilder;
  });

  return builder;
}

// Supabase mock instances
const mockSupabaseFrom = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi
    .fn()
    .mockResolvedValue({ from: (...args: unknown[]) => mockSupabaseFrom(...args) }),
  createAdminClient: vi
    .fn()
    .mockResolvedValue({ from: (...args: unknown[]) => mockAdminFrom(...args) }),
}));

// Stripe mock
const mockStripeCheckoutCreate = vi.fn();
const mockStripePaymentIntentsCapture = vi.fn();
const mockStripePaymentIntentsCancel = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: { create: mockStripeCheckoutCreate },
    },
    paymentIntents: {
      capture: mockStripePaymentIntentsCapture,
      cancel: mockStripePaymentIntentsCancel,
    },
  })),
}));

// Import AFTER mocks are defined
import {
  createCheckoutSession,
  capturePayment,
  refundPayment,
  getTransactionsByUser,
  getTransactionByRequest,
} from '@/lib/services/transactions';

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
    stripe_payment_intent_id: 'pi_test_123',
    status: 'held',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
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
    it('returns 404 when request is not found', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(404);
      expect(result.error).toContain('introuvable');
      expect(result.data).toBeNull();
    });

    it('returns 403 when user is not the sender', async () => {
      const req = mockRequest({ sender_id: 'other-user' });

      // First call: shipment_requests.select -> returns request
      const reqBuilder = createQueryBuilder({ data: req, error: null });
      mockSupabaseFrom.mockReturnValue(reqBuilder);

      const result = await createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(403);
      expect(result.error).toContain('expéditeur');
    });

    it('returns 409 when a non-pending transaction already exists', async () => {
      const req = mockRequest();
      const existingTx = mockTransaction({ status: 'held' });

      // First from() call = shipment_requests
      // Second from() call = transactions
      let callCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: req, error: null });
        }
        return createQueryBuilder({ data: existingTx, error: null });
      });

      const result = await createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(409);
      expect(result.error).toContain('existe déjà');
    });

    it('calculates platform fee correctly at 10%', () => {
      // This tests the fee calculation logic used in createCheckoutSession
      const totalPrice = 50;
      const expectedFee = Math.round(totalPrice * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;

      expect(expectedFee).toBe(5);
      expect(PLATFORM_FEE_PERCENT).toBe(10);
    });

    it('calculates platform fee with decimal amounts', () => {
      const totalPrice = 33.33;
      const fee = Math.round(totalPrice * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;

      expect(fee).toBe(3.33);
    });

    it('converts amount to cents correctly', () => {
      const totalPrice = 49.99;
      const amountInCents = Math.round(totalPrice * 100);

      expect(amountInCents).toBe(4999);
    });

    it('converts large amount to cents without floating point errors', () => {
      const totalPrice = 199.99;
      const amountInCents = Math.round(totalPrice * 100);

      expect(amountInCents).toBe(19999);
    });

    it('creates checkout session with manual capture for escrow', async () => {
      const req = mockRequest();

      let fromCallCount = 0;
      mockSupabaseFrom.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return createQueryBuilder({ data: req, error: null });
        }
        // No existing transaction
        return createQueryBuilder({ data: null, error: null });
      });

      mockAdminFrom.mockReturnValue(createQueryBuilder({ data: { id: 'tx-new' }, error: null }));

      mockStripeCheckoutCreate.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
        payment_intent: 'pi_test_new',
      });

      const result = await createCheckoutSession(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(200);
      expect(result.data?.url).toContain('stripe.com');

      // Verify Stripe was called with manual capture (escrow)
      const stripeCallArgs = mockStripeCheckoutCreate.mock.calls[0][0];
      expect(stripeCallArgs.payment_intent_data.capture_method).toBe('manual');
      expect(stripeCallArgs.mode).toBe('payment');
      expect(stripeCallArgs.metadata.request_id).toBe(MOCK_REQUEST_ID);
    });
  });

  // -----------------------------------------
  // capturePayment
  // -----------------------------------------
  describe('capturePayment', () => {
    it('returns 404 when no held transaction exists', async () => {
      mockAdminFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await capturePayment(MOCK_REQUEST_ID);

      expect(result.status).toBe(404);
      expect(result.error).toContain('introuvable');
    });

    it('captures payment via Stripe and updates status to released', async () => {
      const tx = mockTransaction({ status: 'held' });
      const releasedTx = { ...tx, status: 'released' };

      let adminCallCount = 0;
      mockAdminFrom.mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          // Find transaction
          return createQueryBuilder({ data: tx, error: null });
        }
        // Update transaction
        return createQueryBuilder({ data: releasedTx, error: null });
      });

      mockStripePaymentIntentsCapture.mockResolvedValue({ id: tx.stripe_payment_intent_id });

      const result = await capturePayment(MOCK_REQUEST_ID);

      expect(result.status).toBe(200);
      expect(mockStripePaymentIntentsCapture).toHaveBeenCalledWith('pi_test_123');
    });

    it('returns 500 when Stripe capture fails', async () => {
      const tx = mockTransaction({ status: 'held' });

      mockAdminFrom.mockReturnValue(createQueryBuilder({ data: tx, error: null }));

      mockStripePaymentIntentsCapture.mockRejectedValue(
        new Error('Payment intent has already been captured')
      );

      const result = await capturePayment(MOCK_REQUEST_ID);

      expect(result.status).toBe(500);
      expect(result.error).toContain('already been captured');
    });
  });

  // -----------------------------------------
  // refundPayment
  // -----------------------------------------
  describe('refundPayment', () => {
    it('returns 404 when no refundable transaction exists', async () => {
      mockAdminFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(404);
      expect(result.error).toContain('introuvable');
    });

    it('cancels Stripe PaymentIntent for held transactions', async () => {
      const tx = mockTransaction({ status: 'held' });
      const refundedTx = { ...tx, status: 'refunded' };

      let adminCallCount = 0;
      mockAdminFrom.mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return createQueryBuilder({ data: tx, error: null });
        }
        return createQueryBuilder({ data: refundedTx, error: null });
      });

      mockStripePaymentIntentsCancel.mockResolvedValue({ id: tx.stripe_payment_intent_id });

      const result = await refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(200);
      expect(mockStripePaymentIntentsCancel).toHaveBeenCalledWith('pi_test_123');
    });

    it('does not call Stripe for pending transactions', async () => {
      const tx = mockTransaction({ status: 'pending' });
      const refundedTx = { ...tx, status: 'refunded' };

      let adminCallCount = 0;
      mockAdminFrom.mockImplementation(() => {
        adminCallCount++;
        if (adminCallCount === 1) {
          return createQueryBuilder({ data: tx, error: null });
        }
        return createQueryBuilder({ data: refundedTx, error: null });
      });

      const result = await refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(200);
      expect(mockStripePaymentIntentsCancel).not.toHaveBeenCalled();
    });

    it('returns 500 when Stripe cancellation fails', async () => {
      const tx = mockTransaction({ status: 'held' });

      mockAdminFrom.mockReturnValue(createQueryBuilder({ data: tx, error: null }));

      mockStripePaymentIntentsCancel.mockRejectedValue(
        new Error('PaymentIntent cannot be canceled')
      );

      const result = await refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(500);
      expect(result.error).toContain('cannot be canceled');
    });

    it('returns 403 when user is not the payer', async () => {
      const tx = mockTransaction({ payer_id: 'other-user-999' });

      mockAdminFrom.mockReturnValue(createQueryBuilder({ data: tx, error: null }));

      const result = await refundPayment(MOCK_REQUEST_ID, MOCK_USER_ID);

      expect(result.status).toBe(403);
      expect(result.error).toContain('Non autorisé');
      expect(mockStripePaymentIntentsCancel).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------
  // getTransactionsByUser — Pagination logic
  // -----------------------------------------
  describe('getTransactionsByUser', () => {
    it('calculates pagination offset correctly for page 1', async () => {
      const txList = [mockTransaction()];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: txList,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      });

      const result = await getTransactionsByUser(MOCK_USER_ID, 1, 20);

      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
      expect(result.data).toHaveLength(1);
    });

    it('calculates correct total_pages', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 45,
              }),
            }),
          }),
        }),
      });

      const result = await getTransactionsByUser(MOCK_USER_ID, 1, DEFAULT_PAGE_SIZE);

      expect(result.total).toBe(45);
      expect(result.total_pages).toBe(Math.ceil(45 / DEFAULT_PAGE_SIZE));
    });

    it('returns empty result on Supabase error', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
                count: null,
              }),
            }),
          }),
        }),
      });

      const result = await getTransactionsByUser(MOCK_USER_ID);

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
      const tx = mockTransaction();

      mockSupabaseFrom.mockReturnValue(createQueryBuilder({ data: tx, error: null }));

      const result = await getTransactionByRequest(MOCK_REQUEST_ID);

      expect(result.status).toBe(200);
      expect(result.data).toEqual(tx);
    });

    it('returns 404 when transaction not found', async () => {
      mockSupabaseFrom.mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const result = await getTransactionByRequest(MOCK_REQUEST_ID);

      expect(result.status).toBe(404);
      expect(result.data).toBeNull();
    });
  });
});

// ============================================
// Pure Business Logic Tests (no mocks needed)
// ============================================
describe('Transaction Business Logic', () => {
  describe('Platform fee calculation', () => {
    const calculateFee = (amount: number) =>
      Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;

    it('calculates 10% of 100€', () => expect(calculateFee(100)).toBe(10));
    it('calculates 10% of 0€', () => expect(calculateFee(0)).toBe(0));
    it('calculates 10% of 49.99€', () => expect(calculateFee(49.99)).toBe(5));
    it('calculates 10% of 1€', () => expect(calculateFee(1)).toBe(0.1));
    it('handles large amounts', () => expect(calculateFee(9999)).toBe(999.9));
    it('rounds correctly for 33.33€', () => expect(calculateFee(33.33)).toBe(3.33));
  });

  describe('Amount to cents conversion', () => {
    const toCents = (amount: number) => Math.round(amount * 100);

    it('converts 50€ to 5000 cents', () => expect(toCents(50)).toBe(5000));
    it('converts 0.01€ to 1 cent', () => expect(toCents(0.01)).toBe(1));
    it('converts 99.99€ to 9999 cents', () => expect(toCents(99.99)).toBe(9999));
    it('handles 0€', () => expect(toCents(0)).toBe(0));
    it('handles floating point: 19.99€', () => expect(toCents(19.99)).toBe(1999));
  });

  describe('Pagination math', () => {
    it('page 1 starts at offset 0', () => {
      const from = (1 - 1) * DEFAULT_PAGE_SIZE;
      expect(from).toBe(0);
    });

    it('page 2 starts at offset 20', () => {
      const from = (2 - 1) * DEFAULT_PAGE_SIZE;
      expect(from).toBe(20);
    });

    it('calculates total pages correctly', () => {
      expect(Math.ceil(0 / DEFAULT_PAGE_SIZE)).toBe(0);
      expect(Math.ceil(1 / DEFAULT_PAGE_SIZE)).toBe(1);
      expect(Math.ceil(20 / DEFAULT_PAGE_SIZE)).toBe(1);
      expect(Math.ceil(21 / DEFAULT_PAGE_SIZE)).toBe(2);
      expect(Math.ceil(100 / DEFAULT_PAGE_SIZE)).toBe(5);
    });
  });
});
