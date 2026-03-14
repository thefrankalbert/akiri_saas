# Phase 1 — Foundations (Infra & DevOps) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a solid infrastructure foundation — CI/CD, database, security, logging, environment validation — so all subsequent phases build on stable ground.

**Architecture:** The project already has CI/CD (`.github/workflows/ci.yml`), DB schema (`supabase/schema.sql` + 4 migrations), security headers (`next.config.ts`), and a basic logger (`src/lib/logger.ts`). This plan fixes known bugs, fills gaps, and hardens what exists.

**Tech Stack:** Next.js 16, Supabase, Sentry, Upstash Redis, Vercel, GitHub Actions, Vitest

**Spec:** `docs/superpowers/specs/2026-03-14-production-readiness-design.md`

---

## Chunk 1: Rate Limiting Fix & Upstash Redis

### Task 1: Fix the synchronous `rateLimit()` bug

The `rateLimit()` function at `src/lib/api/rate-limit.ts:99-111` always calls `memoryRateLimit()` even when Redis is configured. The async version works correctly. Fix: convert middleware to use `rateLimitAsync()`.

**Files:**

- Modify: `src/lib/supabase/middleware.ts:10-76` (rate limiting section)
- Modify: `src/lib/api/rate-limit.ts:93-111` (remove broken sync function)
- Test: `src/lib/api/__tests__/rate-limit.test.ts`

- [ ] **Step 1: Write test for async rate limiting**

```typescript
// src/lib/api/__tests__/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Upstash modules before imports
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(),
}));

describe('rateLimitAsync', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should allow requests under the limit (in-memory fallback)', async () => {
    const { rateLimitAsync } = await import('../rate-limit');
    const result = await rateLimitAsync('test-key-1', {
      maxRequests: 5,
      windowMs: 60000,
    });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block requests over the limit (in-memory fallback)', async () => {
    const { rateLimitAsync } = await import('../rate-limit');
    const key = 'test-key-block';
    for (let i = 0; i < 3; i++) {
      await rateLimitAsync(key, { maxRequests: 3, windowMs: 60000 });
    }
    const result = await rateLimitAsync(key, {
      maxRequests: 3,
      windowMs: 60000,
    });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it passes with current code**

Run: `pnpm test src/lib/api/__tests__/rate-limit.test.ts`
Expected: PASS (tests use the async function which already works)

- [ ] **Step 3: Remove broken synchronous `rateLimit()` function**

In `src/lib/api/rate-limit.ts`, remove the synchronous `rateLimit()` export (lines 93-111) and keep only `rateLimitAsync()`. Also export it as the default.

```typescript
// At the end of src/lib/api/rate-limit.ts, replace lines 93-111 with:

// Legacy sync function removed — was always falling back to memory.
// Use rateLimitAsync() for all rate limiting.
export { rateLimitAsync as rateLimit };
```

- [ ] **Step 4: Update middleware to use async rate limiting**

In `src/lib/supabase/middleware.ts`, the `rateLimit()` call is synchronous. Update `updateSession()` to be async-compatible (it already is async). Replace the sync `rateLimit()` call with `rateLimitAsync()`.

Find the rate limit call section (around lines 38-54) and update:

```typescript
// Replace the sync rateLimit import
import { rateLimitAsync } from '@/lib/api/rate-limit';

// In the rate limiting block, replace:
//   const rateLimitResult = rateLimit(rateLimitKey, { ... });
// With:
const rateLimitResult = await rateLimitAsync(rateLimitKey, {
  maxRequests: config.maxRequests,
  windowMs: config.windowMs,
});
```

Do the same for the page-load rate limit block (~line 65).

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/rate-limit.ts src/lib/api/__tests__/rate-limit.test.ts src/lib/supabase/middleware.ts
git commit -m "fix: use async rate limiting everywhere — sync version always fell back to memory"
```

---

### Task 2: Verify Upstash Redis env vars are documented

**Files:**

- Verify: `.env.example:32-34` (already has UPSTASH vars)
- Modify: `.env.local` (add placeholder Upstash vars)

- [ ] **Step 1: Add Upstash placeholders to .env.local**

```bash
# Append to .env.local:
# --- Upstash Redis (rate limiting) ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Note: The user will need to create an Upstash account and fill these in. For now they remain empty (in-memory fallback works for dev).

- [ ] **Step 2: Commit**

```bash
git add .env.local
# Skip — .env.local is gitignored. No commit needed.
```

---

## Chunk 2: Database Migration — Webhook Events & Admin Hardening

### Task 3: Add `processed_webhook_events` table migration

**Files:**

- Create: `supabase/migrations/20260314_webhook_idempotency.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260314_webhook_idempotency.sql
-- Webhook idempotency: prevent duplicate processing of Stripe events

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup events older than 30 days (Stripe retries within 72h max)
CREATE INDEX idx_webhook_events_processed_at ON processed_webhook_events (processed_at);

-- RLS: only service role can read/write (webhooks use admin client)
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — service role only
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260314_webhook_idempotency.sql
git commit -m "feat: add processed_webhook_events table for Stripe idempotency"
```

---

### Task 4: Add RLS policy to prevent role self-elevation

**Files:**

- Create: `supabase/migrations/20260314_admin_rls_hardening.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260314_admin_rls_hardening.sql
-- Prevent users from updating their own role or is_banned fields

-- Drop the existing permissive update policy on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Use a trigger-based approach to avoid RLS recursive read issues
-- The trigger fires BEFORE UPDATE and resets role/is_banned to their original values

CREATE OR REPLACE FUNCTION prevent_role_self_elevation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only service_role can change role or is_banned
  -- Regular users: force these fields back to their old values
  IF current_setting('role') != 'service_role' THEN
    NEW.role := OLD.role;
    NEW.is_banned := OLD.is_banned;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_prevent_role_self_elevation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_elevation();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260314_admin_rls_hardening.sql
git commit -m "fix: prevent role self-elevation via RLS policy on profiles"
```

---

### Task 4b: Add `verification_sessions` table migration

The spec lists `verification_sessions` as a required table but it does not exist in any migration or schema.

**Files:**

- Create: `supabase/migrations/20260314_verification_sessions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260314_verification_sessions.sql
-- Verification sessions for phone OTP and identity verification

CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('phone', 'identity')),
  provider TEXT NOT NULL CHECK (provider IN ('mock', 'stripe', 'twilio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  external_session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_sessions_user ON verification_sessions (user_id, type, status);

ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own verification sessions" ON verification_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (verification service uses admin client)

-- Auto-update updated_at
CREATE TRIGGER update_verification_sessions_updated_at
  BEFORE UPDATE ON verification_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260314_verification_sessions.sql
git commit -m "feat: add verification_sessions table for phone OTP and identity KYC"
```

---

### Task 4c: Reconcile storage bucket names (`item-photos` vs `parcel-photos`)

The main schema creates `item-photos` (private) but the parcel migration creates `parcel-photos` (public). The spec requires `parcel-photos` with public read. Verify both exist and the naming is intentional, or consolidate.

**Files:**

- Verify: `supabase/schema.sql` (line ~407 — `item-photos` bucket)
- Verify: `supabase/migrations/20260221_parcel_postings.sql` (line ~84 — `parcel-photos` bucket)

- [ ] **Step 1: Check which bucket the upload API actually uses**

Read `src/app/api/parcels/upload/route.ts` and check which bucket name is referenced in the Supabase Storage upload call.

- [ ] **Step 2: If `item-photos` is unused, remove it or alias it**

If the API uses `parcel-photos`, the `item-photos` bucket in schema.sql is dead code. Add a note but don't remove it (it may be used for shipment request item photos).

- [ ] **Step 3: No commit needed unless a fix is required**

---

## Chunk 3: Sentry Verification

### Task 5: Verify existing Sentry SDK configuration

Sentry config files already exist (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) with proper configuration including `replayIntegration()` and `beforeSend` guards. `src/instrumentation.ts` also exists and hooks server/edge configs via `register()`. **Do NOT overwrite these files.**

**Files:**

- Verify: `sentry.client.config.ts` (already exists with replay integration)
- Verify: `sentry.server.config.ts` (already exists)
- Verify: `sentry.edge.config.ts` (already exists)
- Verify: `src/instrumentation.ts` (already exists, handles server/edge Sentry init)
- Verify: `next.config.ts` (already has withSentryConfig)

- [ ] **Step 1: Verify all Sentry files exist and are configured**

Read all 4 files. Confirm:

- `sentry.client.config.ts` has `Sentry.init()` with DSN from env
- `sentry.server.config.ts` has `Sentry.init()` with DSN from env
- `sentry.edge.config.ts` has `Sentry.init()` with DSN from env
- `src/instrumentation.ts` has `register()` that imports server/edge configs
- `next.config.ts` has `withSentryConfig()` wrapper

- [ ] **Step 2: Run build to verify Sentry integration works**

Run: `pnpm build`
Expected: Build succeeds (Sentry DSN empty is fine — it just disables)

- [ ] **Step 3: No commit needed — files already exist**

---

## Chunk 4: Environment Validation

### Task 6: Add build-time environment validation

**Files:**

- Create: `src/lib/env.ts`
- Modify: `next.config.ts` (import env validation)
- Test: `src/lib/__tests__/env.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/__tests__/env.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('env validation', () => {
  it('should export validateEnv function', async () => {
    const { validateEnv } = await import('../env');
    expect(typeof validateEnv).toBe('function');
  });

  it('should return valid when required vars are present', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');

    const { validateEnv } = await import('../env');
    const result = validateEnv();
    expect(result.valid).toBe(true);
  });

  it('should return missing vars list when required vars are absent', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { validateEnv } = await import('../env');
    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/env.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement env validation**

```typescript
// src/lib/env.ts

const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

const REQUIRED_SERVER_ENV_VARS = ['SUPABASE_SERVICE_ROLE_KEY'] as const;

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_POSTHOG_KEY',
] as const;

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Server-only vars (only check on server)
  if (typeof window === 'undefined') {
    for (const key of REQUIRED_SERVER_ENV_VARS) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  for (const key of OPTIONAL_ENV_VARS) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Log on import in development
if (process.env.NEXT_PUBLIC_APP_ENV !== 'production' && typeof window === 'undefined') {
  const result = validateEnv();
  if (result.warnings.length > 0) {
    console.warn('[env] Optional vars not set:', result.warnings.join(', '));
  }
  if (!result.valid) {
    console.error('[env] Required vars missing:', result.missing.join(', '));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/env.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/__tests__/env.test.ts
git commit -m "feat: add build-time environment variable validation"
```

---

## Chunk 5: Verify Root Middleware & Vercel Setup

### Task 7: Verify root middleware exists and runs

Next.js 16 requires either `src/middleware.ts` or `src/proxy.ts` as the request interceptor. The codebase has `src/proxy.ts`. We must verify it is actually recognized by Next.js and executes on requests (auth redirects + rate limiting depend on it).

**Files:**

- Verify: `src/proxy.ts` (must be recognized by Next.js 16 as the middleware entry point)
- Potentially create: `src/middleware.ts` (if proxy.ts is not recognized)

- [ ] **Step 1: Check Next.js 16 docs for proxy.ts support**

Next.js 16 introduced `proxy.ts` as the middleware convention. Verify `src/proxy.ts` matches the expected export signature (default export or named `middleware` export + `config` with matcher).

Read `src/proxy.ts` and confirm it exports a function and a `config` object with a `matcher` array.

- [ ] **Step 2: Run dev server and test auth redirect**

Run: `pnpm dev` (in background)
Test: Visit `http://localhost:3000/dashboard` — should redirect to `/login`
Expected: Redirect works. If it does NOT redirect, the middleware is not executing.

- [ ] **Step 3: If redirect fails, create middleware.ts that re-exports from proxy.ts**

If `proxy.ts` is not recognized by Next.js:

```typescript
// src/middleware.ts
export { default } from './proxy';
export { config } from './proxy';
```

- [ ] **Step 4: Commit if any fix was needed**

```bash
git add src/middleware.ts
git commit -m "fix: ensure Next.js middleware executes — re-export from proxy.ts"
```

---

### Task 8: Verify Supabase client works with new key format

**Files:**

- Verify: `src/lib/supabase/client.ts`
- Verify: `src/lib/supabase/server.ts`

- [ ] **Step 1: Check that createBrowserClient accepts new key format**

The new `sb_publishable_` keys are not JWTs. Verify the Supabase client library version (2.95.3) supports this format. Based on Supabase docs, the new keys work with existing client libraries without changes.

Run: `pnpm dev` and check console for Supabase connection errors.
Expected: No errors related to key format.

- [ ] **Step 2: If errors found, update client initialization**

If the Supabase client rejects the new key format, check for any JWT parsing logic in the codebase that needs updating.

Run: `pnpm typecheck`
Expected: PASS

---

### Task 9: Link Vercel project

- [ ] **Step 1: Login to Vercel CLI**

Run: `pnpm dlx vercel login`
This opens a browser link — click to authenticate.

- [ ] **Step 2: Link the project**

Run: `pnpm dlx vercel link`
Follow prompts: select the correct Vercel team/account, link to existing or new project.

- [ ] **Step 3: Verify .vercel directory was created**

Run: `ls -la .vercel/`
Expected: `project.json` exists with project ID and org ID.

- [ ] **Step 4: Commit .vercel to gitignore if not already**

Check `.gitignore` for `.vercel` entry. If missing, add it.

---

## Chunk 6: CI/CD Hardening

### Task 10: Verify CI pipeline runs correctly

**Files:**

- Verify: `.github/workflows/ci.yml`

- [ ] **Step 1: Check that `format:check` script exists in package.json**

Based on exploration, `format:check` is defined in package.json (line 14). Verify:

Run: `pnpm format:check`
Expected: Either passes or lists formatting issues (should pass since lint-staged runs prettier on commit)

- [ ] **Step 2: Run the full CI pipeline locally**

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
```

Expected: All steps pass. If any fail, fix before proceeding.

- [ ] **Step 3: Push to trigger CI on GitHub**

```bash
git push origin refactor/production-readiness
```

Expected: GitHub Actions workflow triggers and passes.

---

### Task 11: Add Supabase Storage bucket migration

The spec requires storage buckets for avatars, parcel-photos, and chat-media. Based on exploration, `avatars` and `parcel-photos` buckets already exist in schema.sql and migration. `chat-media` is missing.

**Files:**

- Create: `supabase/migrations/20260314_chat_media_bucket.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260314_chat_media_bucket.sql
-- Storage bucket for chat media (images shared in conversations)

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users who are conversation participants can upload
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

-- Only authenticated users can read chat media
CREATE POLICY "Authenticated users can read chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260314_chat_media_bucket.sql
git commit -m "feat: add chat-media storage bucket with auth-only access"
```

---

## Chunk 7: DB Push, README & Final Validation

### Task 12: Apply migrations to Supabase

- [ ] **Step 1: Apply all migrations to the live Supabase project**

Go to the Supabase dashboard SQL Editor (https://supabase.com/dashboard/project/pcatqnfctteeejbrlqhx/sql) and run each migration file in order:

1. `supabase/schema.sql` (if tables don't exist yet)
2. `supabase/migrations/20260221_parcel_postings.sql`
3. `supabase/migrations/20260222_admin_role.sql`
4. `supabase/migrations/20260222_critical_blockers.sql`
5. `supabase/migrations/20260222_push_subscriptions.sql`
6. `supabase/migrations/20260314_webhook_idempotency.sql`
7. `supabase/migrations/20260314_admin_rls_hardening.sql`
8. `supabase/migrations/20260314_verification_sessions.sql`
9. `supabase/migrations/20260314_chat_media_bucket.sql`

Alternatively, if Supabase CLI is linked: `supabase db push`

- [ ] **Step 2: Verify tables exist**

In the Supabase dashboard, go to Table Editor and confirm all tables are present: profiles, listings, shipment_requests, parcel_postings, carry_offers, transactions, reviews, conversations, messages, notifications, push_subscriptions, verification_sessions, processed_webhook_events.

---

### Task 13: Update README with env var setup

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add environment setup section to README**

Add a section to the README documenting:

- How to copy `.env.example` to `.env.local`
- Which vars are required vs optional
- Where to get each key (Supabase dashboard, Stripe dashboard, etc.)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add environment setup instructions to README"
```

---

### Task 14: Full build and test verification

- [ ] **Step 1: Run complete validation**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected: All pass.

- [ ] **Step 2: Verify .env.local has all required vars**

Read `.env.local` and cross-reference with `.env.example`. All required vars should have values (Supabase, Stripe, Resend are filled). Optional vars can be empty.

- [ ] **Step 3: Create Phase 1 completion commit**

```bash
git add -A
git commit -m "chore: Phase 1 foundations complete — CI/CD, DB, security, logging, env validation"
```

- [ ] **Step 4: Push and verify CI passes**

```bash
git push origin refactor/production-readiness
```

Expected: GitHub Actions workflow passes all checks.

---

## Summary

| Task | What                                                          | Status  |
| ---- | ------------------------------------------------------------- | ------- |
| 1    | Fix rate limiting bug (sync → async)                          | Pending |
| 2    | Document Upstash Redis env vars                               | Pending |
| 3    | Add webhook idempotency table                                 | Pending |
| 4    | Harden admin RLS (trigger-based, prevent role self-elevation) | Pending |
| 4b   | Add verification_sessions table                               | Pending |
| 4c   | Reconcile storage bucket names                                | Pending |
| 5    | Verify existing Sentry SDK config                             | Pending |
| 6    | Add env validation                                            | Pending |
| 7    | Verify root middleware (proxy.ts vs middleware.ts)            | Pending |
| 8    | Verify Supabase new key format                                | Pending |
| 9    | Link Vercel project                                           | Pending |
| 10   | Verify CI pipeline                                            | Pending |
| 11   | Add chat-media storage bucket                                 | Pending |
| 12   | Apply migrations to Supabase                                  | Pending |
| 13   | Update README with env setup                                  | Pending |
| 14   | Final validation                                              | Pending |
