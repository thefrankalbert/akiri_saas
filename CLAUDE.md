# CLAUDE.md — Akiri

## Project Overview

Akiri is a collaborative parcel transport marketplace for the African diaspora. Travelers sell their available luggage kilos, senders ship parcels at lower cost. Built as a progressive web app (PWA) targeting mobile-first usage.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Server Components)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-based config via @theme)
- **Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Payments**: Stripe (escrow via PaymentIntents)
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, register, verify)
│   ├── (main)/             # Main app pages (annonces, demandes, profil, messages, etc.)
│   ├── api/                # API routes (auth, webhooks)
│   ├── globals.css         # Tailwind theme + global styles
│   ├── layout.tsx          # Root layout with Inter font
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Reusable UI components (Button, Input, Card, etc.)
│   ├── layout/             # Layout components (Header, Footer, BottomNav)
│   └── features/           # Feature-specific components
│       ├── auth/
│       ├── listings/
│       ├── chat/
│       ├── dashboard/
│       ├── profile/
│       └── transactions/
├── lib/
│   ├── supabase/           # Supabase client (browser + server)
│   ├── utils/              # Utility functions (cn, formatCurrency, etc.)
│   ├── validations/        # Zod schemas
│   ├── services/           # Service layer (business logic)
│   └── hooks/              # Custom React hooks
├── types/                  # TypeScript type definitions
├── constants/              # App constants
└── middleware/              # Middleware utilities
```

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm typecheck    # TypeScript check
```

## Conventions

- **Language**: All UI text in French. Code (variables, comments) in English.
- **Components**: Named exports. PascalCase filenames. Props interface suffixed with `Props`.
- **Styling**: Tailwind utility classes. Use `cn()` for conditional classes.
- **Files**: kebab-case for folders, PascalCase for components, camelCase for utils.
- **Imports**: Use `@/` path alias for all imports from src/.
- **Server/Client**: Default to Server Components. Add `'use client'` only when needed.
- **Error handling**: Always handle errors gracefully. Show user-friendly messages in French.
- **API Routes**: Use Next.js Route Handlers. Validate input with Zod.
- **Colors**: Use semantic color tokens (primary, secondary, accent, neutral, success, warning, error).
- **Mobile-first**: Design for 375px minimum. Use responsive breakpoints (sm, md, lg).

## Environment Variables

See `.env.example` for required variables. Never commit `.env.local`.

## Key Business Rules

- Platform fee: 10% on each transaction
- Escrow: Payment held until delivery confirmed by sender
- Max weight per request: 30kg
- Confirmation code: 6-digit code for delivery proof
- Reviews: Both parties can review after delivery confirmation

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:

- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
