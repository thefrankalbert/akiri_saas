# CLAUDE.md - Akiri

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
- **Analytics**: PostHog
- **Monitoring**: Sentry
- **Email**: Resend
- **Notifications**: Web Push (web-push)
- **State**: Zustand
- **i18n**: next-intl
- **Rate limiting**: Upstash Redis
- **Auth guard**: Cloudflare Turnstile (optional)

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth pages (login, register, verify)
    (main)/               # Main app pages (annonces, demandes, profil, messages)
    api/                  # API routes (auth, webhooks)
    globals.css           # Tailwind theme + global styles
    layout.tsx            # Root layout
    page.tsx              # Landing page
  components/
    ui/                   # shadcn/ui -- NE PAS MODIFIER MANUELLEMENT
    layout/               # Layout components (Header, Footer, BottomNav)
    features/             # Feature-specific components
  lib/
    supabase/             # Clients Supabase (client, server, admin, middleware)
    api/                  # Rate limiting
    services/             # Service layer (business logic + errors.ts)
    validations/          # Zod schemas
    utils/                # Utility functions
    csrf.ts               # CSRF protection (verifyOrigin)
    honeypot.ts           # Bot detection (isHoneypotTriggered)
    turnstile.ts          # Cloudflare Turnstile verification
    csp.ts                # Content Security Policy nonce builder
    logger.ts             # Sentry-integrated logger
  types/                  # TypeScript type definitions
  constants/              # App constants
  proxy.ts                # Next.js middleware (auth guard, CSP)
```

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint (0 warnings, 0 errors required)
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting without modifying
pnpm typecheck        # TypeScript check (strict mode)
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Tests in watch mode
pnpm test:e2e         # E2E tests (Playwright -- requires dev server)
```

## Conventions

- **Language**: All UI text in French. Code (variables, comments) in English.
- **Components**: Named exports. PascalCase filenames. Props interface suffixed with `Props`.
- **Styling**: Tailwind utility classes. Use `cn()` for conditional classes.
- **Files**: kebab-case for folders, PascalCase for components, camelCase for utils.
- **Imports**: Use `@/` path alias for all imports from src/.
- **Server/Client**: Default to Server Components. Add `'use client'` only when needed.
- **Error handling**: Always handle errors gracefully. Show user-friendly messages in French.
- **API Routes**: Rate limit -> Zod validation -> Auth -> Service -> JSON response.
- **Mobile-first**: Design for 375px minimum. Use responsive breakpoints (sm, md, lg).
- No type `any` -- use explicit types or `unknown`.
- Server Actions prefixed with `action` (ex: `actionCreateListing`).

## Environment Variables

See `.env.example` for required variables. Never commit `.env.local`.

## Key Business Rules

- Platform fee: 10% on each transaction (calculated server-side ONLY)
- Escrow: PaymentIntent captured only after delivery confirmed by sender
- Max weight per request: 30 kg
- Confirmation code: 6-digit code (SHA-256 hashed in DB, plain text sent to sender)
- Reviews: Both parties can review after delivery confirmation
- Cancellation window: traveler can cancel before departure date

## Supabase Clients - Regles strictes

| Client                       | Usage                                  | RLS          |
| ---------------------------- | -------------------------------------- | ------------ |
| `lib/supabase/client.ts`     | 'use client' components only           | OUI          |
| `lib/supabase/server.ts`     | Server Components, Actions, API routes | OUI          |
| `lib/supabase/admin.ts`      | Webhooks, admin ops ONLY               | NON (bypass) |
| `lib/supabase/middleware.ts` | proxy.ts only                          | OUI          |

INTERDIT: utiliser admin.ts pour des operations utilisateur normales.
INTERDIT: exposer `SUPABASE_SERVICE_ROLE_KEY` cote client.
INTERDIT: utiliser `auth.getSession()` -- toujours `auth.getUser()`.

## Service Layer Pattern (OBLIGATOIRE)

```typescript
export function createXxxService(supabase: SupabaseClient) {
  return {
    async methodName(userId: string, input: ValidatedInput): Promise<Result> {
      const { data, error } = await supabase.from('table').select('*').eq('user_id', userId);

      if (error) throw new ServiceError('Failed to fetch', 'INTERNAL');
      return data;
    },
  };
}
```

Services recoivent le client Supabase par injection (testable, pas de singleton).
Jamais d'imports Next.js dans un service. Jamais de reponses HTTP dans un service.

## API Route Pattern (OBLIGATOIRE)

```typescript
export async function POST(request: Request) {
  // 1. CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimitAsync(`endpoint:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // 3. Zod validation
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  // 4. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 5. Service
  try {
    const service = createXxxService(supabase);
    const data = await service.doSomething(user.id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    logger.error('Unexpected error', err, { userId: user.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Regles de securite - OBLIGATOIRES

### Authentification

- TOUJOURS `auth.getUser()` (verifie le JWT cote serveur) -- JAMAIS `auth.getSession()` (falsifiable)
- Toute page protegee redirige vers /login si l'utilisateur n'est pas connecte
- Cookies de session : Secure, HttpOnly, SameSite=Lax en production

### Base de donnees (Supabase)

- RLS ACTIVE sur TOUTES les tables sans exception
- Chaque table a au minimum 1 policy SELECT, 1 UPDATE, 1 DELETE
- Utiliser UNIQUEMENT `auth.uid()` dans les policies (JAMAIS `user_metadata`)
- La service key Supabase = BACKEND UNIQUEMENT
- Ajouter `WITH CHECK` sur toutes les policies UPDATE et INSERT

### Paiements (Stripe Escrow)

- Montants TOUJOURS calcules cote serveur (JAMAIS faire confiance au client)
- Commission 10% calculee cote serveur uniquement
- Webhooks Stripe : toujours verifier la signature avant traitement
- PaymentIntents captures uniquement apres confirmation de livraison

### Inputs utilisateur

- JAMAIS de concatenation directe dans les requetes SQL -- utiliser les methodes SDK Supabase
- JAMAIS de rendu HTML brut non sanitise avec du contenu utilisateur
- Valider ET sanitiser chaque input cote serveur avec Zod

### API & Reseau

- CORS restreint : jamais de wildcard sur les endpoints authentifies
- Rate limiting sur TOUS les endpoints publics (Upstash Redis)
- Pas de secrets dans les URLs
- `verifyOrigin()` sur tous les POST publics (sauf webhooks qui ont leur signature)

---

## ZERO DETTE TECHNIQUE - REGLE ABSOLUE

REGLE : aucune tache n'est TERMINEE tant que 100% des problemes identifies sont corriges.

### Definition d'une tache "terminee"

1. **Les 5 portes CI passent** : typecheck, lint (--max-warnings 0), format:check, test, build.
2. **Aucun finding d'audit reporte** : chaque finding est soit corrige, soit marque N/A avec justification.
3. **Aucun fichier mort** : pas de composant, fonction, import ou hook non reference. Supprimer = MAINTENANT.
4. **Aucun placeholder** : pas de `// TODO`, `// FIXME`, `throw new Error('not implemented')`, console.log de debug.
5. **Aucun `eslint-disable`** non justifie (pourquoi + date + issue).
6. **Aucune regression** : toutes les features pre-existantes preservees.
7. **Aucune race condition / fuite de memoire** : tout addEventListener, setInterval, abonnement Supabase a sa cleanup.
8. **Typographie ASCII partout** dans le code, i18n, commentaires.

### Procedure post-modification OBLIGATOIRE

```bash
pnpm typecheck                # 0 erreur
pnpm lint --max-warnings 0    # 0 warning
pnpm format:check             # pas de diff
pnpm test                     # tous passent
pnpm build                    # build clean
```

### Formulations BANNIES

- "non bloquant pour prod" / "follow-up dans un autre PR" / "on verra plus tard"
- "acceptable pour le MVP" / "assez bon pour l'instant"

Si un probleme est identifie, il est corrige MAINTENANT ou retire du scope (decision ecrite).

---

## Discipline d'iteration - mode autonome

### 1. Critere de simplicite

- Suppression de code a resultat egal = keep automatique.
- Ajout de code pour gain marginal (< 5%) = discard.
- Avant d'ajouter, se demander "puis-je supprimer au lieu ?"

### 2. Boucle keep-or-revert

Apres chaque modification non-triviale :

1. Lancer les 5 portes CI.
2. Si tout passe ET tache accomplie -> `git commit` et avancer.
3. Si porte echoue et fix evident (< 3 tentatives) -> corriger.
4. Si apres 3 tentatives ca ne passe pas -> `git restore <file>` et nouvelle approche.

### 3. Boucle autonome - NEVER STOP sauf interruption

- Ne PAS demander "je continue ?" entre chaque item.
- Ne PAS pauser sur un succes partiel.
- Pauser UNIQUEMENT si : action destructive non autorisee, secret absent, approche fondamentale cassee.

### 4. Hygiene du contexte

- Output long (build, tests) -> rediriger dans fichier, puis grep sur le resume.
- INTERDIT : `pnpm test` (flood contexte avec 500+ lignes).
- CORRECT : `pnpm test > /tmp/test.log 2>&1 && grep -E "(passed|failed)" /tmp/test.log`.

### 5. INTERDIT ABSOLU : `git checkout -- <path>`

Ecrase silencieusement les changements non-commites. Utiliser `git restore <fichier>` (avec `git stash` ou `git diff` d'abord pour auditer l'impact).

---

## REGLES ANTI-REGRESSION - OBLIGATOIRES

### Principe fondamental

AVANT de modifier un fichier, lire le fichier EN ENTIER. Ne JAMAIS modifier une partie non liee a la tache.

**Test de tracabilite** : chaque ligne modifiee doit etre justifiable par "l'utilisateur a demande X et cette ligne sert X".

### Checklist pre-modification

1. Cette modification est-elle DIRECTEMENT demandee par l'utilisateur ?
2. Est-ce que je modifie UNIQUEMENT les lignes necessaires ?
3. Les imports, classes Tailwind, structure JSX et handlers existants sont preserves ?

Si NON, demander confirmation AVANT de modifier.

### Fichiers proteges -- NE JAMAIS MODIFIER sans demande explicite

| Fichier                          | Raison                                             |
| -------------------------------- | -------------------------------------------------- |
| `src/proxy.ts`                   | Middleware central : routing, auth guards, CSP     |
| `src/app/globals.css`            | Theme Tailwind v4, contrat viewport, design tokens |
| `src/lib/supabase/client.ts`     | Client navigateur                                  |
| `src/lib/supabase/server.ts`     | Client serveur avec cookies                        |
| `src/lib/supabase/admin.ts`      | Client service_role                                |
| `src/lib/supabase/middleware.ts` | Client middleware + rate limiting                  |
| `next.config.ts`                 | CSP headers, Sentry, security headers              |
| `src/app/api/webhooks/**`        | Webhooks Stripe avec signature verification        |

### Checklist post-modification (OBLIGATOIRE)

```bash
pnpm typecheck    # Types TypeScript
pnpm lint         # ESLint
pnpm test         # Tests unitaires
pnpm build        # Build production
```

---

## Typographie dans le code

REGLE STRICTE : Ne JAMAIS utiliser de caracteres Unicode speciaux dans le code, i18n, ou textes UI :

- INTERDIT : em dash (U+2014) -> UTILISER : `-`
- INTERDIT : ellipsis unicode (U+2026) -> UTILISER : `...` (3 points ASCII)
- INTERDIT : smart quotes (U+2018/2019/201C/201D) -> UTILISER : `'` et `"`
- INTERDIT : guillemets francais (U+00AB/00BB) -> UTILISER : `"`

EXCEPTION : fichiers Markdown (\*.md) peuvent utiliser la typographie riche.

---

## Copywriting Akiri - Regles obligatoires

Ces regles s'appliquent a tout texte visible : landing page, onboarding, emails, notifications, copies UI. En francais ET en anglais.

### Marche cible

Diaspora africaine (Burkina Faso, Cote d'Ivoire, Senegal, Cameroun, Gabon). Deux profils :

- **Voyageur** : part en Afrique, veut monetiser ses kilos libres. Mobile, presse, veut du cash.
- **Expediteur** : vit en Europe, envoie un colis chez sa famille. Veut la tranquillite d'esprit.

Ce sont des personnes qui font deja des arrangements informels. Akiri formalise ce qu'ils font deja avec securite et confiance.

### Voix de la marque

- **Direct** : une phrase = une idee. Pas de subordinees imbriquees.
- **Concret** : des chiffres, des exemples, des situations reelles.
- **Chaleureux** : on parle a quelqu'un de confiance, pas a un formulaire SaaS.
- **Africain** : references locales pertinentes (mobile money, WhatsApp, famille).
- **Fier** : Akiri resout un vrai probleme. On ne s'excuse pas, on n'est pas timide.

### Mots INTERDITS (genrent du texte IA generique)

- "solution", "plateforme", "outil tout-en-un"
- "optimisez", "ameliorez", "maximisez"
- "innovant", "robuste", "complet", "puissant"
- "dans le but de", "afin de", "permettant de"
- "nous vous invitons", "n'hesitez pas"
- "securise", "fiable" (dire ce qui le prouve, pas l'affirmer)

### Patterns qui fonctionnent

**Pain -> Resolution:**
"Fini les arrangements au dernier moment sur WhatsApp. Akiri trouve le bon voyageur, securise le paiement, et vous envoie le code de livraison."

**Avant/Apres:**
"Avant : confier un colis a un inconnu et prier. Maintenant : argent bloque jusqu'a livraison confirmee."

**Specifique + chiffre:**
"10% de commission. Le reste va directement au voyageur. Pas de frais caches."

**Question directe:**
"Vous partez a Dakar ?" plutot que "Etes-vous un voyageur ?"

**CTA avec benefice:**
"Poster mon trajet - gratuit" plutot que "Commencer"
"Envoyer mon colis en securite" plutot que "Continuer"

### Regles de style

- Paragraphes courts. 1 a 3 phrases max.
- Mix de phrases courtes percutantes et de phrases plus longues.
- Pas de point d'exclamation en serie. Un seul, utilise avec parcimonie.
- Majuscule uniquement debut de phrase et noms propres.

---

## Regles detaillees

Voir `.claude/rules/` pour les regles completes :

- `01-security.md` -- Securite, auth, RLS, rate limiting, secrets
- `02-architecture.md` -- Architecture 3 couches, conventions, anti-patterns
- `03-api-services.md` -- API routes, service layer, gestion d'erreurs, DB
- `04-testing-quality.md` -- CI/CD, tests, TypeScript strict, ESLint
- `05-ui-mobile-first.md` -- Mobile-first, viewport, touch, shadcn/ui, Tailwind v4
- `06-anti-regression.md` -- Checklist pre/post modification, fichiers proteges

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:

- Product ideas, "is this worth building", brainstorming -> invoke office-hours
- Bugs, errors, "why is this broken", 500 errors -> invoke investigate
- Ship, deploy, push, create PR -> invoke ship
- QA, test the site, find bugs -> invoke qa
- Code review, check my diff -> invoke review
- Update docs after shipping -> invoke document-release
- Design system, brand -> invoke design-consultation
- Visual audit, design polish -> invoke design-review
- Architecture review -> invoke plan-eng-review
- Save progress, checkpoint, resume -> invoke checkpoint
- Code quality, health check -> invoke health

## Health Stack

- typecheck: pnpm typecheck
- lint: pnpm lint --max-warnings 0
- test: pnpm test
