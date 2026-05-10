# Rapport d'Audit de Securite — Akiri

**Date** : 2026-03-24
**Auditeur** : Security Engineer (Agent IA)
**Perimetre** : Code source complet du projet Akiri (branche `fix/responsive-design-and-build`)
**Score global** : **A RISQUE**

---

## Table des matieres

1. [Resume executif](#1-resume-executif)
2. [Checklist OWASP Top 10](#2-checklist-owasp-top-10)
3. [Vulnerabilites identifiees](#3-vulnerabilites-identifiees)
4. [Headers de securite](#4-headers-de-securite)
5. [Audit de l'authentification et des sessions](#5-audit-de-lauthentification-et-des-sessions)
6. [Audit des API Routes](#6-audit-des-api-routes)
7. [Audit des dependances](#7-audit-des-dependances)
8. [Secrets et donnees sensibles](#8-secrets-et-donnees-sensibles)
9. [Conformite RGPD](#9-conformite-rgpd)
10. [Plan de remediation priorise](#10-plan-de-remediation-priorise)

---

## 1. Resume executif

Le projet Akiri presente une architecture de securite **globalement correcte** avec des bonnes pratiques appliquees dans plusieurs domaines (headers HTTP, validation Zod, webhook signature verification, rate limiting). Cependant, **plusieurs vulnerabilites critiques et hautes** ont ete identifiees qui necessitent une correction avant mise en production.

### Points forts

- Headers de securite complets (HSTS, CSP, X-Frame-Options, etc.)
- Validation systematique des entrees avec Zod sur la majorite des API routes
- Verification des signatures Stripe sur les webhooks avec idempotency check
- Rate limiting sur les endpoints sensibles (OTP, refund, confirmation)
- Magic bytes validation sur les uploads de fichiers
- OTP hashe en SHA-256 avant stockage (verification service)
- Utilisation de `crypto.randomInt()` pour la generation de codes
- Service d'erreur centralise empechant les fuites d'information

### Points critiques

- Absence totale de middleware Next.js (pas de protection des routes)
- Codes de confirmation stockes en clair dans la base
- Open redirect dans le callback d'authentification
- Injection potentielle dans la recherche admin (ilike non sanitise)
- Admin layout sans protection serveur (client-only)
- CSP avec `'unsafe-eval'` et `'unsafe-inline'`
- Pas de rate limiting sur la majorite des endpoints

---

## 2. Checklist OWASP Top 10

| #   | Categorie                          | Statut           | Details                                                                                                                                                                                                                                               |
| --- | ---------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Broken Access Control              | **NON-CONFORME** | Pas de middleware pour proteger les routes. Admin layout client-only sans guard serveur. Offres GET publique sans auth.                                                                                                                               |
| A02 | Cryptographic Failures             | **PARTIEL**      | OTP phone hashe (SHA-256), mais codes de confirmation de livraison stockes en clair. SHA-256 sans sel pour OTP.                                                                                                                                       |
| A03 | Injection (SQL, XSS, CSRF)         | **PARTIEL**      | Supabase query builder previent l'injection SQL directe. Recherche admin avec `ilike` non sanitisee. Pas de token CSRF explicite (compense partiellement par SameSite cookies). Un seul usage de `dangerouslySetInnerHTML` pour JSON-LD (acceptable). |
| A04 | Insecure Design                    | **PARTIEL**      | Architecture de services bien decouplee. Etat machine pour les statuts de demande. Mais pas de timeout d'inactivite de session configure. Pas de verification de session cote middleware.                                                             |
| A05 | Security Misconfiguration          | **PARTIEL**      | Headers bien configures. Mais `'unsafe-eval'` et `'unsafe-inline'` dans le CSP. Health endpoint expose la presence/absence des cles API.                                                                                                              |
| A06 | Vulnerable Components              | **NON VERIFIE**  | `pnpm audit` non executable dans cet environnement. Le lockfile est present. Dependencies a jour.                                                                                                                                                     |
| A07 | Authentication Failures            | **PARTIEL**      | Auth deleguee a Supabase (bien). Rate limit sur OTP. Mais pas de rate limit sur `/login`. Mot de passe min 8 caracteres avec complexite. Demo session via localStorage contournable.                                                                  |
| A08 | Data Integrity Failures            | **CONFORME**     | Webhooks Stripe verifies avec signature + idempotency. Transitions d'etats validees par state machine.                                                                                                                                                |
| A09 | Logging & Monitoring Failures      | **PARTIEL**      | Logging via Sentry en production. Breadcrumbs pour info. Pas de retention specifiee a 90 jours. Pas d'audit trail pour les actions admin.                                                                                                             |
| A10 | Server-Side Request Forgery (SSRF) | **CONFORME**     | Pas de requete HTTP sortante construite a partir d'input utilisateur. URLs de retour validees par schema Zod.                                                                                                                                         |

---

## 3. Vulnerabilites identifiees

### CRITIQUE

#### SEC-001 : Absence de middleware Next.js — Routes non protegees

- **Fichier** : `src/middleware.ts` (absent)
- **Impact** : Toutes les routes sous `/(main)/` et `/admin/` sont accessibles sans authentification cote serveur. La protection repose uniquement sur les appels API individuels et le rendu client.
- **Risque** : Un utilisateur non authentifie peut acceder aux pages du dashboard, admin, messages, etc. Meme si les donnees ne sont pas chargees (les API retournent 401), les pages et composants sont servis.
- **Recommandation** : Creer un `src/middleware.ts` qui verifie la session Supabase et redirige les utilisateurs non authentifies.

#### SEC-002 : Codes de confirmation de livraison stockes en clair

- **Fichier** : `src/lib/services/requests.ts` (ligne 128)
- **Impact** : Les codes de confirmation a 6 chiffres sont stockes en clair dans la table `confirmation_codes`. Un acces en lecture a la base (fuite, backup non chiffre, admin malveillant) permet de confirmer n'importe quelle livraison et declencher le versement.
- **Risque** : Fraude financiere. Liberation non autorisee de l'escrow.
- **Recommandation** : Hasher les codes avec SHA-256 (comme deja fait pour les OTP dans `verification.ts`). Comparer `hashCode(submitted) === stored_hash`.

#### SEC-003 : Open redirect dans le callback auth

- **Fichier** : `src/app/auth/callback/route.ts` (lignes 12, 25-33)
- **Impact** : Le parametre `next` est pris directement depuis les query params et utilise dans la redirection (`NextResponse.redirect(...${next})`). De plus, le header `x-forwarded-host` est utilise pour construire l'URL de redirection en production.
- **Risque** : Un attaquant peut crafter une URL `?next=https://evil.com` ou injecter un `x-forwarded-host` malveillant pour rediriger un utilisateur apres authentification vers un site de phishing.
- **Recommandation** : Valider que `next` commence par `/` et ne contient pas `//`. Ignorer ou valider strictement `x-forwarded-host` contre une whitelist de domaines autorises.

### HAUTE

#### SEC-004 : Injection dans la recherche admin via ilike

- **Fichier** : `src/lib/services/admin.ts` (ligne 108)
- **Impact** : `query.or(\`first*name.ilike.%${search}%,last_name.ilike.%${search}%\`)`— la valeur`search` provient directement des query params sans sanitisation. Les caracteres speciaux PostgREST (`%`, `*`, `.`, `,`) peuvent etre injectes pour alterer la requete.
- **Risque** : Fuite de donnees via manipulation des filtres. Possible denial of service via requetes couteuses.
- **Recommandation** : Echapper les caracteres speciaux (`%`, `_`, `,`, `.`) dans la valeur `search` avant interpolation. Valider avec un schema Zod (longueur max, caracteres autorises).

#### SEC-005 : Admin layout sans protection serveur

- **Fichier** : `src/app/admin/layout.tsx`
- **Impact** : Le layout admin est un composant serveur qui affiche l'interface admin (sidebar, navigation) sans aucune verification d'authentification ou de role. La verification `requireAdmin()` n'est faite que dans les API routes, pas dans les pages.
- **Risque** : Les pages admin sont rendues pour n'importe quel visiteur. Meme si les donnees ne chargent pas, la structure de l'admin est exposee.
- **Recommandation** : Ajouter une verification serveur dans le layout admin (ou via middleware) qui redirige les non-admins.

#### SEC-006 : Pas de rate limiting sur les endpoints critiques

- **Fichiers concernes** :
  - `src/app/api/payments/checkout/route.ts` — pas de rate limit
  - `src/app/api/listings/route.ts` POST — pas de rate limit
  - `src/app/api/messages/route.ts` POST — pas de rate limit
  - `src/app/api/conversations/route.ts` POST — pas de rate limit
  - `src/app/api/requests/route.ts` POST — pas de rate limit
  - `src/app/api/parcels/route.ts` POST — pas de rate limit
  - `src/app/api/reviews/route.ts` POST — pas de rate limit
  - `src/app/api/connect/onboard/route.ts` — pas de rate limit
- **Impact** : Absence de rate limiting sur la creation de checkout sessions, listings, messages, parcels, etc.
- **Risque** : Abus, spam, depletion de ressources, attaques par force brute sur la creation de sessions Stripe.
- **Recommandation** : Ajouter `rateLimit()` sur tous les endpoints POST avec des limites adaptees a chaque cas d'usage.

#### SEC-007 : CSP avec 'unsafe-eval' et 'unsafe-inline'

- **Fichier** : `next.config.ts` (lignes 37-38)
- **Impact** : La directive `script-src` inclut `'unsafe-eval'` et `'unsafe-inline'` ce qui reduit significativement l'efficacite du Content Security Policy contre les attaques XSS.
- **Risque** : Un XSS stocke ou reflete pourrait executer du code arbitraire malgre le CSP.
- **Recommandation** : Remplacer `'unsafe-inline'` par des nonces ou hashes. Supprimer `'unsafe-eval'` si possible (evaluer si Stripe.js en a besoin). Utiliser `'strict-dynamic'` si necessaire.

### MOYENNE

#### SEC-008 : Health endpoint expose l'etat des services

- **Fichier** : `src/app/api/health/route.ts`
- **Impact** : L'endpoint `/api/health` retourne la presence ou l'absence des cles Stripe et Resend sans authentification.
- **Risque** : Reconnaissance facilitee par un attaquant qui peut determiner quels services sont configures.
- **Recommandation** : Retourner uniquement `healthy`/`degraded` sans les details des checks, ou proteger l'endpoint par authentification admin.

#### SEC-009 : Notifications subscribe — body non valide par Zod

- **Fichier** : `src/app/api/notifications/subscribe/route.ts` (ligne 17)
- **Impact** : `await request.json()` est appele directement sans validation Zod. Seul `subscription.endpoint` est verifie de facon minimale.
- **Risque** : Donnees malformees stockees dans la base, potentiel DoS via payloads de taille arbitraire.
- **Recommandation** : Ajouter un schema Zod pour valider l'objet `subscription` complet (endpoint, keys, etc.).

#### SEC-010 : PATCH /api/admin/users — body non valide par Zod

- **Fichier** : `src/app/api/admin/users/route.ts` (ligne 37)
- **Impact** : `await request.json()` est appele directement. La validation est manuelle (`if (!user_id || !action)`).
- **Risque** : Injection de proprietes inattendues. Format non controle.
- **Recommandation** : Utiliser `parseBody()` avec un schema Zod pour `user_id` (uuid) et `action` (enum).

#### SEC-011 : PATCH /api/admin/disputes — body non valide par Zod

- **Fichier** : `src/app/api/admin/disputes/route.ts` (ligne 35)
- **Impact** : Meme probleme que SEC-010.
- **Recommandation** : Ajouter validation Zod.

#### SEC-012 : PATCH /api/parcels/[id] — body non valide par Zod

- **Fichier** : `src/app/api/parcels/[id]/route.ts` (ligne 27)
- **Impact** : `await request.json()` direct, verification manuelle de `body.status`.
- **Recommandation** : Ajouter validation Zod pour le champ `status` (enum des statuts valides).

#### SEC-013 : Demo session via localStorage

- **Fichier** : `src/lib/hooks/use-auth.ts` (lignes 21-46)
- **Impact** : Une session "demo" est stockee dans localStorage avec des donnees utilisateur/profil en JSON. Elle est traitee comme une session authentique cote client.
- **Risque** : Un attaquant peut crafted une fausse session demo dans localStorage pour se faire passer pour n'importe quel utilisateur cote client. Mitige par le fait que les API verifient auth server-side.
- **Recommandation** : S'assurer qu'aucune action sensible ne se base sur `isDemo` cote client sans re-verification serveur. Idealement, supprimer ce mecanisme en production.

#### SEC-014 : Confirmation code envoye en clair par email

- **Fichier** : `src/app/api/webhooks/stripe/route.ts` (lignes 105-131)
- **Impact** : Le code de confirmation est lu en clair depuis la base et envoye par email. Comme le code est stocke en clair (SEC-002), cela signifie qu'il transite en clair a travers la chaine complete.
- **Risque** : Amplification de SEC-002 — un compromis de la base permet de connaitre les codes.
- **Recommandation** : Si les codes sont hashes, il faudra les envoyer par email au moment de la creation uniquement (pas depuis le webhook).

### BASSE

#### SEC-015 : Signed URL chat-media valide 1 an

- **Fichier** : `src/app/api/chat/upload/route.ts` (ligne 80)
- **Impact** : Les URLs signees pour les medias de chat sont valides pendant 365 jours.
- **Recommandation** : Reduire la duree a quelques heures ou jours. Implementer un rafraichissement a la demande.

#### SEC-016 : Absence de validation UUID sur les parametres d'URL

- **Fichiers** : Plusieurs routes dynamiques (`/api/listings/[id]`, `/api/parcels/[id]`, etc.)
- **Impact** : Les parametres `id` provenant de l'URL ne sont pas valides comme UUID avant d'etre utilises dans les requetes Supabase.
- **Recommandation** : Valider le format UUID des parametres dynamiques avant utilisation.

#### SEC-017 : Pas de limite explicite de taille de body JSON

- **Impact** : Next.js a une limite par defaut, mais aucune limite explicite n'est configuree.
- **Recommandation** : Configurer explicitement `bodyParser.sizeLimit` dans les routes sensibles.

---

## 4. Headers de securite

| Header                         | Statut            | Valeur                                         |
| ------------------------------ | ----------------- | ---------------------------------------------- |
| `Strict-Transport-Security`    | PRESENT           | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options`       | PRESENT           | `nosniff`                                      |
| `X-Frame-Options`              | PRESENT           | `DENY`                                         |
| `X-XSS-Protection`             | PRESENT           | `1; mode=block` (obsolete mais inoffensif)     |
| `Referrer-Policy`              | PRESENT           | `strict-origin-when-cross-origin`              |
| `Permissions-Policy`           | PRESENT           | `camera=(), microphone=(), geolocation()`      |
| `Content-Security-Policy`      | PRESENT (DEGRADE) | Contient `'unsafe-eval'` et `'unsafe-inline'`  |
| `Cross-Origin-Opener-Policy`   | ABSENT            | Non configure                                  |
| `Cross-Origin-Embedder-Policy` | ABSENT            | Non configure                                  |
| `Cross-Origin-Resource-Policy` | ABSENT            | Non configure                                  |

**Verdict** : Les headers principaux sont bien configures. Le CSP est degrade par `unsafe-eval`/`unsafe-inline`. Les headers Cross-Origin sont absents.

---

## 5. Audit de l'authentification et des sessions

### Mots de passe

- [x] Complexite minimum : 8 caracteres, 1 majuscule, 1 minuscule, 1 chiffre
- [x] Hashage : Delegue a Supabase (bcrypt par defaut)
- [ ] Politique de rotation : Non definie

### Tokens et sessions

- [x] Session geree par Supabase Auth (cookies httpOnly via `@supabase/ssr`)
- [ ] Expiration de session configurable : Non verifie (depend de la config Supabase)
- [ ] Timeout d'inactivite 30 min : Non verifie cote application
- [ ] Rotation des refresh tokens : Depend de la configuration Supabase

### Protection brute force

- [x] Rate limit sur `/api/verification/phone/send` (3 req/min)
- [x] Rate limit sur `/api/verification/phone/verify` (5 req/min)
- [x] Rate limit sur `/api/payments/refund` (3 req/min)
- [x] Rate limit sur `/api/requests/[id]/confirm` (5 req/min)
- [ ] Rate limit sur login : ABSENT (SEC-006)
- [ ] Rate limit sur register : ABSENT
- [ ] Rate limit sur reset-password : ABSENT

### Cookies

- [x] Gestion via `@supabase/ssr` qui configure `Secure`, `HttpOnly`, `SameSite` automatiquement
- [ ] Flags explicitement verifies dans le code : Non (depend de Supabase SSR)

---

## 6. Audit des API Routes

### Synthese par endpoint

| Endpoint                              | Auth       | Rate Limit | Zod Validation | Remarques                          |
| ------------------------------------- | ---------- | ---------- | -------------- | ---------------------------------- |
| `POST /api/payments/checkout`         | OK         | **ABSENT** | OK             | Devrait avoir rate limit           |
| `POST /api/payments/refund`           | OK         | OK (3/min) | OK             |                                    |
| `POST /api/listings`                  | OK         | **ABSENT** | OK             |                                    |
| `GET /api/listings`                   | Public     | N/A        | OK             | Correct (public)                   |
| `PATCH /api/listings/[id]`            | OK         | **ABSENT** | OK (partial)   |                                    |
| `POST /api/messages`                  | OK         | **ABSENT** | OK             | Spam risk                          |
| `POST /api/conversations`             | OK         | **ABSENT** | OK             |                                    |
| `POST /api/requests`                  | OK         | **ABSENT** | OK             |                                    |
| `POST /api/requests/[id]/confirm`     | OK         | OK (5/min) | OK             |                                    |
| `POST /api/reviews`                   | OK         | **ABSENT** | OK             |                                    |
| `POST /api/parcels`                   | OK         | **ABSENT** | OK             |                                    |
| `PATCH /api/parcels/[id]`             | OK         | **ABSENT** | **ABSENT**     | SEC-012                            |
| `POST /api/parcels/[id]/offers`       | OK         | **ABSENT** | OK             |                                    |
| `GET /api/parcels/[id]/offers`        | **PUBLIC** | N/A        | N/A            | Pas d'auth requise                 |
| `POST /api/notifications/subscribe`   | OK         | **ABSENT** | **PARTIEL**    | SEC-009                            |
| `POST /api/connect/onboard`           | OK         | **ABSENT** | N/A            |                                    |
| `POST /api/verification/phone/send`   | OK         | OK (3/min) | OK             |                                    |
| `POST /api/verification/phone/verify` | OK         | OK (5/min) | OK             |                                    |
| `GET /api/admin/*`                    | OK (admin) | **ABSENT** | N/A            |                                    |
| `PATCH /api/admin/users`              | OK (admin) | **ABSENT** | **ABSENT**     | SEC-010                            |
| `PATCH /api/admin/disputes`           | OK (admin) | **ABSENT** | **ABSENT**     | SEC-011                            |
| `POST /api/webhooks/stripe`           | Signature  | N/A        | N/A            | Idempotent, bien securise          |
| `POST /api/webhooks/stripe-identity`  | Signature  | N/A        | N/A            | Bien securise                      |
| `GET /api/health`                     | **PUBLIC** | N/A        | N/A            | SEC-008                            |
| `DELETE /api/profile/delete`          | OK         | **ABSENT** | N/A            | Action destructive sans rate limit |
| `GET /api/profile/export`             | OK         | **ABSENT** | N/A            | RGPD export, pas de rate limit     |

### Webhooks Stripe

- [x] Verification de signature (`constructEvent`)
- [x] Idempotency check (`processed_webhook_events`)
- [x] Retourne 200 meme en cas d'erreur (evite les retries infinis)
- [x] Utilise `request.text()` et non `request.json()` pour la verification de signature

### Upload de fichiers

- [x] Validation du type MIME (whitelist)
- [x] Validation de la taille (5 Mo max)
- [x] Validation des magic bytes
- [x] Extension derivee du MIME type, pas du nom de fichier
- [x] Noms de fichiers generes par UUID (pas d'input utilisateur dans le chemin)
- [x] Verification de participation a la conversation pour les uploads chat

---

## 7. Audit des dependances

### Lock file

- [x] `pnpm-lock.yaml` present et commite

### Dependencies notables

| Package              | Version | Notes                         |
| -------------------- | ------- | ----------------------------- |
| `next`               | 16.1.6  | Derniere version majeure      |
| `react`              | 19.2.3  | Derniere version              |
| `@supabase/ssr`      | 0.8.0   | Gestion securisee des cookies |
| `stripe`             | 20.3.1  | API v2026                     |
| `zod`                | 4.3.6   | Validation schema             |
| `@upstash/ratelimit` | 2.0.8   | Rate limiting Redis           |
| `@sentry/nextjs`     | 10.39.0 | Monitoring/logging            |
| `web-push`           | 3.6.7   | Push notifications            |

### Remarques

- `pnpm audit` n'a pas pu etre execute (permission refusee dans l'environnement d'audit). **Action requise : executer `pnpm audit` manuellement et corriger les vulnerabilites critiques/hautes.**
- Les versions semblent a jour. Pas de dependances manifestement obsoletes.

---

## 8. Secrets et donnees sensibles

### Variables d'environnement

- [x] `.env.local` dans `.gitignore`
- [x] `.env` dans `.gitignore`
- [x] `.env.example` present avec valeurs placeholder (pas de vrais secrets)
- [x] `SUPABASE_SERVICE_ROLE_KEY` reserve au serveur
- [x] Stripe Secret Key et Webhook Secrets non exposes cote client
- [x] VAPID private key non expose cote client

### Secrets dans le code

- [x] Pas de secrets hardcodes identifies dans le code source
- [x] `.sentryclirc` dans `.gitignore`

### Secrets dans l'historique Git

- [ ] Non verifie (necessite un scan `git log` approfondi ou un outil comme `gitleaks`)
- **Recommandation** : Executer `gitleaks detect` sur l'historique complet

### Exposition NEXT*PUBLIC*\*

- `NEXT_PUBLIC_SUPABASE_URL` : OK (public par design)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : OK (cle publique, RLS protege les donnees)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : OK (public par design)
- `NEXT_PUBLIC_SENTRY_DSN` : OK (public par design)
- `NEXT_PUBLIC_POSTHOG_KEY` : OK (public par design)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` : OK (public par design)
- `NEXT_PUBLIC_APP_URL` : OK

---

## 9. Conformite RGPD

| Exigence                     | Statut          | Details                                                                                |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| Droit d'acces (export)       | **CONFORME**    | `GET /api/profile/export` — exporte toutes les donnees utilisateur                     |
| Droit a l'effacement         | **CONFORME**    | `DELETE /api/profile/delete` — anonymise le profil et supprime le compte auth          |
| Consentement cookies         | **CONFORME**    | `<CookieConsent />` present dans le layout                                             |
| Politique de confidentialite | **CONFORME**    | Page `/confidentialite` presente                                                       |
| CGU                          | **CONFORME**    | Page `/cgu` presente                                                                   |
| Mentions legales             | **CONFORME**    | Page `/mentions` presente                                                              |
| Minimisation des donnees     | **PARTIEL**     | L'export retourne toutes les donnees, mais les champs collectes semblent proportionnes |
| Chiffrement en transit       | **CONFORME**    | HSTS force, deploiement Vercel (TLS automatique)                                       |
| Chiffrement au repos         | **NON VERIFIE** | Depend de la configuration Supabase (PostgreSQL encryption at rest)                    |
| Retention des donnees        | **NON DEFINIE** | Pas de politique de retention des donnees identifiee                                   |

---

## 10. Plan de remediation priorise

### Priorite 1 — CRITIQUE (a corriger avant mise en production)

| #   | Action                                                                                                                                        | Effort | Impact                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------ |
| 1   | **Creer `src/middleware.ts`** pour proteger les routes authentifiees et admin (SEC-001)                                                       | 2-3h   | Bloque l'acces non autorise aux pages      |
| 2   | **Hasher les codes de confirmation** dans `requests.ts` comme les OTP dans `verification.ts` (SEC-002)                                        | 1-2h   | Protege l'escrow contre les fuites de base |
| 3   | **Corriger l'open redirect** dans `auth/callback/route.ts` — valider que `next` est un chemin relatif et valider `x-forwarded-host` (SEC-003) | 1h     | Previent le phishing post-auth             |

### Priorite 2 — HAUTE (a corriger dans la premiere semaine)

| #   | Action                                                                                                             | Effort | Impact                                  |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------- |
| 4   | **Sanitiser la recherche admin** — echapper les caracteres speciaux dans le `search` param avant `ilike` (SEC-004) | 30min  | Previent les injections PostgREST       |
| 5   | **Proteger le layout admin** avec verification serveur `requireAdmin()` (SEC-005)                                  | 1h     | Masque l'interface admin aux non-admins |
| 6   | **Ajouter rate limiting** sur tous les endpoints POST sans protection (SEC-006)                                    | 2-3h   | Previent le spam et les abus            |
| 7   | **Ameliorer le CSP** — remplacer `unsafe-inline` par nonces, evaluer la suppression de `unsafe-eval` (SEC-007)     | 3-4h   | Renforce la protection XSS              |

### Priorite 3 — MOYENNE (a corriger dans le premier mois)

| #   | Action                                                                                | Effort   | Impact                                                   |
| --- | ------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| 8   | Proteger ou simplifier le health endpoint (SEC-008)                                   | 30min    | Reduit la surface de reconnaissance                      |
| 9   | Ajouter validation Zod sur les endpoints admin et notifications (SEC-009/010/011/012) | 1-2h     | Renforce l'integrite des donnees                         |
| 10  | Supprimer ou conditionner le mecanisme de demo session en production (SEC-013)        | 30min    | Elimine un vecteur de confusion cote client              |
| 11  | Revoir l'envoi du code de confirmation par email (SEC-014)                            | 1h       | Coherence avec le hashage des codes                      |
| 12  | Ajouter les headers Cross-Origin (COOP, COEP, CORP)                                   | 30min    | Protection supplementaire contre les fuites cross-origin |
| 13  | Executer `pnpm audit` et corriger les vulnerabilites                                  | Variable | Securite des dependances                                 |
| 14  | Executer `gitleaks` sur l'historique Git                                              | 30min    | Detection de secrets commites                            |

### Priorite 4 — BASSE (backlog securite)

| #   | Action                                                           | Effort | Impact                           |
| --- | ---------------------------------------------------------------- | ------ | -------------------------------- |
| 15  | Reduire la duree des signed URLs chat-media (SEC-015)            | 30min  | Minimise l'exposition des medias |
| 16  | Valider les UUID dans les parametres d'URL (SEC-016)             | 1h     | Defense en profondeur            |
| 17  | Definir une politique de retention des donnees                   | 1h     | Conformite RGPD complete         |
| 18  | Configurer les limites de taille de body explicitement (SEC-017) | 30min  | Protection DoS                   |
| 19  | Ajouter un audit trail pour les actions admin                    | 2-3h   | Tracabilite et conformite        |
| 20  | Configurer le timeout de session a 30 min d'inactivite           | 1h     | Conforme aux standards           |

---

## Annexe : Fichiers audites

### API Routes

- `src/app/api/payments/checkout/route.ts`
- `src/app/api/payments/refund/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/webhooks/stripe-identity/route.ts`
- `src/app/api/listings/route.ts`
- `src/app/api/listings/[id]/route.ts`
- `src/app/api/messages/route.ts`
- `src/app/api/conversations/route.ts`
- `src/app/api/conversations/[id]/messages/route.ts`
- `src/app/api/requests/route.ts`
- `src/app/api/requests/[id]/confirm/route.ts`
- `src/app/api/reviews/route.ts`
- `src/app/api/parcels/route.ts`
- `src/app/api/parcels/[id]/route.ts`
- `src/app/api/parcels/[id]/offers/route.ts`
- `src/app/api/parcels/upload/route.ts`
- `src/app/api/chat/upload/route.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/profile/[id]/route.ts`
- `src/app/api/profile/avatar/route.ts`
- `src/app/api/profile/delete/route.ts`
- `src/app/api/profile/export/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/subscribe/route.ts`
- `src/app/api/connect/onboard/route.ts`
- `src/app/api/connect/status/route.ts`
- `src/app/api/verification/phone/send/route.ts`
- `src/app/api/verification/phone/verify/route.ts`
- `src/app/api/verification/identity/create-session/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/transactions/route.ts`
- `src/app/api/admin/disputes/route.ts`
- `src/app/api/health/route.ts`
- `src/app/auth/callback/route.ts`

### Services

- `src/lib/services/admin.ts`
- `src/lib/services/requests.ts`
- `src/lib/services/transactions.ts`
- `src/lib/services/messages.ts`
- `src/lib/services/listings.ts`
- `src/lib/services/verification.ts`
- `src/lib/services/errors.ts`

### Configuration et infrastructure

- `next.config.ts`
- `src/lib/env.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/stripe/index.ts`
- `src/lib/api/rate-limit.ts`
- `src/lib/api/helpers.ts`
- `src/lib/utils/upload-validation.ts`
- `src/lib/validations/index.ts`
- `src/lib/logger.ts`
- `src/lib/hooks/use-auth.ts`
- `src/constants/index.ts`
- `src/app/layout.tsx`
- `src/app/admin/layout.tsx`
- `.gitignore`
- `.env.example`
- `package.json`
