# 🦸 AUDIT SUPERPOWERS — Akiri SaaS

> **Date :** 2026-02-20
> **Méthodologie :** Framework Superpowers (obra/superpowers)
> **Projet :** Akiri — Transport collaboratif de colis pour la diaspora africaine

---

## 📊 Résumé Exécutif

| Dimension Superpowers                 | Score    | Verdict                       |
| ------------------------------------- | -------- | ----------------------------- |
| 🔴 Test-Driven Development            | **2/10** | ❌ CRITIQUE                   |
| 🟡 Architecture & Taille des fichiers | **4/10** | ⚠️ À AMÉLIORER                |
| 🟢 TypeScript Strict                  | **7/10** | ✅ BON                        |
| 🟡 Gestion d'erreurs                  | **5/10** | ⚠️ PARTIEL                    |
| 🟡 Debugging systématique             | **4/10** | ⚠️ ABSENT                     |
| 🟢 Vérification avant complétion      | **7/10** | ✅ BON (Build + Typecheck OK) |
| 🟡 Plans d'implémentation             | **3/10** | ⚠️ ABSENT                     |
| 🟡 Git Workflow                       | **5/10** | ⚠️ BASIQUE                    |
| 🟢 SEO & PWA                          | **7/10** | ✅ BON                        |
| 🟡 Sécurité                           | **5/10** | ⚠️ PARTIEL                    |

**Score global : 4.9/10 — Le projet a de bonnes fondations mais des lacunes majeures.**

---

## 1. 🔴 TEST-DRIVEN DEVELOPMENT — Score 2/10

### Constat

Le projet compte **137 fichiers TypeScript/TSX** mais seulement **3 fichiers de tests** :

| Fichier de test                                 | Tests | Couvre                |
| ----------------------------------------------- | ----- | --------------------- |
| `constants/__tests__/constants.test.ts`         | 20    | Constantes statiques  |
| `lib/utils/__tests__/utils.test.ts`             | 55    | Fonctions utilitaires |
| `lib/validations/__tests__/validations.test.ts` | 130   | Validations Zod       |

**Total : 205 tests passants sur 3 fichiers.**

### Ce qui n'est PAS testé (CRITIQUE)

- ❌ **0 test** sur les 10 services (`listings.ts`, `transactions.ts`, `verification.ts`, `messages.ts`, etc.)
- ❌ **0 test** sur les 11 routes API (`/api/webhooks/stripe`, `/api/verification/phone/*`, etc.)
- ❌ **0 test** sur les hooks (`use-auth.ts`, `use-listings.ts`, `use-realtime.ts`, etc.)
- ❌ **0 test** sur les composants (aucun test React/component)
- ❌ **0 test** sur le middleware Supabase

### Couverture de test

La config `vitest.config.ts` limite la couverture à seulement 3 fichiers :

```
include: ['src/lib/utils/index.ts', 'src/lib/validations/index.ts', 'src/constants/index.ts']
```

→ **La logique métier critique (paiements, escrow, vérification KYC) est totalement sans filet.**

### 🎯 Actions Superpowers recommandées

| Priorité | Action                                                       | Skill Superpowers         |
| -------- | ------------------------------------------------------------ | ------------------------- |
| P0       | Tests pour `transactions.ts` (escrow, paiements)             | `test-driven-development` |
| P0       | Tests pour `verification.ts` (KYC)                           | `test-driven-development` |
| P1       | Tests pour les routes API webhooks Stripe                    | `test-driven-development` |
| P1       | Tests pour `use-auth.ts`                                     | `test-driven-development` |
| P2       | Tests composants critiques (LoginForm, RegisterForm)         | `test-driven-development` |
| P2       | Étendre la config coverage vitest à tout `src/lib/services/` | —                         |

---

## 2. 🟡 ARCHITECTURE & TAILLE DES FICHIERS — Score 4/10

### Fichiers dépassant la limite de 150 lignes (règle utilisateur)

**34 fichiers dépassent le seuil.** Les plus critiques :

| Fichier                                           | Lignes | Seuil dépassé de |
| ------------------------------------------------- | ------ | ---------------- |
| `lib/mock-data.ts`                                | 1328   | **+1178 lignes** |
| `app/page.tsx`                                    | 1021   | **+871 lignes**  |
| `components/features/listings/CorridorsPage.tsx`  | 591    | +441             |
| `components/features/dashboard/DashboardPage.tsx` | 520    | +370             |
| `components/features/listings/ListingDetail.tsx`  | 324    | +174             |
| `lib/services/verification.ts`                    | 318    | +168             |
| `components/features/listings/NewListingForm.tsx` | 309    | +159             |
| `lib/services/transactions.ts`                    | 271    | +121             |
| `components/ui/Motion.tsx`                        | 252    | +102             |
| `lib/hooks/use-auth.ts`                           | 247    | +97              |

### Problèmes architecturaux

1. **`page.tsx` (1021 lignes)** : Contient TOUTE la landing page dans un seul fichier monolithique (Hero, Stats, How It Works, Features, Testimonials, Corridors, CTA). Devrait être 8+ composants séparés.
2. **`mock-data.ts` (1328 lignes)** : Données mock massives mélangées au code source.
3. **Pas de Server Actions** : Aucun fichier `'use server'` trouvé → la logique serveur passe par les routes API au lieu de Server Actions Next.js 14+.
4. **Pas de dossier `/app/actions/`** : Contrairement à la convention définie dans les règles utilisateur.

### 🎯 Actions Superpowers recommandées

| Priorité | Action                                                                                                          | Skill                               |
| -------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| P0       | Découper `page.tsx` en composants (Hero, Stats, HowItWorks, Features, Testimonials, Corridors, CTA, LiveTicker) | `writing-plans` + `executing-plans` |
| P1       | Extraire les mock-data dans un dossier `/__mocks__/` ou les remplacer par des données Supabase                  | `brainstorming`                     |
| P1       | Créer `/app/actions/` pour les Server Actions                                                                   | `writing-plans`                     |
| P2       | Refactorer les 34 fichiers au-dessus de 150 lignes                                                              | `subagent-driven-development`       |

---

## 3. 🟢 TYPESCRIPT STRICT — Score 7/10

### Points positifs ✅

- `tsc --noEmit` passe **sans erreur** → Aucune erreur de type
- Types centralisés dans `/types/index.ts` (207 lignes, bien structuré)
- Utilisation systématique d'interfaces et types union discriminants (ex: `RequestStatus`, `TransactionStatus`)
- Générics bien utilisés (`ApiResponse<T>`, `PaginatedResponse<T>`)

### Points à améliorer ⚠️

- **2 usages de `any`** trouvés :
  - `src/lib/supabase/client.ts:24` → `let cachedClient: any = null;`
  - `src/lib/hooks/use-realtime.ts:49` → `const channelConfig: any = {}`
- Le fichier `types/index.ts` (207 lignes) dépasse le seuil de 150 → devrait être découpé par domaine

### 🎯 Actions recommandées

| Priorité | Action                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------- |
| P1       | Supprimer les 2 `any` et typer correctement                                                    |
| P2       | Découper `types/index.ts` en `types/listing.ts`, `types/user.ts`, `types/transaction.ts`, etc. |

---

## 4. 🟡 GESTION D'ERREURS — Score 5/10

### Points positifs ✅

- Routes API : Toutes les 7 routes identifiées ont un `try/catch`
- Validation Zod : Présente et bien testée (130 tests)
- Toast notifications via `sonner` configuré globalement
- `error.tsx` et `not-found.tsx` présents au niveau app

### Points à améliorer ⚠️

- **`console.log` en production** dans 3 fichiers :
  - `src/lib/services/verification.ts`
  - `src/app/api/webhooks/stripe/route.ts`
  - `src/app/api/webhooks/stripe-identity/route.ts`
    → Violation de la règle utilisateur : _"❌ Pas de console.log en production"_
- **Pas de loading states uniformes** : Le `<Skeleton />` de Shadcn est utilisé uniquement dans 5 des 8 dossiers de composants features.
- **Toast sur les actions** : `toast` n'est importé que dans `lib/utils/toast.ts` → Pas utilisé dans les composants de manière systématique.
- **Pas d'état vide** : Aucun composant `EmptyState` générique pour les listes/tableaux vides.

### 🎯 Actions recommandées

| Priorité | Action                                                                    | Skill                  |
| -------- | ------------------------------------------------------------------------- | ---------------------- |
| P0       | Remplacer tous les `console.log` par un logger structuré ou les supprimer | `systematic-debugging` |
| P1       | Créer un composant `EmptyState` réutilisable                              | `writing-plans`        |
| P1       | Ajouter les Loading Skeleton manquants dans les composants sans           | —                      |
| P2       | Intégrer les toasts systématiquement sur toutes les actions utilisateur   | —                      |

---

## 5. 🟡 DEBUGGING SYSTÉMATIQUE — Score 4/10

### Constat

L'historique des conversations montre un **pattern de debugging ad-hoc et réactif** :

- 5+ conversations dédiées au fix de bugs (auth, layout, hydration)
- Conversations intitulées "Fixing..." montrant des corrections itératives
- Bugs récurrents sur l'authentification (callback, cookies, sessions)

### Manquant

- ❌ Pas de logging structuré (console.log brut)
- ❌ Pas de monitoring (Sentry DSN vide dans `.env.example`)
- ❌ Pas de tests de régression après les fixes
- ❌ Pas d'instrumentation des composants pour tracer les erreurs

### 🎯 Actions recommandées

| Priorité | Action                                                            | Skill                     |
| -------- | ----------------------------------------------------------------- | ------------------------- |
| P0       | Configurer Sentry pour le monitoring d'erreurs                    | `systematic-debugging`    |
| P1       | Créer un service logger dédié remplaçant console.log              | `systematic-debugging`    |
| P1       | Pour chaque bug futur : écrire un test de régression AVANT le fix | `test-driven-development` |
| P2       | Ajouter des Error Boundaries React autour des routes              | —                         |

---

## 6. 🟢 VÉRIFICATION AVANT COMPLÉTION — Score 7/10

### Résultats de vérification actuels ✅

```
✅ pnpm typecheck  → 0 erreur
✅ pnpm test       → 205 tests passants (3 fichiers)
✅ pnpm lint       → 0 erreur, 3 warnings mineurs
✅ pnpm build      → Exit code 0 (succès)
```

### Warnings lint à corriger

1. `page.tsx:202` — `_liveFeedIndex` : variable assignée mais jamais utilisée
2. `CorridorsPage.tsx:99` — `currentEventIndex` : idem
3. `Avatar.tsx:34` — Utilisation de `<img>` au lieu de `<Image />` de Next.js

### 🎯 Actions recommandées

| Priorité | Action                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| P1       | Corriger les 3 warnings ESLint                                                      |
| P2       | Ajouter un pre-commit hook qui exécute lint + typecheck + test (husky est installé) |

---

## 7. 🟡 PLANS D'IMPLÉMENTATION — Score 3/10

### Constat

- ❌ Aucun dossier `docs/plans/` existant
- ❌ Pas de documentation de design/architecture
- ❌ Pas de plan d'implémentation pour les features en cours
- Le développement semble être fait **au fil de l'eau** sans plan structuré

### 🎯 Actions recommandées

| Priorité | Action                                                         | Skill                             |
| -------- | -------------------------------------------------------------- | --------------------------------- |
| P0       | Créer le dossier `docs/plans/`                                 | `writing-plans`                   |
| P0       | Pour chaque prochaine feature, créer un plan AVANT de coder    | `brainstorming` → `writing-plans` |
| P1       | Documenter l'architecture actuelle dans `docs/ARCHITECTURE.md` | `brainstorming`                   |

---

## 8. 🟡 GIT WORKFLOW — Score 5/10

### Points positifs ✅

- Husky installé (pre-commit hooks)
- lint-staged configuré (eslint + prettier)
- `.gitignore` correct

### Manquant ⚠️

- ❌ Pas d'utilisation de git worktrees pour le développement parallèle
- ❌ Pas de convention de commit structurée visible (Conventional Commits)
- ❌ Pas de branches feature/fix/chore

### 🎯 Actions recommandées

| Priorité | Action                                              | Skill                    |
| -------- | --------------------------------------------------- | ------------------------ |
| P1       | Adopter Conventional Commits (feat:, fix:, chore:)  | `using-git-worktrees`    |
| P2       | Utiliser des worktrees pour les features parallèles | `using-git-worktrees`    |
| P2       | Configurer un workflow de PR + code review          | `requesting-code-review` |

---

## 9. 🟢 SEO & PWA — Score 7/10

### Points positifs ✅

- `robots.ts` et `sitemap.ts` correctement implémentés
- Metadata SEO complète dans `layout.tsx` (title, description, keywords)
- PWA configurée (`manifest.ts`, `apple-icon.tsx`, `icon.tsx`)
- `viewport` avec themeColor Akiri
- Page `offline` existante

### Points à améliorer ⚠️

- `sitemap.ts` ne couvre que 5 URLs → manque `/faq`, `/securite`, `/contact`, `/cgu`, `/confidentialite`, `/mentions`
- Pas d'Open Graph images dynamiques
- Pas de `<meta>` description par page (seule la page racine en a)

### 🎯 Actions recommandées

| Priorité | Action                                                |
| -------- | ----------------------------------------------------- |
| P1       | Compléter le sitemap avec toutes les pages publiques  |
| P2       | Ajouter des metadata `generateMetadata()` par page    |
| P2       | Créer un OG Image dynamique via `opengraph-image.tsx` |

---

## 10. 🟡 SÉCURITÉ — Score 5/10

### Points positifs ✅

- Variables sensibles dans `.env` (Stripe, Supabase keys)
- Auth Supabase avec middleware
- `.env.example` documenté proprement
- Webhook Stripe avec vérification de signature

### Points à améliorer ⚠️

- **Routes API non protégées uniformément** : Certaines routes n'ont pas de vérification d'authentification
- **Pas de rate limiting** sur les API routes
- **Pas de CSP (Content Security Policy)**
- **Pas de validation Zod sur toutes les entrées API** (seulement sur les formulaires)

### 🎯 Actions recommandées

| Priorité | Action                                                         |
| -------- | -------------------------------------------------------------- |
| P0       | Ajouter auth check sur toutes les routes API protégées         |
| P1       | Implémenter le rate limiting (ex: `next-rate-limit`)           |
| P2       | Ajouter les headers de sécurité dans `next.config.ts`          |
| P2       | Valider avec Zod tous les `request.json()` dans les routes API |

---

## 📋 Plan d'Action Global — Par Ordre de Priorité

### 🔴 P0 — URGENT (Semaine 1)

1. **Supprimer les `console.log`** en production (3 fichiers)
2. **Écrire les tests pour `transactions.ts`** (logique escrow/paiement)
3. **Écrire les tests pour `verification.ts`** (logique KYC)
4. **Supprimer les 2 `any` TypeScript**
5. **Protéger toutes les routes API** avec auth Supabase

### 🟡 P1 — IMPORTANT (Semaine 2-3)

6. **Découper `page.tsx`** (1021 → 8 composants de ~120 lignes)
7. **Configurer Sentry** pour le monitoring
8. **Tests pour les routes API** webhooks
9. **Compléter le sitemap**
10. **Corriger les 3 warnings ESLint**
11. **Créer `docs/plans/` et `docs/ARCHITECTURE.md`**

### 🟢 P2 — AMÉLIORATION (Semaine 4+)

12. Refactorer les 34 fichiers au-dessus de 150 lignes
13. Migrer vers Server Actions
14. Ajouter OG Images dynamiques
15. Rate limiting sur les API
16. Découper `types/index.ts` par domaine
17. Créer un composant `EmptyState`

---

## 🛠 Comment Utiliser Superpowers Pour Exécuter Ce Plan

```bash
# 1. Ouvrir OpenCode dans le projet
opencode

# 2. Pour les tests (P0)
> "Je veux écrire les tests pour src/lib/services/transactions.ts en suivant le TDD"
# → Superpowers active automatiquement : brainstorming → writing-plans → test-driven-development

# 3. Pour le refactoring (P1)
> "Découpe src/app/page.tsx en composants de max 150 lignes"
# → Superpowers active : writing-plans → executing-plans

# 4. Pour le debugging (quand un bug survient)
> "J'ai un bug dans [description]"
# → Superpowers active : systematic-debugging (4 phases)
```

---

> **Ce document sert de baseline.** Après chaque action complétée, cocher la case correspondante et mettre à jour le score de la dimension concernée.
