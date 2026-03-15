import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * Creates a mock Supabase client with chainable query builder.
 * Usage:
 *   const mock = createMockSupabase();
 *   mock._getChain('tableName').single.mockResolvedValue({ data: {...}, error: null });
 *   const service = createXxxService(asSupabase(mock));
 */
export function createMockSupabase() {
  const chains: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};

  function getChain(table: string) {
    if (!chains[table]) {
      const single = vi.fn();
      const maybeSingle = vi.fn();
      const inFn = vi.fn();
      const eq = vi.fn();
      const neq = vi.fn();
      const gt = vi.fn();
      const gte = vi.fn();
      const lt = vi.fn();
      const lte = vi.fn();
      const like = vi.fn();
      const ilike = vi.fn();
      const order = vi.fn();
      const limit = vi.fn();
      const range = vi.fn();
      const or = vi.fn();

      const chainObj = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        single,
        maybeSingle,
        in: inFn,
        eq,
        neq,
        gt,
        gte,
        lt,
        lte,
        like,
        ilike,
        order,
        limit,
        range,
        or,
      };

      // Make every method return the chain for fluent chaining
      for (const [key, fn] of Object.entries(chainObj)) {
        if (key !== 'single' && key !== 'maybeSingle') {
          fn.mockReturnValue(chainObj);
        }
      }

      chains[table] = chainObj;
    }
    return chains[table];
  }

  const rpc = vi.fn();
  const storage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
    }),
  };
  const auth = {
    getUser: vi.fn(),
    admin: {
      getUserById: vi.fn(),
    },
  };

  const from = vi.fn((table: string) => getChain(table));

  return {
    from,
    rpc,
    storage,
    auth,
    _getChain: getChain,
    _chains: chains,
  };
}

/** Cast mock to SupabaseClient for type safety in service factories. */
export function asSupabase(mock: ReturnType<typeof createMockSupabase>): SupabaseClient {
  return mock as unknown as SupabaseClient;
}

/**
 * Creates a mock Stripe client for transaction service tests.
 */
export function createMockStripe() {
  return {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    paymentIntents: {
      capture: vi.fn(),
      cancel: vi.fn(),
      retrieve: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    transfers: {
      create: vi.fn(),
    },
    accounts: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    accountLinks: {
      create: vi.fn(),
    },
    identity: {
      verificationSessions: {
        create: vi.fn(),
      },
    },
  };
}

/** Cast mock to Stripe for type safety in service factories. */
export function asStripe(mock: ReturnType<typeof createMockStripe>): Stripe {
  return mock as unknown as Stripe;
}
