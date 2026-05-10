import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

// ─── Mocks ──────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/services/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email', () => ({
  sendConfirmationCodeEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── Imports (after mocks) ──────────────────────────────────────

import { POST } from '../route';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/services/notifications';
import { sendConfirmationCodeEmail, sendPaymentEmail } from '@/lib/email';

// ─── Helpers ────────────────────────────────────────────────────

function createMockRequest(body: string, signature: string | null) {
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (name: string) => (name === 'stripe-signature' ? signature : null),
    },
  } as unknown as Request;
}

/** Minimal mock Supabase with chainable query builder, adapted from helpers.ts */
function createMockSupabase() {
  const chains: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};

  function getChain(table: string) {
    if (!chains[table]) {
      const single = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq = vi.fn();
      const select = vi.fn();
      const insert = vi.fn();
      const update = vi.fn();

      const chainObj: Record<string, ReturnType<typeof vi.fn>> = {
        select,
        insert,
        update,
        single,
        eq,
      };

      // Make every method (except single) return the chain for fluent chaining
      for (const [key, fn] of Object.entries(chainObj)) {
        if (key !== 'single') {
          fn.mockReturnValue(chainObj);
        }
      }

      chains[table] = chainObj;
    }
    return chains[table];
  }

  const auth = {
    admin: {
      getUserById: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  };

  const from = vi.fn((table: string) => getChain(table));

  return { from, auth, _getChain: getChain };
}

function makeStripeEvent(type: string, dataObject: Record<string, unknown>): Stripe.Event {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: { object: dataObject },
  } as unknown as Stripe.Event;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('Stripe Webhook Handler — POST', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = createMockSupabase();
    vi.mocked(createAdminClient).mockResolvedValue(mockSupabase as never);

    // Default: no duplicate event
    mockSupabase
      ._getChain('processed_webhook_events')
      .single.mockResolvedValue({ data: null, error: null });

    // Default: insert succeeds for idempotency recording
    mockSupabase._getChain('processed_webhook_events').insert.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  // ─── 1. Signature verification failure ─────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = createMockRequest('body', null);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing stripe-signature header');
  });

  it('returns 400 when Stripe signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = createMockRequest('body', 'bad_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid signature');
  });

  // ─── 2. Duplicate event (idempotency) ─────────────────────────

  it('returns 200 with duplicate:true for already-processed events', async () => {
    const event = makeStripeEvent('checkout.session.completed', {});
    mockConstructEvent.mockReturnValue(event);

    // Simulate event already exists
    mockSupabase
      ._getChain('processed_webhook_events')
      .single.mockResolvedValue({ data: { id: 'existing-id' }, error: null });

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(json.received).toBe(true);
  });

  // ─── 3. checkout.session.completed ─────────────────────────────

  it('updates transaction to held, request to paid, and sends notifications', async () => {
    const event = makeStripeEvent('checkout.session.completed', {
      payment_intent: 'pi_test_123',
      amount_total: 5000,
      currency: 'eur',
      metadata: {
        request_id: 'req_1',
        payer_id: 'user_payer',
        payee_id: 'user_payee',
      },
    });
    mockConstructEvent.mockReturnValue(event);

    // shipment_requests select for email
    mockSupabase._getChain('shipment_requests').single.mockResolvedValue({
      data: { listing: { departure_city: 'Paris', arrival_city: 'Dakar' } },
      error: null,
    });

    // confirmation_codes
    mockSupabase._getChain('confirmation_codes').single.mockResolvedValue({
      data: { code: '123456' },
      error: null,
    });

    // profiles
    mockSupabase._getChain('profiles').single.mockResolvedValue({
      data: { user_id: 'user_payer' },
      error: null,
    });

    // auth admin getUserById
    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'payer@example.com' } },
    });

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    // Transaction updated to 'held'
    const txChain = mockSupabase._getChain('transactions');
    expect(txChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'held', stripe_payment_intent_id: 'pi_test_123' })
    );

    // Request updated to 'paid'
    const reqChain = mockSupabase._getChain('shipment_requests');
    expect(reqChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));

    // Notifications sent to both payer and payee
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(createNotification).toHaveBeenCalledWith(
      'user_payer',
      'payment_received',
      expect.any(String),
      expect.any(String),
      { request_id: 'req_1' }
    );
    expect(createNotification).toHaveBeenCalledWith(
      'user_payee',
      'payment_received',
      expect.any(String),
      expect.any(String),
      { request_id: 'req_1' }
    );

    // Confirmation code email is now sent at request creation time (not from webhook)
    expect(sendConfirmationCodeEmail).not.toHaveBeenCalled();
    expect(sendPaymentEmail).toHaveBeenCalledWith('payer@example.com', 50, 'EUR', 'Paris → Dakar');
  });

  // ─── 4. payment_intent.payment_failed ──────────────────────────

  it('sends failure notification on payment_intent.payment_failed', async () => {
    const event = makeStripeEvent('payment_intent.payment_failed', {
      metadata: {
        request_id: 'req_fail',
        payer_id: 'user_payer',
      },
    });
    mockConstructEvent.mockReturnValue(event);

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    expect(createNotification).toHaveBeenCalledWith(
      'user_payer',
      'payment_received',
      expect.stringContaining('choué'),
      expect.any(String),
      { request_id: 'req_fail' }
    );
  });

  // ─── 5. charge.refunded ────────────────────────────────────────

  it('updates transaction to refunded and request to cancelled on charge.refunded', async () => {
    const event = makeStripeEvent('charge.refunded', {
      payment_intent: 'pi_refund_123',
    });
    mockConstructEvent.mockReturnValue(event);

    // After the update, the select query returns the transaction
    mockSupabase._getChain('transactions').single.mockResolvedValue({
      data: { request_id: 'req_refund', payer_id: 'user_refund' },
      error: null,
    });

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    const txChain = mockSupabase._getChain('transactions');
    expect(txChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));

    const reqChain = mockSupabase._getChain('shipment_requests');
    expect(reqChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));

    expect(createNotification).toHaveBeenCalledWith(
      'user_refund',
      'payment_received',
      expect.stringContaining('Remboursement'),
      expect.any(String),
      { request_id: 'req_refund' }
    );
  });

  // ─── 6. payment_intent.canceled (escrow expiry) ────────────────

  it('updates transaction to refunded on payment_intent.canceled', async () => {
    const event = makeStripeEvent('payment_intent.canceled', {
      id: 'pi_cancel_123',
    });
    mockConstructEvent.mockReturnValue(event);

    mockSupabase._getChain('transactions').single.mockResolvedValue({
      data: { request_id: 'req_cancel', payer_id: 'user_cancel' },
      error: null,
    });

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    const txChain = mockSupabase._getChain('transactions');
    expect(txChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));

    const reqChain = mockSupabase._getChain('shipment_requests');
    expect(reqChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));

    expect(createNotification).toHaveBeenCalledWith(
      'user_cancel',
      'payment_received',
      expect.stringContaining('expiré'),
      expect.any(String),
      { request_id: 'req_cancel' }
    );
  });

  // ─── 7. Idempotency on success — event recorded ───────────────

  it('records event in processed_webhook_events after successful processing', async () => {
    const event = makeStripeEvent('payment_intent.payment_failed', {
      metadata: { request_id: 'req_idem', payer_id: 'user_idem' },
    });
    mockConstructEvent.mockReturnValue(event);

    const req = createMockRequest('body', 'valid_sig');
    await POST(req);

    const insertFn = mockSupabase._getChain('processed_webhook_events').insert;
    expect(insertFn).toHaveBeenCalledWith({
      event_id: event.id,
      event_type: event.type,
    });
  });

  // ─── 8. Idempotency on failure — event NOT recorded ───────────

  it('does NOT record event when processing fails and returns 500', async () => {
    const event = makeStripeEvent('checkout.session.completed', {
      payment_intent: 'pi_fail',
      metadata: { request_id: 'req_err', payer_id: 'user_err' },
    });
    mockConstructEvent.mockReturnValue(event);

    // Make the first DB update throw to simulate processing failure
    mockSupabase._getChain('transactions').update.mockImplementation(() => {
      throw new Error('DB connection error');
    });

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Webhook processing failed');

    // Event should NOT be recorded since processing failed
    const insertFn = mockSupabase._getChain('processed_webhook_events').insert;
    expect(insertFn).not.toHaveBeenCalled();
  });

  // ─── account.updated ──────────────────────────────────────────

  it('updates profile stripe_connect_onboarded on account.updated', async () => {
    const event = makeStripeEvent('account.updated', {
      metadata: { user_id: 'user_connect' },
      charges_enabled: true,
      payouts_enabled: true,
    });
    mockConstructEvent.mockReturnValue(event);

    const req = createMockRequest('body', 'valid_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    const profileChain = mockSupabase._getChain('profiles');
    expect(profileChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_connect_onboarded: true })
    );
    expect(profileChain.eq).toHaveBeenCalledWith('user_id', 'user_connect');
  });
});
