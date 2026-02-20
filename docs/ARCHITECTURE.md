# 🏗 Architecture — Akiri SaaS

> **Dernière mise à jour :** 2026-02-20
> **Stack :** Next.js 14+ / TypeScript / Tailwind CSS / Supabase / Stripe

---

## 1. Vue d'ensemble

```
src/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── (main)/             # Pages protégées (layout avec Header/Footer)
│   │   ├── annonces/       # Listings (browse, detail, create)
│   │   ├── corridors/      # Hub des corridors
│   │   ├── dashboard/      # Tableau de bord utilisateur
│   │   ├── demandes/       # Demandes d'expédition
│   │   ├── messages/       # Chat entre utilisateurs
│   │   ├── profil/         # Profil + vérification
│   │   ├── transactions/   # Historique paiements
│   │   ├── cgu/            # CGU (public)
│   │   ├── confidentialite/# Politique de confidentialité (public)
│   │   ├── contact/        # Page contact (public)
│   │   ├── faq/            # FAQ (public)
│   │   ├── mentions/       # Mentions légales (public)
│   │   └── securite/       # Page sécurité (public)
│   ├── api/                # API Routes (REST)
│   │   ├── listings/       # CRUD annonces
│   │   ├── requests/       # Demandes + confirmation
│   │   ├── reviews/        # Avis
│   │   ├── verification/   # Phone OTP + Identity KYC
│   │   └── webhooks/       # Stripe + Stripe Identity
│   ├── auth/               # Callback OAuth
│   ├── page.tsx            # Landing page (composition de 8 composants)
│   ├── layout.tsx          # Root layout (fonts, metadata, Toaster)
│   ├── sitemap.ts          # SEO sitemap (12 URLs)
│   ├── robots.ts           # SEO robots.txt
│   └── manifest.ts         # PWA manifest
│
├── components/
│   ├── ui/                 # Composants UI atomiques (Button, Card, Badge, etc.)
│   ├── layout/             # Header, Footer, Navigation
│   └── features/           # Composants métier par domaine
│       ├── home/           # Landing page sections (8 composants)
│       ├── auth/           # LoginForm, RegisterForm, AuthForm
│       ├── listings/       # ListingsPage, ListingDetail, NewListingForm, CorridorsPage
│       ├── chat/           # MessagesPage
│       ├── dashboard/      # DashboardPage
│       ├── profile/        # ProfilePage
│       ├── transactions/   # TransactionsPage
│       ├── verification/   # PhoneVerification, IdentityVerification
│       └── pwa/            # InstallPrompt, OfflineBanner
│
├── lib/
│   ├── hooks/              # React hooks (use-auth, use-listings, use-realtime, use-in-view)
│   ├── services/           # Logique métier serveur (transactions, verification, listings, etc.)
│   ├── supabase/           # Clients Supabase (browser, server, middleware)
│   ├── stripe/             # Client Stripe (lazy init)
│   ├── verification/       # Provider pattern (mock/stripe)
│   ├── validations/        # Schémas Zod
│   └── utils/              # Utilitaires (cn, formatCurrency, formatDate, etc.)
│
├── constants/              # Constantes (pays, catégories, statuts, frais)
└── types/                  # Types TypeScript partagés
```

---

## 2. Flux de données

### 2.1 Architecture Client/Serveur

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                          │
│  'use client' Components                                │
│  ├── Hooks (use-auth, use-listings, use-realtime)       │
│  ├── Supabase Browser Client (singleton)                │
│  └── fetch() → API Routes                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVER (Next.js)                       │
│                                                          │
│  API Routes (/api/*)                                     │
│  ├── Auth check (Supabase middleware)                    │
│  ├── Validation Zod                                      │
│  ├── Services (lib/services/*)                           │
│  │   ├── Supabase Server Client                          │
│  │   └── Stripe SDK                                      │
│  └── Response JSON                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES                          │
│                                                          │
│  ├── Supabase (Auth + PostgreSQL + Realtime)             │
│  ├── Stripe (Payments + Identity KYC)                    │
│  └── Vercel (Hosting + Edge Functions)                   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Flux Escrow (paiement sécurisé)

```
Expéditeur         Akiri           Stripe          Voyageur
    │                │               │                │
    │── Demande ────▶│               │                │
    │                │── Accept ────▶│                │
    │── Payer ──────▶│               │                │
    │                │── Checkout ──▶│                │
    │                │◀── Held ─────│ (manual capture)│
    │                │               │                │
    │            [EN ESCROW]         │                │
    │                │               │                │
    │── Code 6 ─────▶│               │                │
    │   chiffres     │── Capture ──▶│                │
    │                │               │── Paiement ──▶│
    │                │◀── Released ─│                │
    │                │               │                │
```

### 2.3 Niveaux de vérification (KYC)

```
Level 1 ─── Email vérifié (signup)
Level 2 ─── Phone vérifié (OTP SMS)
Level 3 ─── Identité vérifiée (Stripe Identity / Mock)
```

---

## 3. Patterns architecturaux

### 3.1 Services Layer

Toute la logique métier est dans `lib/services/`. Les API routes sont de simples "controllers" qui :

1. Vérifient l'auth
2. Parsent les paramètres
3. Appellent le service
4. Retournent la réponse

### 3.2 Provider Pattern (Vérification)

```
lib/verification/
├── provider.ts         # Factory (getVerificationProvider)
├── mock-provider.ts    # Mode développement
└── stripe-provider.ts  # Mode production (Stripe Identity)
```

Le mode est contrôlé par `NEXT_PUBLIC_KYC_MODE` (mock | stripe).

### 3.3 Type-safe API Responses

Toutes les fonctions de service retournent `ApiResponse<T>` :

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}
```

### 3.4 Supabase Client Strategy

- **Browser** : `createBrowserClient()` singleton (module-level cache)
- **Server** : `createClient()` par requête (cookies-aware)
- **Admin** : `createAdminClient()` avec service role key

---

## 4. Tests

| Couche       | Fichier de test                                 | Tests   |
| ------------ | ----------------------------------------------- | ------- |
| Constantes   | `constants/__tests__/constants.test.ts`         | 20      |
| Utilitaires  | `lib/utils/__tests__/utils.test.ts`             | 55      |
| Validations  | `lib/validations/__tests__/validations.test.ts` | 130     |
| Transactions | `lib/services/__tests__/transactions.test.ts`   | 34      |
| Vérification | `lib/services/__tests__/verification.test.ts`   | 25      |
| **Total**    | **5 fichiers**                                  | **264** |

---

## 5. Conventions

| Règle              | Standard                                          |
| ------------------ | ------------------------------------------------- |
| Composant          | 1 fichier = 1 composant, max 150 lignes           |
| Types              | Centralisés dans `types/index.ts`                 |
| Validations        | Schémas Zod dans `lib/validations/`               |
| Services           | Logique serveur dans `lib/services/`              |
| Hooks              | Hooks client dans `lib/hooks/`                    |
| Constants          | Valeurs métier dans `constants/`                  |
| Nommage tables     | Singulier (profile, listing, transaction)         |
| Nommage composants | PascalCase                                        |
| Nommage fichiers   | PascalCase pour composants, kebab-case pour hooks |

---

## 6. Variables d'environnement

| Variable                         | Requis     | Usage                            |
| -------------------------------- | ---------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | ✅         | URL Supabase                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | ✅         | Clé publique Supabase            |
| `SUPABASE_SERVICE_ROLE_KEY`      | ✅ serveur | Admin operations                 |
| `STRIPE_SECRET_KEY`              | ✅ serveur | Payments                         |
| `STRIPE_WEBHOOK_SECRET`          | ✅ serveur | Webhook validation               |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | ⚡ serveur | KYC webhooks                     |
| `NEXT_PUBLIC_KYC_MODE`           | ❌         | `mock` (défaut) ou `stripe`      |
| `NEXT_PUBLIC_APP_URL`            | ❌         | URL app (défaut: localhost:3000) |
