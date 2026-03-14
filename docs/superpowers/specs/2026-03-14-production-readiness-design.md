# Akiri — Production Readiness Design Spec

## Context

Akiri is a collaborative parcel transport marketplace for the African diaspora. The backend (14 services, 37+ API routes, 30+ Zod schemas) is complete with a DI factory architecture. The frontend pages exist but **no flow is connected to the backend**. The goal is to bring Akiri from its current state (advanced prototype) to a production-ready SaaS.

## Constraints

- **Solo developer**, assisted by specialized AI agents acting as a dev team
- **No fixed deadline** — quality over speed
- **DevOps level: beginner** — managed services only (Vercel, Supabase, Sentry, PostHog)
- **Target markets**: African diaspora in Europe + Africa — RGPD + African regulations
- **Mobile-first PWA** — 375px minimum, installable
- **All UI text in French**, code in English
- **Domain**: Vercel `.vercel.app` initially, custom domain later

## Infrastructure

| Service      | Purpose                              | Account                                          |
| ------------ | ------------------------------------ | ------------------------------------------------ |
| **Supabase** | DB + Auth + Realtime + Storage       | New account — `pcatqnfctteeejbrlqhx.supabase.co` |
| **Stripe**   | Payments (escrow via PaymentIntents) | New account                                      |
| **Resend**   | Transactional emails                 | New account                                      |
| **Vercel**   | Hosting + deployment                 | Existing account, project not yet linked         |
| **GitHub**   | Source code + CI/CD                  | `thefrankalbert/akiri_saas`                      |
| **Sentry**   | Error tracking                       | To create                                        |
| **PostHog**  | Product analytics                    | To create                                        |

## Approach: Hybrid by Phases

Alternating between infrastructure and features across 5 phases to maintain both a solid foundation and visible progress.

---

## Phase 1 — Foundations (Infra & DevOps)

**Objective**: Solid base before connecting anything.

### 1.1 CI/CD Pipeline

- GitHub Actions workflow on every PR: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`
- Branch protection on `main`: require CI pass before merge
- Vercel preview deployments on PRs

### 1.2 Database Migrations

- SQL migration scripts for all tables matching the TypeScript types in `src/types/index.ts`
- Tables: profiles, listings, shipment_requests, parcel_postings, carry_offers, transactions, reviews, messages, conversations, notifications, verification_sessions, push_subscriptions
- Row Level Security (RLS) policies for each table
- Indexes on frequently queried columns (user IDs, status fields, dates)
- Seed data script for development

### 1.3 Security Headers

- Vercel `headers` config in `vercel.json`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- CORS configuration for API routes
- Global rate limiting on API routes (not just auth)

### 1.4 Environment Management

- Validate required env vars at build time (fail fast if missing)
- Update `.env.example` with all current variables
- Document env var setup in README

### 1.5 Vercel Setup

- Link project via `vercel link`
- Configure environment variables in Vercel dashboard
- Set up preview deployments for PRs

### 1.6 Structured Logger

- Replace `console.log` with structured logger
- Sentry integration for error reporting in production
- Console fallback in development
- Context enrichment: userId, requestId, route

### 1.7 Supabase Client Update

- Adapt Supabase client initialization for new key format (`sb_publishable_` / `sb_secret_`)
- Verify auth flow works with new key format
- Update any JWT-dependent code if needed

**Deliverable**: Project builds, lints, typechecks without errors. DB ready with RLS. CI/CD pipeline functional. Vercel linked.

---

## Phase 2 — Core Flows (Traveler + Sender)

**Objective**: Connect frontend to backend for both user journeys end-to-end.

### 2.1 Auth Flow

- Connect existing auth pages to Supabase Auth API
- Inscription, connexion, deconnexion, reset password
- Redirect logic after auth (middleware already exists)
- Session persistence and refresh

### 2.2 Profile

- Connect profile page: display, edit, avatar upload
- Call `profilesService.getProfileByUserId()` and `updateProfile()`
- Avatar upload via Supabase Storage

### 2.3 Listings (Traveler Journey)

- Create listing form → `POST /api/listings`
- Search/filter listings page → `GET /api/listings`
- Listing detail page → `GET /api/listings/[id]`
- My listings dashboard view

### 2.4 Parcels (Sender Journey)

- Create parcel posting form → `POST /api/parcels`
- Search/filter parcels page → `GET /api/parcels`
- Parcel detail page → `GET /api/parcels/[id]`
- Photo upload → `POST /api/parcels/upload`

### 2.5 Requests

- Send shipment request on a listing → `POST /api/requests`
- Traveler accepts/rejects request → `PUT /api/requests/[id]`
- Status tracking UI for both parties

### 2.6 Offers

- Traveler makes carry offer on parcel → `POST /api/parcels/[id]/offers`
- Sender accepts/rejects offer → `PUT /api/parcels/[id]/offers/[offerId]`

### 2.7 Matching

- Display automatic suggestions (parcels ↔ listings) using `matchingService`
- Suggestion cards on listing detail and parcel detail pages

### 2.8 Payment (Stripe)

- Checkout flow → `POST /api/payments/checkout` (creates PaymentIntent with manual capture)
- Escrow hold until delivery confirmed
- Capture after confirmation → `capturePayment()`
- Refund on dispute/cancellation → `POST /api/payments/refund`
- Transaction history page → `GET /api/transactions`

### 2.9 Delivery Confirmation

- Traveler marks as collected → `markCollected()`
- Status progression UI: pending → accepted → paid → collected → in_transit → delivered → confirmed
- 6-digit confirmation code entry by sender → `POST /api/requests/[id]/confirm`

### 2.10 Reviews

- Review form after confirmed delivery → `POST /api/reviews`
- Reviews displayed on user profiles → `GET /api/reviews/[userId]`
- Auto-update user rating

### 2.11 Error Boundaries

- React Error Boundary component wrapping main layouts
- Error pages in French (404, 500, generic)
- Toast notifications for API errors

### 2.12 E2E Tests

- Test: Inscription → Create listing → Send request → Pay → Deliver → Confirm → Review
- Test: Inscription → Create parcel → Receive offer → Accept → Pay → Confirm
- Test: Auth flow (login, logout, reset password)

**Deliverable**: Both journeys work end-to-end. A traveler can publish, a sender can ship and pay, delivery gets confirmed.

---

## Phase 3 — Communication & Engagement

**Objective**: Connect everything that keeps the platform alive day-to-day.

### 3.1 Messaging

- Connect conversation pages to API
- Real-time messages via Supabase Realtime subscriptions
- Support text, image, voice message types
- Conversation list with last message preview
- Unread message indicators

### 3.2 In-App Notifications

- Notifications page connected to `GET /api/notifications`
- Badge counter in navigation
- Mark as read → `PUT /api/notifications`
- Real-time notification updates

### 3.3 Web Push Notifications

- Generate VAPID keys → `npx web-push generate-vapid-keys`
- Service worker for push reception
- Subscribe → `POST /api/notifications/subscribe`
- Push on: new request, request accepted, parcel collected, delivery confirmed, new message, dispute opened

### 3.4 Transactional Emails (Resend)

- Email templates (HTML, responsive, French):
  - Welcome / email verification
  - Request received / accepted
  - Payment confirmation
  - Delivery confirmed
  - Dispute opened
  - Review received
- Integrate into existing notification service flow

### 3.5 KYC / Verification

- Phone verification flow: send OTP → verify OTP → mark phone verified
- Identity verification: create Stripe Identity session → redirect → webhook callback
- Verification badges on profile
- Connect to existing `verificationService`

### 3.6 User Dashboard

- Activity page connected: my listings, my parcels, my requests, stats
- Quick actions (create listing, create parcel)
- Recent activity feed

### 3.7 Admin Panel

- Admin dashboard: stats (users, listings, requests, revenue)
- User management with search
- Dispute management: list, view, resolve (refund or release)
- Transaction list

### 3.8 Tests

- Test messaging real-time flow
- Test notification delivery (in-app + push)
- Test email sending via Resend
- Test admin operations

**Deliverable**: Users can communicate, receive notifications (push + email), verify identity. Admin can manage the platform.

---

## Phase 4 — Monitoring, Analytics & Compliance

**Objective**: Full visibility in production, legal compliance.

### 4.1 Sentry Integration

- Install `@sentry/nextjs`
- Configure for both client and server
- Source maps upload in CI
- Alert rules: email on new errors, Slack if available

### 4.2 PostHog Analytics

- Install `posthog-js`
- Track key events: signup, listing_created, parcel_created, request_sent, payment_completed, delivery_confirmed
- Configure funnels: signup → first listing, signup → first payment
- Retention analysis setup

### 4.3 Uptime Monitoring

- Create `GET /api/health` endpoint — checks Supabase connection + Stripe API reachable
- BetterUptime (free tier) or similar: ping every 5 min, alert on failure

### 4.4 Structured Logging Enhancement

- Add request context to all logs (userId, requestId, route, duration)
- Log API response times
- Log payment events for audit trail

### 4.5 RGPD Compliance

- Privacy policy page (`/politique-de-confidentialite`)
- Cookie consent banner (only if using non-essential cookies — PostHog)
- User data export endpoint (`GET /api/profile/export`)
- User account deletion endpoint (`DELETE /api/profile`)
- Consent storage: checkbox at registration, dated record in DB

### 4.6 Legal Pages

- CGU (Conditions Generales d'Utilisation) → `/cgu`
- CGV (Conditions Generales de Vente) → `/cgv`
- Mentions Legales → `/mentions-legales`
- All in French, covering marketplace specifics (escrow, fees, liability)

### 4.7 SEO

- Dynamic meta tags per page (title, description, Open Graph, Twitter cards)
- `sitemap.xml` generation
- `robots.txt`
- Structured data (JSON-LD) for listings

### 4.8 Tests

- Verify Sentry captures errors correctly
- Verify PostHog events fire
- Verify health endpoint returns correct status
- Verify legal pages render

**Deliverable**: Errors tracked, analytics running, RGPD compliant, SEO basics in place.

---

## Phase 5 — PWA, Polish & Production Deployment

**Objective**: Finish, polish, launch.

### 5.1 PWA

- `manifest.json` with app name, icons (192px, 512px), theme color, display: standalone
- Service worker: cache static assets, offline fallback page
- Install prompt for mobile users
- Splash screen configuration

### 5.2 Performance

- Lighthouse audit: target 90+ on all scores
- Image optimization via `next/image`
- Lazy loading for below-fold content
- Bundle analysis and code splitting review

### 5.3 Responsive Polish

- Verify all screens from 375px to 1440px
- Fix any layout breaks
- Test on real mobile devices if possible

### 5.4 Accessibility

- ARIA labels on interactive elements
- Color contrast verification (WCAG AA)
- Keyboard navigation for critical flows
- Screen reader testing on key pages

### 5.5 i18n Preparation

- Install `next-intl`
- Extract all French strings to translation files
- No English translation yet — but structure ready for future
- Default locale: `fr`

### 5.6 Final Test Suite

- Full E2E: both user journeys
- All service tests pass
- Production build succeeds
- Lighthouse scores meet targets

### 5.7 Vercel Production Deploy

- Configure production env vars in Vercel
- Deploy to production
- Verify all flows work on deployed version
- Configure Stripe webhooks with production URL

### 5.8 Stripe Live Mode

- Switch from test to live keys
- Configure live webhook endpoints
- Test a real payment (small amount)

### 5.9 Backup Strategy

- Enable Supabase Point-in-Time Recovery
- Verify backup schedule
- Document restore procedure

### 5.10 Documentation

- README updated with setup, deploy, architecture overview
- Deployment runbook: how to deploy, rollback, check logs
- Incident runbook: what to do when things break

### 5.11 Final Security & Code Review

- Full security audit: OWASP top 10 check
- Code quality review across all new code
- Dependency audit (`pnpm audit`)
- Remove any test/debug code

**Deliverable**: Akiri is live, installable as PWA, performant, accessible, secure, monitored, and legally compliant.

---

## Agent Team Structure

Each phase leverages specialized agents working in parallel where possible:

| Agent              | Role                                                                      |
| ------------------ | ------------------------------------------------------------------------- |
| **code-architect** | Infrastructure design, DB migrations, CI/CD, security headers, i18n setup |
| **feature-dev**    | All feature implementation (frontend connection, services, pages)         |
| **code-reviewer**  | Tests, performance audits, security audits, code quality reviews          |
| **code-explorer**  | Codebase analysis when needed to understand existing patterns             |

## Success Criteria

- All 5 phases completed
- Both user journeys (traveler + sender) work end-to-end
- CI/CD pipeline green on every push
- Sentry + PostHog + uptime monitoring active
- RGPD compliant with legal pages
- PWA installable with 90+ Lighthouse scores
- Production deployed on Vercel
- Stripe in live mode
- Supabase backups enabled
