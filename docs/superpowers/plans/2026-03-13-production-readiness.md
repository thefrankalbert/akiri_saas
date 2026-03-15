# Akiri Production Readiness — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Akiri to production-grade standards: CI/CD pipeline, centralized logger, typed service errors, dependency-injected services, 70+ tests, thin API routes.

**Architecture:** Foundation-first approach — CI/CD, logger, and ServiceError are built first, then each service is migrated to the factory DI pattern in 4 phases ordered by business criticality. Tests are written TDD-style alongside each migration. API routes become thin controllers with try/catch.

**Tech Stack:** Next.js 16, TypeScript 5.9, Vitest, Supabase, Stripe, Sentry, GitHub Actions, pnpm

**Spec:** `docs/superpowers/specs/2026-03-13-production-readiness-design.md`

---

## Chunk 1: Foundations

### Task 1: Add `format:check` script to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add format:check script**

In `package.json`, add to the `"scripts"` block:

```json
"format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\""
```

- [ ] **Step 2: Verify it runs**

Run: `pnpm format:check`
Expected: Either exits 0 (all formatted) or lists unformatted files. Should not error.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add format:check script for CI pipeline"
```

---

### Task 2: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow file**

```yaml
name: CI

on:
  push:
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality Gates
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Cache pnpm modules
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
          NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
```

- [ ] **Step 2: Verify YAML syntax**

Run: `cat .github/workflows/ci.yml | python3 -c "import sys,yaml;yaml.safe_load(sys.stdin)"`
Expected: No output (valid YAML).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline with 5 quality gates"
```

---

### Task 3: Create centralized logger

**Files:**
- Create: `src/lib/logger.ts`
- Test: `src/lib/__tests__/logger.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/logger.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing logger
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('in non-production (default test env)', () => {
    // Vitest runs with NODE_ENV=test by default, which is non-production

    it('error logs to console.error with prefix', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('test');
      logger.error('Something failed', err, { userId: '123' });
      expect(spy).toHaveBeenCalledWith('[ERROR] Something failed', err, { userId: '123' });
      spy.mockRestore();
    });

    it('warn logs to console.warn with prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Slow query', { duration: 5000 });
      expect(spy).toHaveBeenCalledWith('[WARN] Slow query', { duration: 5000 });
      spy.mockRestore();
    });

    it('info logs to console.info with prefix', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('User signed up', { tenantId: 'abc' });
      expect(spy).toHaveBeenCalledWith('[INFO] User signed up', { tenantId: 'abc' });
      spy.mockRestore();
    });
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('error sends Error instances to Sentry.captureException', () => {
      const err = new Error('payment failed');
      logger.error('Payment failed', err, { orderId: '123' });
      expect(Sentry.captureException).toHaveBeenCalledWith(err, {
        extra: { message: 'Payment failed', orderId: '123' },
      });
    });

    it('error sends non-Error values to Sentry.captureMessage', () => {
      logger.error('Unknown error', 'string-error', { requestId: 'abc' });
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Unknown error', {
        level: 'error',
        extra: { error: 'string-error', requestId: 'abc' },
      });
    });

    it('warn sends to Sentry.captureMessage with warning level', () => {
      logger.warn('Slow query', { duration: 5000 });
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Slow query', {
        level: 'warning',
        extra: { duration: 5000 },
      });
    });

    it('info adds Sentry breadcrumb', () => {
      logger.info('Page viewed', { page: '/dashboard' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Page viewed',
        level: 'info',
        data: { page: '/dashboard' },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/logger.test.ts`
Expected: FAIL — module `../logger` not found.

- [ ] **Step 3: Write the logger implementation**

Create `src/lib/logger.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

type LogContext = Record<string, unknown>;

export const logger = {
  error(message: string, error?: unknown, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, error, context);
      return;
    }

    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { error, ...context },
      });
    }
  },

  warn(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, context);
      return;
    }

    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  },

  info(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO] ${message}`, context);
      return;
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/logger.test.ts`
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts src/lib/__tests__/logger.test.ts
git commit -m "feat: add centralized logger with Sentry integration"
```

---

### Task 4: Create ServiceError class

**Files:**
- Create: `src/lib/services/errors.ts`
- Test: `src/lib/services/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/services/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ServiceError, serviceErrorToStatus } from '../errors';
import type { ServiceErrorCode } from '../errors';

describe('ServiceError', () => {
  it('extends Error with correct name', () => {
    const err = new ServiceError('Not found', 'NOT_FOUND');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ServiceError');
    expect(err.message).toBe('Not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('stores optional details', () => {
    const details = { field: 'email', reason: 'duplicate' };
    const err = new ServiceError('Conflict', 'CONFLICT', details);
    expect(err.details).toEqual(details);
  });

  it('defaults details to undefined', () => {
    const err = new ServiceError('Bad input', 'VALIDATION');
    expect(err.details).toBeUndefined();
  });
});

describe('serviceErrorToStatus', () => {
  const cases: [ServiceErrorCode, number][] = [
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['VALIDATION', 400],
    ['AUTH', 403],
    ['INTERNAL', 500],
  ];

  it.each(cases)('maps %s to %d', (code, status) => {
    expect(serviceErrorToStatus(code)).toBe(status);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/services/__tests__/errors.test.ts`
Expected: FAIL — module `../errors` not found.

- [ ] **Step 3: Write ServiceError implementation**

Create `src/lib/services/errors.ts`:

```typescript
export type ServiceErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'INTERNAL' | 'AUTH';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function serviceErrorToStatus(code: ServiceErrorCode): number {
  const map: Record<ServiceErrorCode, number> = {
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION: 400,
    AUTH: 403,
    INTERNAL: 500,
  };
  return map[code];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/services/__tests__/errors.test.ts`
Expected: 8 tests PASS (3 ServiceError + 5 serviceErrorToStatus).

- [ ] **Step 5: Update barrel exports**

Add to `src/lib/services/index.ts`:

```typescript
export * from './errors';
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/errors.ts src/lib/services/__tests__/errors.test.ts src/lib/services/index.ts
git commit -m "feat: add ServiceError class with typed error codes"
```

---

### Task 5: Create shared test helpers

**Files:**
- Create: `src/lib/services/__tests__/helpers.ts`

- [ ] **Step 1: Write test helpers**

Create `src/lib/services/__tests__/helpers.ts`:

```typescript
import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * Creates a mock Supabase client with chainable query builder.
 * Usage:
 *   const mock = createMockSupabase();
 *   mock._chain.single.mockResolvedValue({ data: {...}, error: null });
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

      // Every filter method returns the full chain for chaining
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: No errors related to helpers.ts.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/__tests__/helpers.ts
git commit -m "test: add shared mock helpers for service tests"
```

---

### Task 6: Extend Vitest coverage config

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Update coverage include**

In `vitest.config.ts`, replace the `coverage.include` array to cover all services:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'text-summary'],
  include: [
    'src/lib/utils/index.ts',
    'src/lib/validations/index.ts',
    'src/constants/index.ts',
    'src/lib/services/**/*.ts',
    'src/lib/logger.ts',
  ],
  exclude: [
    'src/lib/services/__tests__/**',
    'src/lib/services/index.ts',
  ],
},
```

- [ ] **Step 2: Verify config is valid**

Run: `pnpm vitest run --coverage`
Expected: Tests pass, coverage report shows all service files.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "test: extend vitest coverage to all services and logger"
```

---

### Task 7: Run all foundation tests together

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass (existing tests + new logger + errors tests).

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No lint errors (fix any that appear).

---

## Chunk 2: Phase 1 — Critical Services (transactions, verification, requests)

### Task 8: Refactor transactions service to DI factory

**Files:**
- Modify: `src/lib/services/transactions.ts`
- Modify: `src/lib/services/index.ts`

The `transactions.ts` service currently exports bare functions that call `createClient()` and `createAdminClient()` internally. Refactor to a factory that accepts `supabase`, `adminSupabase`, and `stripe` as parameters.

- [ ] **Step 1: Convert to factory pattern**

Rewrite `src/lib/services/transactions.ts`:

1. Remove imports of `createClient`, `createAdminClient`, `getStripe`
2. Add imports: `import type { SupabaseClient } from '@supabase/supabase-js'`, `import type Stripe from 'stripe'`, `import { ServiceError } from './errors'`, `import { logger } from '@/lib/logger'`
3. Wrap all exports in a factory function:

```typescript
export function createTransactionService(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  stripe: Stripe,
) {
  return {
    async createCheckoutSession(requestId: string, userId: string) {
      // Move existing createCheckoutSession logic here
      // Replace: const supabase = await createClient() → use injected supabase
      // Replace: const adminSupabase = createAdminClient() → use injected adminSupabase
      // Replace: getStripe() → use injected stripe
      // Replace: return { error: '...', status: N } → throw new ServiceError('...', 'CODE')
      // Replace: console.error → logger.error
      // Replace: return { data: {...} } → return {...} directly
    },
    async capturePayment(transactionId: string, userId: string) { /* same pattern */ },
    async refundPayment(transactionId: string, userId: string) { /* same pattern */ },
    async createConnectOnboardingLink(userId: string) { /* same pattern */ },
    async checkConnectStatus(userId: string) { /* same pattern */ },
    async getTransactionsByUser(userId: string, page?: number, perPage?: number) { /* same pattern */ },
    async getTransactionByRequest(requestId: string) { /* same pattern */ },
  };
}

// Keep pure utility functions as standalone exports (no DI needed):
export function calculateFees(amount: number) { /* unchanged */ }
export function amountToCents(amount: number) { /* unchanged */ }
export function calculatePaginationOffset(page: number, perPage: number) { /* unchanged */ }
```

Key transformations for each method:
- `return { error: 'Message', status: 404 }` → `throw new ServiceError('Message', 'NOT_FOUND')`
- `return { error: 'Message', status: 403 }` → `throw new ServiceError('Message', 'AUTH')`
- `return { error: 'Message', status: 409 }` → `throw new ServiceError('Message', 'CONFLICT')`
- `return { error: 'Message', status: 500 }` → `throw new ServiceError('Message', 'INTERNAL', originalError)`
- `return { data: result }` → `return result`
- `console.error(...)` → `logger.error(...)`

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: Type errors in routes that import old function names — this is expected, we'll fix routes in Task 11.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/transactions.ts
git commit -m "refactor: convert transactions service to DI factory pattern"
```

---

### Task 9: Refactor verification service to DI factory

**Files:**
- Modify: `src/lib/services/verification.ts`

- [ ] **Step 1: Convert to factory pattern**

Same pattern as Task 8. `verification.ts` uses both `createClient` and `createAdminClient`.

```typescript
export function createVerificationService(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
) {
  return {
    async sendPhoneOtp(userId: string, phone: string) { ... },
    async verifyPhoneOtp(userId: string, phone: string, code: string) { ... },
    async createIdentitySession(userId: string) { ... },
    async handleIdentityVerificationResult(sessionId: string, status: string) { ... },
    async getVerificationStatus(userId: string) { ... },
  };
}
```

Key: `sendPhoneOtp` uses `console.info` for mock OTP logging — replace with `logger.info`.

- [ ] **Step 2: Run typecheck (expect route errors)**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/verification.ts
git commit -m "refactor: convert verification service to DI factory pattern"
```

---

### Task 10: Refactor requests service to DI factory

**Files:**
- Modify: `src/lib/services/requests.ts`

- [ ] **Step 1: Convert to factory pattern**

`requests.ts` is the largest service (674 LOC). It uses `createClient` and `createAdminClient`. It also calls functions from `transactions.ts` (for `capturePayment` in `confirmDelivery`).

```typescript
export function createRequestService(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
) {
  return {
    async createRequest(senderId: string, input: CreateRequestInput) { ... },
    async acceptRequest(requestId: string, travelerId: string) { ... },
    async collectParcel(requestId: string, travelerId: string) { ... },
    async markInTransit(requestId: string, travelerId: string) { ... },
    async markDelivered(requestId: string, travelerId: string) { ... },
    async confirmDelivery(requestId: string, senderId: string, confirmationCode: string) { ... },
    async cancelRequest(requestId: string, userId: string) { ... },
    async openDispute(requestId: string, userId: string, reason: string) { ... },
    async resolveDispute(requestId: string, resolution: 'refund' | 'release') { ... },
    async getRequestsByListing(listingId: string) { ... },
    async getRequestsBySender(senderId: string) { ... },
  };
}

// Keep standalone:
export function calculateFee(amount: number) { /* unchanged */ }
```

**Important:** `confirmDelivery` currently calls `capturePayment()` from transactions. After refactoring, this cross-service call needs to be handled. Two options:
- The route orchestrates both calls (preferred — keeps services independent)
- Inject the transaction service into the request service (couples them)

**Decision: Route orchestration.** Remove the `capturePayment` call from `confirmDelivery` — it should return the transaction ID. The route calls `confirmDelivery` then `capturePayment` sequentially.

- [ ] **Step 2: Run typecheck (expect route errors)**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/requests.ts
git commit -m "refactor: convert requests service to DI factory pattern"
```

---

### Task 11: Update Phase 1 API routes to use factories

**Files:**
- Modify: `src/app/api/transactions/checkout/route.ts`
- Modify: `src/app/api/transactions/refund/route.ts`
- Modify: `src/app/api/transactions/route.ts`
- Modify: `src/app/api/payments/checkout/route.ts`
- Modify: `src/app/api/payments/refund/route.ts`
- Modify: `src/app/api/connect/onboard/route.ts`
- Modify: `src/app/api/connect/status/route.ts`
- Modify: `src/app/api/verification/phone/send/route.ts`
- Modify: `src/app/api/verification/phone/verify/route.ts`
- Modify: `src/app/api/verification/identity/create-session/route.ts`
- Modify: `src/app/api/requests/route.ts`
- Modify: `src/app/api/requests/[id]/route.ts`
- Modify: `src/app/api/requests/[id]/confirm/route.ts`

- [ ] **Step 1: Update transaction routes**

Note: `payments/checkout` and `payments/refund` are legacy aliases for `transactions/checkout` and `transactions/refund`. Both sets call the same service methods — update them all identically.

For each transaction route, apply this pattern:

```typescript
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { createTransactionService } from '@/lib/services';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';
import { getAuthUser, apiError, apiSuccess, parseBody } from '@/lib/api/helpers';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const body = await parseBody(request, checkoutSchema);
  if (!body) return apiError('Données invalides', 400);

  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const stripe = getStripe();
    const service = createTransactionService(supabase, adminSupabase, stripe);
    const data = await service.createCheckoutSession(body.requestId, user.id);
    return apiSuccess(data, 201);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('POST /api/transactions/checkout', error, { userId: user.id });
    return apiError('Erreur interne', 500);
  }
}
```

- [ ] **Step 2: Update verification routes**

Same pattern but with `createVerificationService(supabase, adminSupabase)`.

- [ ] **Step 3: Update request routes**

Same pattern but with `createRequestService(supabase, adminSupabase)`.

**Special case — `requests/[id]/confirm/route.ts`:** This route needs to orchestrate two services:

```typescript
try {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const stripe = getStripe();
  const requestService = createRequestService(supabase, adminSupabase);
  const transactionService = createTransactionService(supabase, adminSupabase, stripe);

  const result = await requestService.confirmDelivery(id, user.id, body.confirmationCode);
  if (result.transactionId) {
    await transactionService.capturePayment(result.transactionId, user.id);
  }
  return apiSuccess(result, 200);
} catch (error) {
  // ... ServiceError handling
}
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors for Phase 1 services and routes.

- [ ] **Step 5: Run tests**

Run: `pnpm test`
Expected: Existing tests may need updating (Task 12).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/transactions/ src/app/api/payments/ src/app/api/connect/ src/app/api/verification/ src/app/api/requests/
git commit -m "refactor: update Phase 1 routes to use service factories with try/catch"
```

---

### Task 12: Update existing transaction tests for new factory pattern

**Files:**
- Modify: `src/lib/services/__tests__/transactions.test.ts`

- [ ] **Step 1: Migrate tests to factory pattern**

The existing tests mock `createClient` and `getStripe` via `vi.mock`. Refactor them to inject mocks via the factory:

```typescript
import { createMockSupabase, asSupabase, createMockStripe, asStripe } from './helpers';
import { createTransactionService } from '../transactions';
import { ServiceError } from '../errors';

// Mock logger (still needed to prevent Sentry import)
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Remove vi.mock for supabase and stripe — no longer needed!

describe('createTransactionService', () => {
  function setup() {
    const supabase = createMockSupabase();
    const adminSupabase = createMockSupabase();
    const stripe = createMockStripe();
    const service = createTransactionService(
      asSupabase(supabase),
      asSupabase(adminSupabase),
      asStripe(stripe),
    );
    return { supabase, adminSupabase, stripe, service };
  }

  describe('createCheckoutSession', () => {
    it('throws NOT_FOUND when request not found', async () => {
      const { supabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.createCheckoutSession('req-1', 'user-1'))
        .rejects.toThrow(ServiceError);
      await expect(service.createCheckoutSession('req-1', 'user-1'))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    // ... migrate remaining tests to use setup() and ServiceError assertions
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run src/lib/services/__tests__/transactions.test.ts`
Expected: All tests PASS with new factory pattern.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/__tests__/transactions.test.ts
git commit -m "test: migrate transaction tests to DI factory pattern"
```

---

### Task 13: Migrate existing verification tests + write new tests

**Files:**
- Create: `src/lib/services/__tests__/verification.test.ts`

- [ ] **Step 1: Migrate existing tests to factory pattern + write new tests**

The file `src/lib/services/__tests__/verification.test.ts` already exists with some tests. Refactor it to use the factory pattern (same approach as Task 12 for transactions), then add new tests for uncovered scenarios.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createVerificationService } from '../verification';
import { ServiceError } from '../errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/email', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(true),
}));

describe('createVerificationService', () => {
  function setup() {
    const supabase = createMockSupabase();
    const adminSupabase = createMockSupabase();
    const service = createVerificationService(asSupabase(supabase), asSupabase(adminSupabase));
    return { supabase, adminSupabase, service };
  }

  describe('sendPhoneOtp', () => {
    it('creates OTP record and returns success', async () => {
      const { adminSupabase, supabase, service } = setup();
      supabase._getChain('profiles').single.mockResolvedValue({
        data: { user_id: 'user-1', phone: null },
        error: null,
      });
      adminSupabase._getChain('phone_verifications').single.mockResolvedValue({
        data: { id: 'v-1' },
        error: null,
      });

      const result = await service.sendPhoneOtp('user-1', '+33612345678');
      expect(result).toBeDefined();
    });

    it('throws VALIDATION for invalid phone format', async () => {
      const { service } = setup();
      await expect(service.sendPhoneOtp('user-1', 'invalid'))
        .rejects.toMatchObject({ code: 'VALIDATION' });
    });
  });

  describe('verifyPhoneOtp', () => {
    it('throws NOT_FOUND when no pending OTP exists', async () => {
      const { adminSupabase, service } = setup();
      adminSupabase._getChain('phone_verifications').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.verifyPhoneOtp('user-1', '+33612345678', '123456'))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws VALIDATION for expired OTP', async () => {
      const { adminSupabase, service } = setup();
      const expired = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      adminSupabase._getChain('phone_verifications').single.mockResolvedValue({
        data: { code: '123456', expires_at: expired, attempts: 0 },
        error: null,
      });

      await expect(service.verifyPhoneOtp('user-1', '+33612345678', '123456'))
        .rejects.toMatchObject({ code: 'VALIDATION' });
    });

    it('throws VALIDATION for wrong code', async () => {
      const { adminSupabase, service } = setup();
      const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      adminSupabase._getChain('phone_verifications').single.mockResolvedValue({
        data: { code: '123456', expires_at: future, attempts: 0 },
        error: null,
      });

      await expect(service.verifyPhoneOtp('user-1', '+33612345678', '000000'))
        .rejects.toMatchObject({ code: 'VALIDATION' });
    });

    it('verifies correct code and updates profile', async () => {
      const { adminSupabase, supabase, service } = setup();
      const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      adminSupabase._getChain('phone_verifications').single.mockResolvedValue({
        data: { id: 'v-1', code: '123456', expires_at: future, attempts: 0 },
        error: null,
      });
      adminSupabase._getChain('phone_verifications').eq.mockResolvedValue({ error: null });
      supabase._getChain('profiles').single.mockResolvedValue({
        data: { user_id: 'user-1', email_verified: true },
        error: null,
      });

      const result = await service.verifyPhoneOtp('user-1', '+33612345678', '123456');
      expect(result).toBeDefined();
    });
  });

  describe('getVerificationStatus', () => {
    it('returns verification levels for a user', async () => {
      const { supabase, service } = setup();
      supabase._getChain('profiles').single.mockResolvedValue({
        data: {
          user_id: 'user-1',
          phone_verified: true,
          id_verification_status: 'verified',
          verification_level: 3,
        },
        error: null,
      });

      const status = await service.getVerificationStatus('user-1');
      expect(status.phone_verified).toBe(true);
      expect(status.verification_level).toBe(3);
    });

    it('throws NOT_FOUND for unknown user', async () => {
      const { supabase, service } = setup();
      supabase._getChain('profiles').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.getVerificationStatus('unknown'))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run src/lib/services/__tests__/verification.test.ts`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/__tests__/verification.test.ts
git commit -m "test: add verification service tests (OTP, KYC, status)"
```

---

### Task 14: Write requests service tests

**Files:**
- Create: `src/lib/services/__tests__/requests.test.ts`

- [ ] **Step 1: Write tests covering the request lifecycle**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createRequestService } from '../requests';
import { ServiceError } from '../errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/email', () => ({
  sendRequestNotificationEmail: vi.fn().mockResolvedValue(true),
  sendDeliveryConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

describe('createRequestService', () => {
  function setup() {
    const supabase = createMockSupabase();
    const adminSupabase = createMockSupabase();
    const service = createRequestService(asSupabase(supabase), asSupabase(adminSupabase));
    return { supabase, adminSupabase, service };
  }

  const mockListing = {
    id: 'listing-1',
    traveler_id: 'traveler-1',
    available_kg: 20,
    price_per_kg: 10,
    departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  };

  describe('createRequest', () => {
    it('creates a request with correct fee calculation', async () => {
      const { supabase, adminSupabase, service } = setup();
      supabase._getChain('listings').single.mockResolvedValue({
        data: mockListing,
        error: null,
      });
      adminSupabase._getChain('requests').single.mockResolvedValue({
        data: { id: 'req-1', status: 'pending', total_price: 50, platform_fee: 5 },
        error: null,
      });

      const result = await service.createRequest('sender-1', {
        listing_id: 'listing-1',
        weight_kg: 5,
        description: 'Colis test',
      });
      expect(result.id).toBe('req-1');
    });

    it('throws NOT_FOUND for non-existent listing', async () => {
      const { supabase, service } = setup();
      supabase._getChain('listings').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.createRequest('sender-1', {
        listing_id: 'nope',
        weight_kg: 5,
        description: 'test',
      })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws CONFLICT when requesting own listing', async () => {
      const { supabase, service } = setup();
      supabase._getChain('listings').single.mockResolvedValue({
        data: { ...mockListing, traveler_id: 'sender-1' },
        error: null,
      });

      await expect(service.createRequest('sender-1', {
        listing_id: 'listing-1',
        weight_kg: 5,
        description: 'test',
      })).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('throws VALIDATION when weight exceeds available kg', async () => {
      const { supabase, service } = setup();
      supabase._getChain('listings').single.mockResolvedValue({
        data: { ...mockListing, available_kg: 3 },
        error: null,
      });

      await expect(service.createRequest('sender-1', {
        listing_id: 'listing-1',
        weight_kg: 5,
        description: 'test',
      })).rejects.toMatchObject({ code: 'VALIDATION' });
    });
  });

  describe('confirmDelivery', () => {
    it('confirms delivery with correct code', async () => {
      const { supabase, adminSupabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: {
          id: 'req-1',
          sender_id: 'sender-1',
          status: 'delivered',
          confirmation_code: '123456',
        },
        error: null,
      });
      adminSupabase._getChain('requests').single.mockResolvedValue({
        data: { id: 'req-1', status: 'confirmed' },
        error: null,
      });

      const result = await service.confirmDelivery('req-1', 'sender-1', '123456');
      expect(result).toBeDefined();
    });

    it('throws VALIDATION with wrong confirmation code', async () => {
      const { supabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: {
          id: 'req-1',
          sender_id: 'sender-1',
          status: 'delivered',
          confirmation_code: '123456',
        },
        error: null,
      });

      await expect(service.confirmDelivery('req-1', 'sender-1', '000000'))
        .rejects.toMatchObject({ code: 'VALIDATION' });
    });

    it('throws AUTH when non-sender tries to confirm', async () => {
      const { supabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: {
          id: 'req-1',
          sender_id: 'sender-1',
          status: 'delivered',
          confirmation_code: '123456',
        },
        error: null,
      });

      await expect(service.confirmDelivery('req-1', 'other-user', '123456'))
        .rejects.toMatchObject({ code: 'AUTH' });
    });
  });

  describe('cancelRequest', () => {
    it('cancels a pending request and restores kg', async () => {
      const { supabase, adminSupabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: {
          id: 'req-1',
          sender_id: 'sender-1',
          status: 'pending',
          listing_id: 'listing-1',
          weight_kg: 5,
        },
        error: null,
      });
      adminSupabase._getChain('requests').single.mockResolvedValue({
        data: { id: 'req-1', status: 'cancelled' },
        error: null,
      });

      const result = await service.cancelRequest('req-1', 'sender-1');
      expect(result).toBeDefined();
    });

    it('throws CONFLICT when trying to cancel a confirmed request', async () => {
      const { supabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: { id: 'req-1', sender_id: 'sender-1', status: 'confirmed' },
        error: null,
      });

      await expect(service.cancelRequest('req-1', 'sender-1'))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('state transitions', () => {
    it('acceptRequest throws CONFLICT if not pending', async () => {
      const { supabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: { id: 'req-1', traveler_id: 'trav-1', status: 'confirmed' },
        error: null,
      });

      await expect(service.acceptRequest('req-1', 'trav-1'))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('markDelivered throws CONFLICT if not in_transit', async () => {
      const { supabase, service } = setup();
      supabase._getChain('requests').single.mockResolvedValue({
        data: { id: 'req-1', traveler_id: 'trav-1', status: 'pending' },
        error: null,
      });

      await expect(service.markDelivered('req-1', 'trav-1'))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm vitest run src/lib/services/__tests__/requests.test.ts`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/__tests__/requests.test.ts
git commit -m "test: add request service tests (lifecycle, state machine, delivery)"
```

---

### Task 15: Update barrel exports for Phase 1

**Files:**
- Modify: `src/lib/services/index.ts`

- [ ] **Step 1: Verify barrel exports include errors**

Ensure `src/lib/services/index.ts` includes:

```typescript
export * from './errors';
export * from './transactions';
export * from './verification';
export * from './requests';
// ... rest unchanged
```

- [ ] **Step 2: Run full test suite + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: All tests pass, no type errors.

- [ ] **Step 3: Commit if changes made**

```bash
git add src/lib/services/index.ts
git commit -m "refactor: update barrel exports for Phase 1 services"
```

---

## Chunk 3: Phase 2 — Core Marketplace (offers, parcels, listings, matching)

### Task 16: Refactor listings service to DI factory

**Files:**
- Modify: `src/lib/services/listings.ts`

- [ ] **Step 1: Convert to factory**

```typescript
export function createListingsService(supabase: SupabaseClient) {
  return {
    async getListings(params) { ... },
    async getListingById(id) { ... },
    async createListing(travelerId, input) { ... },
    async updateListing(id, travelerId, updates) { ... },
    async cancelListing(id, travelerId) { ... },
    async getListingsByTraveler(travelerId) { ... },
  };
}
```

Only needs user-scoped `supabase`. Replace error returns with `ServiceError` throws. Replace `console.*` with `logger.*`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/listings.ts
git commit -m "refactor: convert listings service to DI factory"
```

---

### Task 17: Refactor parcels service to DI factory

**Files:**
- Modify: `src/lib/services/parcels.ts`

- [ ] **Step 1: Convert to factory**

```typescript
export function createParcelsService(supabase: SupabaseClient) {
  return {
    async getParcels(params) { ... },
    async getParcelById(id) { ... },
    async createParcel(senderId, input) { ... },
    async updateParcelStatus(id, senderId, status) { ... },
    async getParcelsBySender(senderId) { ... },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/parcels.ts
git commit -m "refactor: convert parcels service to DI factory"
```

---

### Task 18: Refactor offers service to DI factory

**Files:**
- Modify: `src/lib/services/offers.ts`

- [ ] **Step 1: Convert to factory**

`offers.ts` calls notification functions — these remain as module imports.

```typescript
export function createOffersService(supabase: SupabaseClient) {
  return {
    async getOffersByParcel(parcelId) { ... },
    async createOffer(travelerId, input) { ... },
    async acceptOffer(offerId, senderId) { ... },
    async rejectOffer(offerId, senderId) { ... },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/offers.ts
git commit -m "refactor: convert offers service to DI factory"
```

---

### Task 19: Refactor matching service to DI factory

**Files:**
- Modify: `src/lib/services/matching.ts`

- [ ] **Step 1: Convert to factory**

```typescript
export function createMatchingService(supabase: SupabaseClient) {
  return {
    async findMatchingListings(parcel) { ... },
    async findMatchingParcels(listing) { ... },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/matching.ts
git commit -m "refactor: convert matching service to DI factory"
```

---

### Task 20: Update Phase 2 API routes

**Files:**
- Modify: `src/app/api/listings/route.ts`
- Modify: `src/app/api/listings/[id]/route.ts`
- Modify: `src/app/api/parcels/route.ts`
- Modify: `src/app/api/parcels/[id]/route.ts`
- Modify: `src/app/api/parcels/[id]/offers/route.ts`
- Modify: `src/app/api/parcels/upload/route.ts`

- [ ] **Step 1: Update each route to factory + try/catch pattern**

Same pattern as Task 11 but with `createListingsService(supabase)`, `createParcelsService(supabase)`, `createOffersService(supabase)`.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/listings/ src/app/api/parcels/
git commit -m "refactor: update Phase 2 routes to use service factories"
```

---

**Note for all Phase 2-4 tests (Tasks 21-33):** Follow the exact same pattern as Phase 1 tests (Tasks 13-14): import from `./helpers`, use `createMockSupabase()` + `asSupabase()`, mock logger via `vi.mock('@/lib/logger')`, assert `ServiceError` codes on error paths. Each test uses a `setup()` function that creates mock clients and instantiates the service factory.

### Task 21: Write Phase 2 tests — listings

**Files:**
- Create: `src/lib/services/__tests__/listings.test.ts`

- [ ] **Step 1: Write tests**

Test scenarios:
- `getListings`: returns paginated results, handles empty results, filters by country
- `getListingById`: returns listing, throws NOT_FOUND
- `createListing`: creates listing, validates departure date is in future
- `updateListing`: updates listing, throws AUTH for non-owner
- `cancelListing`: cancels listing, throws AUTH for non-owner

~8 tests.

- [ ] **Step 2: Run and verify**

Run: `pnpm vitest run src/lib/services/__tests__/listings.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/__tests__/listings.test.ts
git commit -m "test: add listings service tests"
```

---

### Task 22: Write Phase 2 tests — parcels

**Files:**
- Create: `src/lib/services/__tests__/parcels.test.ts`

- [ ] **Step 1: Write tests**

Test scenarios:
- `getParcels`: pagination, filtering
- `createParcel`: creation, max weight validation (30kg)
- `updateParcelStatus`: status transitions, auth checks

~6 tests.

- [ ] **Step 2: Run and verify, then commit**

```bash
git add src/lib/services/__tests__/parcels.test.ts
git commit -m "test: add parcels service tests"
```

---

### Task 23: Write Phase 2 tests — offers

**Files:**
- Create: `src/lib/services/__tests__/offers.test.ts`

- [ ] **Step 1: Write tests**

Test scenarios:
- `createOffer`: creates offer, throws CONFLICT for own parcel
- `acceptOffer`: accepts offer, rejects others, updates parcel status
- `rejectOffer`: rejects offer, throws AUTH for non-sender

~6 tests.

- [ ] **Step 2: Run and verify, then commit**

```bash
git add src/lib/services/__tests__/offers.test.ts
git commit -m "test: add offers service tests"
```

---

### Task 24: Write Phase 2 tests — matching

**Files:**
- Create: `src/lib/services/__tests__/matching.test.ts`

- [ ] **Step 1: Write tests**

Test scenarios:
- `findMatchingListings`: scores correctly (city > country), weight capacity, date alignment
- `findMatchingParcels`: same scoring logic in reverse
- Returns top 5 sorted by score
- Handles no matches

~5 tests.

- [ ] **Step 2: Run and verify, then commit**

```bash
git add src/lib/services/__tests__/matching.test.ts
git commit -m "test: add matching service tests"
```

---

### Task 25: Phase 2 integration check

- [ ] **Step 1: Run full suite**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: All pass.

- [ ] **Step 2: Commit any fixes**

---

## Chunk 4: Phase 3 & 4 — UX Services + Back-office

### Task 26: Refactor messages service to DI factory

**Files:**
- Modify: `src/lib/services/messages.ts`

- [ ] **Step 1: Convert to factory**

```typescript
export function createMessagesService(supabase: SupabaseClient) {
  return {
    async getOrCreateConversation(userId1, userId2, requestId?) { ... },
    async getConversations(userId) { ... },
    async getMessages(conversationId, limit?, before?) { ... },
    async sendMessage(senderId, conversationId, content, contentType?, mediaUrl?) { ... },
    async markMessagesAsRead(conversationId, userId) { ... },
    async getUnreadCount(userId) { ... },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/messages.ts
git commit -m "refactor: convert messages service to DI factory"
```

---

### Task 27: Refactor notifications service to DI factory

**Files:**
- Modify: `src/lib/services/notifications.ts`

- [ ] **Step 1: Convert to factory**

`notifications.ts` uses `createAdminClient` for creating notifications (bypasses RLS).

```typescript
export function createNotificationsService(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
) {
  return {
    async getNotifications(userId, page?, perPage?) { ... },
    async markNotificationsAsRead(userId, notificationIds) { ... },
    async createNotification(userId, type, title, body, data?) { ... },
    async getUnreadNotificationCount(userId) { ... },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/notifications.ts
git commit -m "refactor: convert notifications service to DI factory"
```

---

### Task 28: Refactor push, reviews, profiles, corridors services

**Files:**
- Modify: `src/lib/services/push.ts`
- Modify: `src/lib/services/reviews.ts`
- Modify: `src/lib/services/profiles.ts`
- Modify: `src/lib/services/corridors.ts`

- [ ] **Step 1: Convert push.ts**

```typescript
export function createPushService(supabase: SupabaseClient) { ... }
```

- [ ] **Step 2: Convert reviews.ts**

```typescript
export function createReviewsService(supabase: SupabaseClient) { ... }
```

- [ ] **Step 3: Convert profiles.ts**

```typescript
export function createProfilesService(supabase: SupabaseClient) { ... }
```

- [ ] **Step 4: Convert corridors.ts**

```typescript
export function createCorridorsService(supabase: SupabaseClient) { ... }
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/push.ts src/lib/services/reviews.ts src/lib/services/profiles.ts src/lib/services/corridors.ts
git commit -m "refactor: convert push, reviews, profiles, corridors to DI factories"
```

---

### Task 29: Refactor admin service to DI factory

**Files:**
- Modify: `src/lib/services/admin.ts`

- [ ] **Step 1: Convert to factory**

`admin.ts` uses `createAdminClient` extensively.

```typescript
export function createAdminService(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
) {
  return {
    async requireAdmin() { ... },
    async getAdminStats() { ... },
    async listUsers(page?, perPage?, search?) { ... },
    async listDisputes(page?, perPage?) { ... },
    async listTransactions(page?, perPage?) { ... },
    async toggleUserBan(userId, banned) { ... },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/admin.ts
git commit -m "refactor: convert admin service to DI factory"
```

---

### Task 30: Update Phase 3 & 4 API routes

**Files:**
- Modify: `src/app/api/messages/route.ts`
- Modify: `src/app/api/conversations/route.ts`
- Modify: `src/app/api/conversations/[id]/messages/route.ts`
- Modify: `src/app/api/notifications/route.ts`
- Modify: `src/app/api/notifications/subscribe/route.ts`
- Modify: `src/app/api/reviews/route.ts`
- Modify: `src/app/api/reviews/[userId]/route.ts`
- Modify: `src/app/api/profile/route.ts`
- Modify: `src/app/api/profile/[id]/route.ts`
- Modify: `src/app/api/profile/avatar/route.ts`
- Modify: `src/app/api/corridors/route.ts`
- Modify: `src/app/api/admin/stats/route.ts`
- Modify: `src/app/api/admin/users/route.ts`
- Modify: `src/app/api/admin/disputes/route.ts`
- Modify: `src/app/api/admin/transactions/route.ts`
- Modify: `src/app/api/chat/upload/route.ts`

- [ ] **Step 1: Update each route to factory + try/catch pattern**

Apply the standard pattern from the spec to all routes. Admin routes use `createAdminService(supabase, adminSupabase)`.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/messages/ src/app/api/conversations/ src/app/api/notifications/ src/app/api/reviews/ src/app/api/profile/ src/app/api/corridors/ src/app/api/admin/ src/app/api/chat/
git commit -m "refactor: update Phase 3 & 4 routes to use service factories"
```

---

### Task 31: Write Phase 3 tests — messages

**Files:**
- Create: `src/lib/services/__tests__/messages.test.ts`

- [ ] **Step 1: Write tests**

~5 tests: getOrCreateConversation (creates new, returns existing), sendMessage, markAsRead, getUnreadCount.

- [ ] **Step 2: Run and commit**

```bash
git add src/lib/services/__tests__/messages.test.ts
git commit -m "test: add messages service tests"
```

---

### Task 32: Write Phase 3 tests — notifications, push, reviews

**Files:**
- Create: `src/lib/services/__tests__/notifications.test.ts`
- Create: `src/lib/services/__tests__/push.test.ts`
- Create: `src/lib/services/__tests__/reviews.test.ts`

- [ ] **Step 1: Write notification tests** (~4 tests)

getNotifications pagination, createNotification, markAsRead, getUnreadCount.

- [ ] **Step 2: Write push tests** (~3 tests)

saveSubscription, removeSubscription, sendPushToUser (handles 410 cleanup).

- [ ] **Step 3: Write review tests** (~4 tests)

createReview (happy path, duplicate prevention, review before delivery throws CONFLICT), getReviewsByUser.

- [ ] **Step 4: Run and commit**

```bash
git add src/lib/services/__tests__/notifications.test.ts src/lib/services/__tests__/push.test.ts src/lib/services/__tests__/reviews.test.ts
git commit -m "test: add notifications, push, and reviews service tests"
```

---

### Task 33: Write Phase 4 tests — profiles, corridors, admin

**Files:**
- Create: `src/lib/services/__tests__/profiles.test.ts`
- Create: `src/lib/services/__tests__/corridors.test.ts`
- Create: `src/lib/services/__tests__/admin.test.ts`

- [ ] **Step 1: Write profile tests** (~3 tests)

getProfileByUserId (found, not found), updateProfile.

- [ ] **Step 2: Write corridor tests** (~2 tests)

getCorridors returns aggregated data, handles empty.

- [ ] **Step 3: Write admin tests** (~5 tests)

requireAdmin (admin, non-admin), getAdminStats, listUsers with search, toggleUserBan.

- [ ] **Step 4: Run and commit**

```bash
git add src/lib/services/__tests__/profiles.test.ts src/lib/services/__tests__/corridors.test.ts src/lib/services/__tests__/admin.test.ts
git commit -m "test: add profiles, corridors, and admin service tests"
```

---

### Task 34: Update barrel exports for all phases

**Files:**
- Modify: `src/lib/services/index.ts`

- [ ] **Step 1: Ensure all services are exported**

```typescript
export * from './errors';
export * from './listings';
export * from './requests';
export * from './reviews';
export * from './messages';
export * from './profiles';
export * from './notifications';
export * from './corridors';
export * from './transactions';
export * from './verification';
export * from './parcels';
export * from './offers';
export * from './matching';
export * from './admin';
export * from './push';
```

- [ ] **Step 2: Commit if changed**

```bash
git add src/lib/services/index.ts
git commit -m "refactor: finalize barrel exports for all service factories"
```

---

### Task 35: Replace remaining console.* calls

- [ ] **Step 1: Search for remaining console.* in services and routes**

Run: `grep -rn "console\.\(error\|warn\|info\|log\)" src/lib/services/ src/app/api/`

- [ ] **Step 2: Replace each with logger equivalent**

- `console.error(...)` → `logger.error(...)`
- `console.warn(...)` → `logger.warn(...)`
- `console.info(...)` → `logger.info(...)`
- `console.log(...)` → `logger.info(...)` (or remove if debug-only)

Add `import { logger } from '@/lib/logger'` where missing.

**Important:** Include webhook routes in this sweep:
- `src/app/api/webhooks/stripe/route.ts` — has ~5 `console.error` calls
- `src/app/api/webhooks/stripe-identity/route.ts` — has ~3 `console.error` calls
- `src/app/api/locale/route.ts` — check for any console.* calls

Webhook routes keep their existing structure (they don't use service factories since they receive Stripe events), but they must use `logger.*` instead of `console.*`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/ src/app/api/
git commit -m "refactor: replace all console.* with centralized logger"
```

---

### Task 36: Final validation

- [ ] **Step 1: Run full quality gates locally**

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
```

Expected: All 5 gates pass.

- [ ] **Step 2: Run test coverage**

Run: `pnpm test:coverage`
Expected: 70+ tests, coverage across all services.

- [ ] **Step 3: Fix any failures**

Address any remaining issues.

- [ ] **Step 4: Final commit (if fixes were needed)**

```bash
git add src/
git commit -m "chore: final production readiness fixes — all quality gates pass"
```
