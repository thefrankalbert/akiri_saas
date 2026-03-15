# Phase 2 — Core Flows (Traveler + Sender) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure both user journeys (traveler + sender) work end-to-end with real Supabase data — from registration to payment to delivery confirmation to reviews.

**Architecture:** The frontend already has hooks, components, and dual-mode (Supabase/mock) support. Most pages fetch real data when Supabase is configured. The focus is: (1) verify each API route works with the real DB, (2) fix gaps where frontend is mock-only, (3) add Stripe Connect onboarding, (4) connect payment + delivery flows, (5) add error boundaries and E2E tests.

**Tech Stack:** Next.js 16, React 19, Supabase, Stripe, Playwright, Vitest, react-hook-form, Zod

**Spec:** `docs/superpowers/specs/2026-03-14-production-readiness-design.md` — Phase 2

**Key Finding:** Frontend exploration reveals most pages ALREADY have real Supabase integration via hooks (`useListings`, `useParcels`, `useConversations`, `useMessages`, `useAuth`, `useDashboardData`, etc.). The work is primarily verification, gap-filling, and flow completion.

---

## Chunk 1: Auth & Profile Flows

### Task 1: Verify auth flow works end-to-end with real Supabase

The auth pages (login, register, verify, reset-password) already call Supabase Auth. Verify they work with the new Supabase project.

**Files:**

- Verify: `src/components/features/auth/LoginForm.tsx`
- Verify: `src/components/features/auth/RegisterForm.tsx`
- Verify: `src/lib/hooks/use-auth.ts`
- Verify: `src/proxy.ts` (middleware redirects)

- [ ] **Step 1: Start dev server and test registration**

Run: `pnpm dev`
Navigate to `/register`, create a real account with email/password.
Expected: Account created in Supabase Auth, profile auto-created via `handle_new_user()` trigger, redirect to `/verify` or `/dashboard`.

- [ ] **Step 2: Test login**

Navigate to `/login`, sign in with the account created.
Expected: Redirect to `/dashboard`, `useAuth()` returns user + profile.

- [ ] **Step 3: Test protected route redirect**

Sign out, navigate to `/dashboard`.
Expected: Redirect to `/login?redirect=/dashboard`.

- [ ] **Step 4: Test password reset flow**

Navigate to `/reset-password`, enter email.
Expected: Supabase sends password reset email (check Supabase dashboard > Auth > Users).

- [ ] **Step 5: Fix any issues found and commit**

If auth works: no commit needed. If fixes required, commit with descriptive message.

---

### Task 2: Connect Stripe Connect onboarding for travelers

Travelers must complete Stripe Connect Express onboarding to receive payouts. The API routes exist (`/api/connect/onboard`, `/api/connect/status`) but no UI surfaces them.

**Files:**

- Modify: `src/components/features/settings/ProfileSettingsTab.tsx` (add Connect onboarding section)
- Verify: `src/app/api/connect/onboard/route.ts`
- Verify: `src/app/api/connect/status/route.ts`

- [ ] **Step 1: Read existing ProfileSettingsTab.tsx**

Understand the current structure and where to add the Connect onboarding section.

- [ ] **Step 2: Add Stripe Connect onboarding section**

Add a section in the Profile tab that:

- Checks `profile.stripe_connect_onboarded` status
- If not onboarded: shows a button "Configurer les paiements" that calls `POST /api/connect/onboard`
- The API returns an `onboarding_url` — redirect the user to it
- If onboarded: shows a green badge "Paiements configurés"

```typescript
// Inside ProfileSettingsTab, add after the profile form:
const [connectLoading, setConnectLoading] = useState(false);

const handleConnectOnboarding = async () => {
  setConnectLoading(true);
  try {
    const res = await fetch('/api/connect/onboard', { method: 'POST' });
    const data = await res.json();
    if (data.data?.url) {
      window.location.href = data.data.url;
    }
  } catch (error) {
    console.error('Connect onboarding error:', error);
  } finally {
    setConnectLoading(false);
  }
};
```

UI section:

```tsx
<div className="mt-6 border-t pt-6">
  <h3 className="mb-2 text-lg font-semibold">Recevoir des paiements</h3>
  {profile?.stripe_connect_onboarded ? (
    <div className="flex items-center gap-2 text-green-600">
      <CheckCircle size={20} />
      <span>Paiements configurés</span>
    </div>
  ) : (
    <>
      <p className="mb-3 text-sm text-gray-500">
        Configurez votre compte pour recevoir les paiements des expéditeurs.
      </p>
      <Button onClick={handleConnectOnboarding} disabled={connectLoading}>
        {connectLoading ? 'Chargement...' : 'Configurer les paiements'}
      </Button>
    </>
  )}
</div>
```

- [ ] **Step 3: Run typecheck and test**

Run: `pnpm typecheck`
Manual test: Navigate to `/parametres`, verify the section appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/settings/ProfileSettingsTab.tsx
git commit -m "feat: add Stripe Connect onboarding UI for travelers"
```

---

## Chunk 2: Transactions & Payment Flow

### Task 3: Connect transactions page to real API

The transactions page (`TransactionsPage.tsx`) uses hardcoded mock data. Connect it to `GET /api/transactions`.

**Files:**

- Modify: `src/components/features/transactions/TransactionsPage.tsx`
- Verify: `src/app/api/transactions/route.ts`

- [ ] **Step 1: Read the current TransactionsPage.tsx**

Understand the mock data structure and what the component expects.

- [ ] **Step 2: Create a useTransactions hook or add fetch logic**

Replace hardcoded `mockTransactions` with a fetch from `/api/transactions`. Follow the existing pattern from `useListings()`:

- Check `supabaseConfigured`
- If configured: fetch from API
- If not: fall back to mock data
- Handle loading/error states

- [ ] **Step 3: Test with real data**

After registering and creating test data, verify the transactions page shows real data.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: connect transactions page to real API"
```

---

### Task 4: Connect payment checkout flow

The Stripe checkout is handled by `POST /api/payments/checkout` which creates a PaymentIntent with manual capture (escrow). Verify the frontend triggers this correctly.

**Files:**

- Verify: `src/components/features/requests/RequestActions.tsx` (payment button)
- Verify: `src/app/api/payments/checkout/route.ts`
- Verify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Read RequestActions.tsx**

Find the payment button and understand how it triggers checkout.

- [ ] **Step 2: Verify the checkout flow**

Check that:

- The "Payer" button calls `POST /api/payments/checkout` with the `request_id`
- The API creates a Stripe PaymentIntent and returns a `client_secret`
- The frontend uses Stripe.js to confirm the payment
- The webhook updates transaction status to `held`

- [ ] **Step 3: Add PaymentIntent expiry warning**

Per spec: display the 7-day capture deadline in the status UI. Add a warning message when a payment is in `held` status showing how many days remain.

- [ ] **Step 4: Test with Stripe test mode**

Use Stripe test card `4242 4242 4242 4242` to test a payment.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: verify payment checkout flow and add escrow expiry warning"
```

---

## Chunk 3: Delivery & Reviews Flow

### Task 5: Verify delivery confirmation flow

The request detail page has a status stepper and action buttons. Verify all status transitions work via `PATCH /api/requests/[id]`.

**Files:**

- Verify: `src/components/features/requests/RequestActions.tsx`
- Verify: `src/components/features/requests/RequestStatusStepper.tsx`
- Verify: `src/components/features/requests/RequestDetailPage.tsx`
- Verify: `src/app/api/requests/[id]/route.ts`
- Verify: `src/app/api/requests/[id]/confirm/route.ts`

- [ ] **Step 1: Read RequestActions.tsx and verify action buttons map to API**

Check that each action button (accept, collect, in_transit, deliver, dispute) calls `PATCH /api/requests/[id]` with the correct `action` field.

- [ ] **Step 2: Verify 6-digit confirmation code flow**

Check that:

- When status is `delivered`, the sender sees a code input
- Submitting the code calls `POST /api/requests/[id]/confirm`
- The API validates the code and transitions to `confirmed`
- After confirmation, the payment is captured

- [ ] **Step 3: Fix any missing action buttons or incorrect API calls**

If any transitions are missing or use wrong endpoints, fix them.

- [ ] **Step 4: Commit**

```bash
git commit -m "fix: verify and fix delivery confirmation flow"
```

---

### Task 6: Verify reviews flow

After delivery is confirmed, both parties can leave reviews.

**Files:**

- Verify: `src/components/features/reviews/ReviewForm.tsx`
- Verify: `src/app/api/reviews/route.ts`
- Verify: `src/app/api/reviews/[userId]/route.ts`

- [ ] **Step 1: Read ReviewForm.tsx**

Check it submits to `POST /api/reviews` with the correct payload (request_id, reviewed_id, rating, comment).

- [ ] **Step 2: Verify the review form appears after delivery confirmation**

Check in `RequestDetailPage.tsx` or `RequestActions.tsx` that the review form is shown when `status === 'confirmed'`.

- [ ] **Step 3: Verify reviews display on profile**

Check `ProfilePage.tsx` fetches reviews from `GET /api/reviews/[userId]`.

- [ ] **Step 4: Fix any issues and commit**

```bash
git commit -m "fix: verify and fix reviews flow"
```

---

## Chunk 4: Dashboard & Activity Connection

### Task 7: Connect dashboard to real data

The dashboard uses `useDashboardData()` which already fetches from Supabase when configured. But the activity timeline is hardcoded. Connect it to real data.

**Files:**

- Modify: `src/lib/hooks/use-dashboard-data.ts`
- Modify: `src/components/features/dashboard/DashboardActivityTimeline.tsx`

- [ ] **Step 1: Read useDashboardData.ts**

Understand the current mock activities and what real data sources to use.

- [ ] **Step 2: Replace mock activities with real recent data**

Fetch recent activities from multiple sources:

- Recent requests (status changes)
- Recent messages (last message per conversation)
- Recent reviews received

Combine and sort by date.

- [ ] **Step 3: Verify dashboard shows real stats**

After creating test data, verify stats (active listings, pending requests, unread messages, earnings) show correct counts.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: connect dashboard activity timeline to real data"
```

---

### Task 8: Connect corridors page to real data

The corridors page computes stats from `mockListings`. Connect to `GET /api/corridors`.

**Files:**

- Modify: `src/components/features/listings/CorridorsPage.tsx`
- Verify: `src/app/api/corridors/route.ts`

- [ ] **Step 1: Read CorridorsPage.tsx**

Understand how it currently computes corridor data from mock.

- [ ] **Step 2: Replace mock computation with API call**

Fetch from `GET /api/corridors` which returns `{departure_country, arrival_country, active_listings, avg_price_per_kg}`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: connect corridors page to real API"
```

---

## Chunk 5: Error Handling & Polish

### Task 9: Add global error boundary

**Files:**

- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/app/(main)/layout.tsx` (wrap with error boundary)
- Create: `src/app/(main)/error.tsx` (Next.js error page)
- Create: `src/app/not-found.tsx` (404 page)

- [ ] **Step 1: Create error boundary component**

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <h2 className="text-xl font-semibold mb-2">Une erreur est survenue</h2>
          <p className="text-gray-500 mb-4">Veuillez rafraîchir la page ou réessayer plus tard.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Create Next.js error page**

```typescript
// src/app/(main)/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <h2 className="text-xl font-semibold mb-2">Une erreur est survenue</h2>
      <p className="text-gray-500 mb-4">Veuillez réessayer.</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-lg">
        Réessayer
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create 404 page**

```typescript
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-500 mb-4">Page introuvable</p>
      <a href="/" className="px-4 py-2 bg-primary text-white rounded-lg">
        Retour à l'accueil
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Run typecheck and verify**

Run: `pnpm typecheck`
Navigate to `/nonexistent-page` — should show 404.

- [ ] **Step 5: Commit**

```bash
git add src/components/ErrorBoundary.tsx src/app/(main)/error.tsx src/app/not-found.tsx
git commit -m "feat: add error boundary, error page, and 404 page in French"
```

---

### Task 10: Add webhook idempotency to Stripe webhook handler

Per spec: use the `processed_webhook_events` table to prevent duplicate processing.

**Files:**

- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Read the current webhook handler**

Understand how it processes events.

- [ ] **Step 2: Add idempotency check**

Before processing any event, check if `event.id` exists in `processed_webhook_events`. If so, return 200 early. After processing, insert the event ID.

```typescript
// At the start of event processing:
const adminSupabase = createAdminClient();
const { data: existing } = await adminSupabase
  .from('processed_webhook_events')
  .select('id')
  .eq('event_id', event.id)
  .single();

if (existing) {
  return NextResponse.json({ received: true, duplicate: true });
}

// After successful processing:
await adminSupabase.from('processed_webhook_events').insert({
  event_id: event.id,
  event_type: event.type,
});
```

- [ ] **Step 3: Also handle `payment_intent.canceled` event**

Add a handler for this event type to update transaction status and notify users when escrow expires.

- [ ] **Step 4: Run typecheck and commit**

```bash
git commit -m "feat: add webhook idempotency and handle PaymentIntent expiry"
```

---

## Chunk 6: E2E Test Setup

### Task 11: Set up Playwright and write first E2E test

**Files:**

- Create: `playwright.config.ts`
- Create: `e2e/auth.spec.ts`
- Modify: `package.json` (add playwright scripts)

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: Write auth E2E test**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test('should show register form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /inscription|créer/i })).toBeVisible();
  });
});
```

- [ ] **Step 4: Add scripts to package.json**

Add to scripts:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Run E2E tests**

Run: `pnpm test:e2e`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e/ package.json
git commit -m "feat: add Playwright E2E test setup with auth flow tests"
```

---

## Chunk 7: Final Validation

### Task 12: Full build and test verification

- [ ] **Step 1: Run complete validation**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected: All pass.

- [ ] **Step 2: Run E2E tests**

```bash
pnpm test:e2e
```

Expected: All pass.

- [ ] **Step 3: Commit and push**

```bash
git push origin refactor/production-readiness
```

---

## Summary

| Task | What                                           | Type               |
| ---- | ---------------------------------------------- | ------------------ |
| 1    | Verify auth flow with real Supabase            | Verification       |
| 2    | Add Stripe Connect onboarding UI               | New feature        |
| 3    | Connect transactions page to real API          | Gap fill           |
| 4    | Verify payment checkout flow + escrow warning  | Verification + fix |
| 5    | Verify delivery confirmation flow              | Verification       |
| 6    | Verify reviews flow                            | Verification       |
| 7    | Connect dashboard activity to real data        | Gap fill           |
| 8    | Connect corridors page to real API             | Gap fill           |
| 9    | Add error boundary + 404 + error pages         | New feature        |
| 10   | Add webhook idempotency + PaymentIntent expiry | Fix                |
| 11   | Set up Playwright + auth E2E tests             | New feature        |
| 12   | Final validation                               | Verification       |
