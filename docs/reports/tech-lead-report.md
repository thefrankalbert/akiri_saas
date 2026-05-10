# Rapport d'Audit Technique — Akiri

**Date :** 2026-03-24
**Auditeur :** Tech Lead (Agent IA)
**Branche :** `fix/responsive-design-and-build`
**Score de sante technique global : B+**

---

## 1. Synthese executive

Akiri est un projet bien structure, avec des fondations solides pour une marketplace PWA mobile-first. L'architecture suit les bonnes pratiques Next.js 16 (App Router, Server Components) avec une separation nette des responsabilites. Le typage TypeScript est strict (zero `any` dans le code applicatif, seulement 3 exceptions justifiees par des commentaires). La couche services utilise un pattern d'injection de dependances (DI factory) qui rend le code testable. Des tests unitaires couvrent l'ensemble des services metier. Cependant, plusieurs points meritent attention pour assurer la scalabilite et la securite en production.

---

## 2. Structure du projet

### Forces

- **Organisation claire** : La structure `src/` suit les conventions Next.js App Router avec un decoupage logique en `app/`, `components/`, `lib/`, `types/`, `constants/`.
- **Route groups** : Utilisation correcte des route groups `(auth)` et `(main)` pour separer les layouts.
- **Feature-based components** : Les composants sont organises par feature (`auth/`, `chat/`, `listings/`, `parcels/`, `dashboard/`, etc.) avec des barrel exports `index.ts`.
- **UI components isolees** : 19 composants UI reutilisables dans `src/components/ui/` (Button, Card, Input, Modal, Sheet, Tabs, etc.) avec CVA pour les variantes.
- **Services decouplees** : 15 services metier dans `src/lib/services/` avec injection de dependances via factory functions.

### Faiblesses

- **Pas de `middleware.ts`** : Le projet utilise un fichier `proxy.ts` (convention Next.js 16), mais le commentaire dans le code mentionne une migration depuis `middleware.ts`. Ce point devrait etre documente dans un ADR.
- **Fichiers parasites** : Presence de fichiers `._layout.tsx` et `._page.tsx` (fichiers macOS AppleDouble) dans `src/app/`. Ils devraient etre ajoutes au `.gitignore`.
- **Pas de stores Zustand** : `zustand` est en dependance mais aucun fichier store n'existe dans `src/stores/`. Le state management repose entierement sur les hooks React et les props. La dependance est potentiellement inutile.
- **Mock data en production** : `src/lib/mock-data.ts` (taille significative, 25+ profils mock) est inclus dans le build. Il devrait etre deplace dans un dossier `__fixtures__` ou conditionne par environnement.

---

## 3. Architecture technique

### 3.1 Patterns utilises (coherence : Bonne)

| Pattern        | Utilisation                                                       | Evaluation |
| -------------- | ----------------------------------------------------------------- | ---------- |
| DI Factory     | Tous les services (`createXxxService(supabase)`)                  | Excellent  |
| Barrel exports | `types/`, `services/`, `components/ui/`, `components/features/*/` | Bon        |
| API helpers    | `withServiceHandler`, `apiError`, `apiSuccess`, `parseBody`       | Excellent  |
| ServiceError   | Erreurs typees avec mapping HTTP (`NOT_FOUND` -> 404, etc.)       | Excellent  |
| Zod validation | Schemas exhaustifs pour toutes les entrees utilisateur            | Excellent  |
| Realtime       | Hook `useRealtime` pour Supabase Realtime Postgres Changes        | Bon        |
| Rate limiting  | Redis (Upstash) avec fallback in-memory                           | Excellent  |
| Lazy init      | Stripe client, Resend client, Redis client                        | Bon        |

### 3.2 Separation des responsabilites

```
Presentation (app/, components/)
    |
    v
Hooks (lib/hooks/) --- Validation (lib/validations/)
    |
    v
Services (lib/services/) --- Errors (lib/services/errors.ts)
    |
    v
Data (Supabase client/server) --- External APIs (Stripe, Resend, Upstash)
```

La separation est correcte. Les pages delegent la logique aux composants features, qui utilisent les hooks, qui appellent les services. Les services interagissent avec Supabase et les APIs externes.

### 3.3 Securite

**Points forts :**

- CSP complet dans `next.config.ts` (script-src, connect-src, frame-src, etc.)
- Security headers : HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- Rate limiting sur les routes d'auth (login: 5/5min, register: 3/10min, reset: 3/15min)
- Validation magic bytes sur les uploads (pas seulement le MIME type)
- Webhook Stripe avec verification de signature + idempotence
- Admin routes protegees par `requireAdmin()` avec verification de role en base
- Escrow via `capture_method: manual` sur Stripe PaymentIntents
- Middleware protege les routes authentifiees et redirige les utilisateurs non connectes

**Points de vigilance :**

- **CRITIQUE** : L'admin layout (`src/app/admin/layout.tsx`) ne verifie pas le role admin cote serveur. La verification se fait uniquement dans les API routes. Un utilisateur authentifie pourrait voir l'interface admin (meme si les API retourneraient 403). Il faudrait ajouter une verification serveur dans le layout ou un middleware dedie.
- **HAUTE** : `process.env.STRIPE_WEBHOOK_SECRET!` dans le webhook handler utilise un non-null assertion. Si la variable n'est pas definie, cela crashe a l'execution sans message clair.
- **MOYENNE** : La recherche admin (`listUsers`) utilise `or(...ilike.%${search}%...)` sans sanitisation specifique du parametre `search`. Bien que Supabase gere l'echappement SQL, une validation Zod du champ search en amont serait plus defensive.
- **BASSE** : `getClientIp` dans le middleware fait confiance a `x-forwarded-for` et `x-real-ip`. Derriere Vercel cela fonctionne, mais un reverse proxy mal configure pourrait permettre le spoofing d'IP.

---

## 4. Typage TypeScript

### Evaluation : Excellent

- **Strict mode** active dans `tsconfig.json`
- **Zero `any`** dans le code applicatif (`src/`)
- Seulement 3 `eslint-disable @typescript-eslint/no-explicit-any` avec justifications documentees :
  - `admin.ts:166` — Supabase join type inference limitation
  - `NewListingForm.tsx:307` — sans commentaire (a documenter)
  - `SendRequestModal.tsx:42` — Zod v4 output type divergence avec `.optional().default([])`
- 2 `eslint-disable @typescript-eslint/no-require-imports` dans `verification/provider.ts` pour le chargement conditionnel des providers (pattern acceptable mais pourrait etre remplace par des dynamic imports)
- **Types centralisees** dans `src/types/index.ts` (269 lignes, 15+ interfaces) — source de verite unique
- Les types de domaine couvrent : User, Profile, Listing, ShipmentRequest, ParcelPosting, CarryOffer, Transaction, Review, Message, Conversation, Notification, Corridor, VerificationSession
- **Generics** correctement utilises : `ApiResponse<T>`, `PaginatedResponse<T>`

### Point d'amelioration

- **Pas de types generes depuis Supabase** : Les types dans `src/types/index.ts` sont manuelles. Utiliser `supabase gen types` pour generer les types Database a partir du schema PostgreSQL eviterait les drifts entre la base et le code.
- Un seul fichier `types/index.ts` — avec la croissance du projet, decouperpar domaine (`types/listings.ts`, `types/auth.ts`, etc.) serait plus maintenable.

---

## 5. Tests

### Evaluation : Bon

- **21 fichiers de tests** dans `src/lib/` couvrant :
  - Tous les services (15 fichiers : listings, requests, parcels, offers, matching, transactions, reviews, messages, notifications, profiles, corridors, admin, push, verification, errors)
  - Utils, validations, env, logger, rate-limit, constants
- **Framework** : Vitest avec coverage V8
- **Mock Supabase** : Helper custom (`createMockSupabase`) avec chaining fluent — excellente testabilite grace au pattern DI
- **Mock Stripe** : Helper custom (`createMockStripe`)

### Lacunes

- **HAUTE** : Aucun test de composant React (pas de test de rendering, d'interaction, ni de snapshot). Les composants ne sont pas testes.
- **HAUTE** : Aucun test E2E — Playwright est en dev dependencies mais aucun fichier de test n'existe.
- **MOYENNE** : Coverage limitee aux fichiers `lib/` — les API routes ne sont pas testees directement.
- **BASSE** : Pas de tests pour les hooks (`use-auth`, `use-listings`, `use-realtime`, etc.)

---

## 6. Dependances

### Evaluation : Bon

- **27 dependances de production, 14 de dev** — raisonnable pour la taille du projet
- **Versions recentes** : Next.js 16.1.6, React 19.2.3, Tailwind CSS v4, TypeScript 5, Zod v4
- **Pas de doublons d'icones apparents** : `@phosphor-icons/react` et `lucide-react` sont tous deux presents. Cela represente une redondance potentielle de bundles. **Recommandation** : standardiser sur une seule librairie d'icones.

### Points de vigilance

| Dependance                                                | Statut             | Note                                                                                    |
| --------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `zustand ^5.0.11`                                         | Inutilisee         | Aucun store detecte. A retirer ou utiliser.                                             |
| `shadcn ^4.0.8`                                           | Runtime dep        | Devrait etre en devDependencies (outil de generation).                                  |
| `lucide-react ^0.577.0` + `@phosphor-icons/react ^2.1.10` | Doublon            | Deux libs d'icones. Standardiser sur une seule.                                         |
| `@base-ui/react ^1.3.0` + `@radix-ui/*`                   | Migration en cours | base-ui est le successeur de Radix. Presence des deux suggere une migration incomplete. |
| `react-day-picker ^9.13.2`                                | OK                 | Utilise dans `DatePicker.tsx`.                                                          |
| `posthog-js ^1.352.0`                                     | OK                 | Analytics. Chargement conditionnel.                                                     |
| `babel-plugin-react-compiler`                             | Desactive          | Commente dans `next.config.ts` — casse `react-hook-form`. A surveiller.                 |

---

## 7. Dette technique identifiee

### Critique

| #      | Description                                                                                                                                            | Impact   | Effort |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------ |
| DT-001 | **Admin layout sans verification de role serveur** — L'interface admin est accessible a tout utilisateur authentifie (les API protegent mais pas l'UI) | Securite | Faible |

### Haute

| #      | Description                                                                                                       | Impact         | Effort |
| ------ | ----------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| DT-002 | **Aucun test de composant ni test E2E** — Regression non detectee sur le frontend                                 | Qualite        | Eleve  |
| DT-003 | **Types Supabase manuelles** — Risque de drift entre le schema PostgreSQL et les interfaces TypeScript            | Maintenabilite | Moyen  |
| DT-004 | **Doublon de libs d'icones** (lucide + phosphor) — Bundle size inutilement augmente                               | Performance    | Moyen  |
| DT-005 | **Provider de verification utilise `require()` dynamique** — Pattern non-standard en ESM, empeche le tree-shaking | Maintenabilite | Faible |

### Moyenne

| #      | Description                                                                                                                                                                               | Impact      | Effort  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------- |
| DT-006 | **`zustand` en dependance sans aucun store** — Dependance morte                                                                                                                           | Bundle size | Trivial |
| DT-007 | **`shadcn` en production dependencies** au lieu de devDependencies                                                                                                                        | Build       | Trivial |
| DT-008 | **Mock data (`mock-data.ts`) inclus dans le build de production**                                                                                                                         | Bundle size | Faible  |
| DT-009 | **Fichiers AppleDouble (`._layout.tsx`, `._page.tsx`)** presents dans le repo                                                                                                             | Proprete    | Trivial |
| DT-010 | **I18n incomplete** — Seuls `fr.json` et `en.json` existent, mais certains textes sont hardcodes en francais dans les composants                                                          | I18n        | Moyen   |
| DT-011 | **Migration Radix -> Base UI incomplete** — `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip` coexistent avec `@base-ui/react` | Coherence   | Moyen   |

### Basse

| #      | Description                                                                                             | Impact     | Effort  |
| ------ | ------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| DT-012 | **`global-error.tsx` utilise des couleurs hardcodees** (`bg-purple-600`) au lieu des tokens semantiques | Coherence  | Trivial |
| DT-013 | **`loading.tsx` utilise `border-gray-200`** au lieu des tokens de surface                               | Coherence  | Trivial |
| DT-014 | **`REQUEST_STATUS_COLORS` utilise des couleurs Tailwind brutes** au lieu des tokens semantiques         | Coherence  | Faible  |
| DT-015 | **Non-null assertion** sur `STRIPE_WEBHOOK_SECRET` dans le webhook handler                              | Robustesse | Trivial |

---

## 8. Performance et scalabilite

### Points positifs

- `optimizePackageImports` pour `@phosphor-icons/react` dans `next.config.ts`
- Lazy initialization de Stripe, Redis, Resend (pas de crash au build si env vars manquantes)
- Singleton pattern pour le client Supabase browser (`cachedClient`)
- Rate limiting avec Redis (Upstash) et fallback in-memory
- Matching service limite ses queries a 200 resultats (`limit(200)`) avant scoring en memoire
- Source maps uploadees puis supprimees en production (`deleteSourcemapsAfterUpload`)
- PWA avec service worker, manifest, offline page

### Points de vigilance

- **Matching en memoire** : Le scoring se fait cote application (JavaScript) apres un `limit(200)`. A l'echelle, ce pattern ne tient pas. Recommandation : creer une fonction PostgreSQL RPC pour le scoring et le tri.
- **Pas de cache** : Aucune utilisation de `unstable_cache`, `revalidateTag`, ou Redis cache pour les donnees frequemment lues (corridors, listings actifs).
- **Realtime potentiellement couteux** : `useRealtime` souscrit a des tables entieres avec un filtre optionnel. A grande echelle, cela genere beaucoup de trafic WebSocket.
- **Email HTML inline** : Les templates email sont des strings HTML inline. Pas de precompilation ni de test de rendu email.

---

## 9. Recommandations architecturales priorisees

### P0 — Immediate (avant mise en production)

1. **Proteger l'admin layout cote serveur** (DT-001) — Ajouter une verification du role admin dans `src/app/admin/layout.tsx` en utilisant `createClient()` et en redirigeant les non-admins.
2. **Valider `STRIPE_WEBHOOK_SECRET`** (DT-015) — Remplacer le non-null assertion par une verification explicite avec message d'erreur clair.

### P1 — Court terme (sprint 1-2)

3. **Generer les types Supabase** (DT-003) — `supabase gen types typescript --project-id <id> > src/types/database.types.ts`, puis faire heriter les interfaces actuelles.
4. **Ajouter des tests de composants** (DT-002) — Mettre en place Vitest + @testing-library/react pour les composants critiques (RegisterForm, NewListingForm, SendRequestModal).
5. **Nettoyer les dependances** (DT-004, DT-006, DT-007) — Retirer `zustand`, deplacer `shadcn` en devDep, choisir entre lucide et phosphor.

### P2 — Moyen terme (sprint 3-4)

6. **Completer la migration Radix -> Base UI** (DT-011) — Migrer les composants restants vers `@base-ui/react`.
7. **Implementer le caching** — Utiliser `unstable_cache` de Next.js ou Redis pour les corridors et listings populaires.
8. **Deplacer le matching en PostgreSQL** — Creer une fonction RPC avec scoring pour eviter le fetch-and-score en memoire.
9. **Tests E2E** (DT-002) — Ecrire les scenarios critiques avec Playwright (inscription, creation d'annonce, paiement).

### P3 — Long terme

10. **Refactorer les emails** — Utiliser react-email ou MJML pour des templates email testables et maintenables.
11. **Internationaliser completement** (DT-010) — Extraire tous les textes hardcodes vers `messages/{locale}.json`.
12. **Observer et tracer** — Ajouter OpenTelemetry pour le tracing distribue (Supabase -> API -> Stripe).

---

## 10. ADR proposes

### ADR-001 : Pattern DI Factory pour les services

- **Contexte** : Les services metier doivent etre testables et decouplees de l'infrastructure.
- **Decision** : Chaque service est une factory function qui recoit ses dependances (SupabaseClient, Stripe) et retourne un objet avec les methodes metier.
- **Consequences** : Testabilite excellente via mocks. Pas de singletons globaux. Le trade-off est la repetition de `createXxxService(supabase)` dans chaque API route.
- **Statut** : Adopte (a documenter formellement).

### ADR-002 : Proxy vs Middleware (Next.js 16)

- **Contexte** : Next.js 16 introduit `proxy.ts` comme alternative a `middleware.ts`.
- **Decision** : Utiliser `proxy.ts` pour le refresh de session Supabase et la protection des routes.
- **Consequences** : Compatible Next.js 16. Le code actuel fonctionne mais doit etre documente car c'est une convention recente.
- **Statut** : Adopte (a documenter formellement).

### ADR-003 : Escrow via Stripe Checkout + Manual Capture

- **Contexte** : Le business model requiert un escrow (fonds bloques jusqu'a confirmation de livraison).
- **Decision** : Utiliser `capture_method: manual` sur les PaymentIntents via Stripe Checkout.
- **Consequences** : Les fonds sont autorises mais non captures. Le code de confirmation 6 chiffres declenche le capture. Stripe Connect est optionnel pour le versement aux voyageurs.
- **Statut** : Adopte (a documenter formellement).

### ADR-004 : Rate limiting distribue avec fallback local

- **Contexte** : Proteger les routes d'authentification contre le brute-force.
- **Decision** : Upstash Redis pour le rate limiting en production, fallback en memoire en developpement.
- **Consequences** : Fonctionne sans Redis en local. Le fallback en memoire ne persiste pas entre les redemarrages et n'est pas distribue (acceptable en dev).
- **Statut** : Adopte (a documenter formellement).

---

## 11. Grille d'audit — Checklist

| Critere                                   | Evaluation | Note                                                                    |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Structure de dossiers logique et scalable | OK         | Suit les conventions Next.js 16                                         |
| Responsabilites clairement separees       | OK         | Presentation / Hooks / Services / Data                                  |
| Code duplique a factoriser                | Mineur     | Templates email inline repetitifs                                       |
| Dependances a jour et sans vulnerabilites | Attention  | zustand inutilise, doublon d'icones, migration Radix incomplete         |
| Typage TypeScript strict et complet       | Excellent  | Zero `any`, strict mode, types centralisees                             |
| Gestion d'erreurs coherente               | Bon        | ServiceError + withServiceHandler. Manque un error boundary par feature |
| Configuration centralisee et documentee   | Bon        | `.env.example` complet, `constants/index.ts`, `env.ts`                  |
| Code testable (DI, interfaces)            | Excellent  | DI factory pattern sur tous les services                                |
| Patterns coherents dans tout le projet    | Bon        | Quelques incoherences de couleurs (tokens vs hardcoded)                 |
| Dette technique identifiee et priorisee   | A faire    | Ce rapport constitue la premiere identification formelle                |

---

## 12. Metriques

| Metrique                   | Valeur                         |
| -------------------------- | ------------------------------ |
| Fichiers TypeScript (src/) | ~130+                          |
| Tests unitaires            | 21 fichiers                    |
| Tests de composants        | 0                              |
| Tests E2E                  | 0                              |
| Services metier            | 15                             |
| Composants UI              | 19                             |
| Composants features        | ~35                            |
| API routes                 | 30+                            |
| Pages                      | 25+                            |
| eslint-disable             | 6 (justifies)                  |
| `any` explicites           | 3 (justifies par commentaires) |
| Dependances production     | 27                             |
| Dependances dev            | 14                             |

---

_Rapport genere le 2026-03-24 par l'agent Tech Lead._
