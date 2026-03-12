# Akiri — Production Readiness Refactoring

**Date:** 2026-03-13
**Status:** Approved
**Objective:** Align Akiri with production-grade SaaS standards, using ATTABL patterns as reference.
**Repo:** https://github.com/thefrankalbert/akiri_saas.git
**Deployment:** Vercel (test environment)

---

## Context

Akiri is a collaborative parcel transport marketplace for the African diaspora. Comparative analysis with ATTABL (a sibling SaaS on the same stack) revealed gaps in CI/CD, service architecture, testing, logging, and error handling. This spec defines the full refactoring plan to close those gaps.

### Current State (Akiri)

| Area | State |
|------|-------|
| CI/CD | None — relies on Vercel auto-deploy |
| Services | 14 service files, stateless functions, direct Supabase imports |
| Error handling | `apiError()`/`apiSuccess()` helpers in routes — good but ad-hoc in services |
| Tests | 5 test files (Vitest), coverage on 5 files only |
| Logging | `console.*` throughout |
| Middleware | Auth + rate limiting via Upstash Redis — functional |
| API Routes | 43 routes, manual error checking on service return values |

### Target State

| Area | Target |
|------|--------|
| CI/CD | GitHub Actions — 5 sequential quality gates |
| Services | Factory pattern with dependency injection (SupabaseClient injected) |
| Error handling | `ServiceError` class with typed codes, mapped to HTTP in routes |
| Tests | 70+ tests, written alongside each service migration |
| Logging | Centralized logger — console in dev, Sentry in prod |
| Middleware | Unchanged (already functional) |
| API Routes | Thin controllers — try/catch with ServiceError |

---

## 1. CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

Single workflow with 5 sequential quality gates:

```
typecheck → lint → format:check → test → build
```

### Triggers
- `push` on all branches
- `pull_request` targeting `main`

### Key features
- Concurrency control: cancel in-progress runs on same branch
- pnpm cache for fast installs (`pnpm/action-setup@v4`)
- Node.js 20
- Build step injects all required secrets via `${{ secrets.* }}`

### Required GitHub Secrets
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Package.json addition
- Add `"format:check": "prettier --check ."` script if not present

---

## 2. Centralized Logger

**File:** `src/lib/logger.ts`

### Interface

```typescript
export const logger = {
  error(message: string, error?: unknown, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
}
```

### Behavior

| Method | Development | Production |
|--------|-------------|------------|
| `error` | `console.error` with `[ERROR]` prefix | `Sentry.captureException` (Error) or `Sentry.captureMessage` (other) |
| `warn` | `console.warn` with `[WARN]` prefix | `Sentry.captureMessage` with level `warning` |
| `info` | `console.info` with `[INFO]` prefix | `Sentry.addBreadcrumb` with level `info` |

### Migration
- Replace all `console.error`, `console.warn`, `console.info` in services and routes with `logger.*`
- Sentry is already configured in Akiri — no additional setup needed

---

## 3. ServiceError

**File:** `src/lib/services/errors.ts`

### Implementation

```typescript
export type ServiceErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'INTERNAL' | 'AUTH'

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

### Usage in services
- Services throw `ServiceError` instead of returning `{ error, status }` tuples
- Error messages remain in French (user-facing)
- `details` field holds technical context (logged, never sent to client)

### Coexistence with existing helpers
- `apiError()` / `apiSuccess()` / `parseBody()` / `getAuthUser()` remain unchanged
- `ServiceError` is the service-layer mechanism; `apiError` is the route-layer response builder

---

## 4. Service Layer Refactoring — Dependency Injection

### Pattern

Every service file converts from stateless exported functions to a factory that accepts `SupabaseClient`:

```typescript
// Before
import { createClient } from '@/lib/supabase/server';
export async function doSomething(id: string) {
  const supabase = await createClient();
  // ...
}

// After
import type { SupabaseClient } from '@supabase/supabase-js';
import { ServiceError } from './errors';
import { logger } from '@/lib/logger';

export function createSomethingService(supabase: SupabaseClient) {
  return {
    async doSomething(id: string) {
      // supabase injected, not imported
      // throws ServiceError on failure
      // uses logger.* for logging
    },
  };
}
```

### Migration order (by business criticality)

| Phase | Services | Rationale |
|-------|----------|-----------|
| 1 | `transactions.ts`, `verification.ts`, `requests.ts` | Money + KYC — zero tolerance for bugs |
| 2 | `offers.ts`, `parcels.ts`, `listings.ts`, `matching.ts` | Core marketplace flow |
| 3 | `messages.ts`, `notifications.ts`, `push.ts`, `reviews.ts` | User experience |
| 4 | `profiles.ts`, `corridors.ts`, `admin.ts` | Support / back-office |

### Per-service checklist
- [ ] Convert to factory function with `supabase: SupabaseClient` parameter
- [ ] Replace `console.*` with `logger.*`
- [ ] Replace return `{ error, status }` with throw `ServiceError`
- [ ] Update barrel exports in `index.ts`
- [ ] Update corresponding API route(s) to use factory + try/catch
- [ ] Write tests (see Section 5)

### Services with Stripe dependency
`transactions.ts` also depends on Stripe. The factory accepts both:

```typescript
export function createTransactionService(supabase: SupabaseClient, stripe: Stripe) {
  return { ... };
}
```

This makes Stripe mockable in tests as well.

---

## 5. Testing Strategy

### Framework
Vitest (already configured). Extend `vitest.config.ts` coverage to include all service files.

### Test infrastructure

**Shared helpers** in `src/lib/services/__tests__/helpers.ts`:

```typescript
// createMockSupabase() — returns mock with chainable .from().select().eq() etc.
// asSupabase(mock) — casts mock to SupabaseClient for type safety
// createMockStripe() — returns mock Stripe client for transaction tests
```

**Standard mocks:**
- `vi.mock('@/lib/logger')` — prevents Sentry imports in tests
- Mock Supabase injected via factory (no global vi.mock needed for client)

### Test targets per phase

| Phase | Services | Est. tests | Key scenarios |
|-------|----------|------------|---------------|
| 1 | transactions, verification, requests | ~25 | Checkout creation (escrow), payment capture, refunds, payouts, OTP send/verify, request lifecycle (pending → confirmed → delivered) |
| 2 | offers, parcels, listings, matching | ~20 | CRUD operations, search/filter, offer acceptance/rejection, matching algorithm |
| 3 | messages, notifications, push, reviews | ~15 | Message sending, notification creation, push subscription, review creation with validation |
| 4 | profiles, corridors, admin | ~10 | Profile updates, corridor listing, admin stats, user ban/unban |

**Total: 70+ tests**

### What each test covers
- Happy path
- Validation errors (bad input)
- Database errors (Supabase failures)
- Business rule violations (e.g., double capture, review before delivery)
- Edge cases (e.g., max weight exceeded, expired OTP)

---

## 6. API Route Updates

### Pattern (uniform across all 43 routes)

```typescript
export async function POST(request: NextRequest) {
  // 1. Auth (unchanged)
  const user = await getAuthUser();
  if (!user) return apiError('Non autorise', 401);

  // 2. Validation (unchanged)
  const body = await parseBody(request, schema);
  if (!body) return apiError('Donnees invalides', 400);

  // 3. Service call (new pattern)
  try {
    const supabase = await createClient();
    const service = createXxxService(supabase);
    const data = await service.doSomething(user.id, body);
    return apiSuccess(data, 201);
  } catch (error) {
    if (error instanceof ServiceError) {
      return apiError(error.message, serviceErrorToStatus(error.code));
    }
    logger.error('Unexpected error in POST /api/xxx', error, { userId: user.id });
    return apiError('Erreur interne', 500);
  }
}
```

### What stays the same
- `apiError()` / `apiSuccess()` helpers
- `parseBody()` / `parseSearchParams()` with Zod
- `getAuthUser()` auth check
- Middleware (auth + rate limiting)
- Zod schemas

### What changes
- Service instantiation via factory instead of direct function import
- Error handling via try/catch instead of result inspection
- `console.*` replaced by `logger.*`

---

## Out of Scope

- Database schema changes
- New features or UI changes
- Middleware refactoring (already functional)
- E2E tests (future iteration)
- OpenAPI/Swagger documentation (P3, deferred)

---

## Dependencies

- Sentry SDK already installed in Akiri
- Vitest already configured
- pnpm as package manager
- GitHub repo: `thefrankalbert/akiri_saas`
- GitHub Secrets must be configured before CI/CD works
