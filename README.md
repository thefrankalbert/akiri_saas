# Akiri

Marketplace collaborative de transport de colis pour la diaspora africaine. Les voyageurs vendent leurs kilos de bagages disponibles, les expéditeurs envoient des colis à moindre coût.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Server Components)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Payments**: Stripe (escrow via PaymentIntents)
- **Emails**: Resend
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Environment Setup

1. Copy the example env file:

```bash
cp .env.example .env.local
```

2. Fill in the required variables:

| Variable                             | Required | Where to get it                          |
| ------------------------------------ | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Yes      | Supabase Dashboard > Settings > API      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Yes      | Supabase Dashboard > Settings > API      |
| `SUPABASE_SERVICE_ROLE_KEY`          | Yes      | Supabase Dashboard > Settings > API      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes      | Stripe Dashboard > Developers > API keys |
| `STRIPE_SECRET_KEY`                  | Yes      | Stripe Dashboard > Developers > API keys |
| `RESEND_API_KEY`                     | Yes      | Resend Dashboard > API Keys              |

Optional variables (features degrade gracefully without them):

| Variable                                             | Purpose                     |
| ---------------------------------------------------- | --------------------------- |
| `STRIPE_WEBHOOK_SECRET`                              | Stripe webhook verification |
| `UPSTASH_REDIS_REST_URL` / `TOKEN`                   | Production rate limiting    |
| `NEXT_PUBLIC_SENTRY_DSN`                             | Error tracking              |
| `NEXT_PUBLIC_POSTHOG_KEY`                            | Product analytics           |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push notifications      |

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm lint           # Run ESLint
pnpm format         # Format with Prettier
pnpm format:check   # Check formatting
pnpm typecheck      # TypeScript check
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage
```

## Database

SQL migrations are in `supabase/migrations/`. Apply them via the Supabase SQL Editor or `supabase db push`.

## Project Structure

```
src/
├── app/            # Next.js App Router pages + API routes
├── components/     # UI, layout, and feature components
├── lib/            # Services, utilities, hooks, validations
├── types/          # TypeScript type definitions
└── constants/      # App constants
```

See `CLAUDE.md` for full conventions and architecture details.
