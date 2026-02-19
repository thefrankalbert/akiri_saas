# Design: Système de Vérification d'Identité (KYC)

**Date:** 2026-02-19
**Statut:** Approuvé
**Auteur:** Claude

---

## 1. Objectif

Implémenter un système de vérification d'identité à 3 niveaux pour Akiri, permettant aux utilisateurs de certifier leur compte et d'augmenter la confiance dans la plateforme.

## 2. Principes clés

- **Soft constraints**: Aucune action n'est bloquée, seulement des avertissements
- **Liberté totale**: L'utilisateur peut utiliser l'app sans vérification
- **Garantie Akiri**: Seules les transactions avec des utilisateurs certifiés sont garanties
- **Mode hybride**: Mock en développement, Stripe Identity en production

## 3. Niveaux de vérification

| Niveau | Badge        | Condition                          | Champ DB                |
| ------ | ------------ | ---------------------------------- | ----------------------- |
| 1      | Email ✉️     | Email confirmé via Supabase Auth   | `email_verified` (Auth) |
| 2      | Téléphone 📱 | Code OTP validé                    | `phone_verified`        |
| 3      | Identité 🪪  | Document vérifié (Stripe Identity) | `id_verified`           |

## 4. Architecture

### 4.1 Flux utilisateur

```
Inscription → Email vérifié → Dashboard
                    ↓
         [Banner optionnel: "Complétez votre profil"]
                    ↓
         Paramètres → Vérification du compte
                    ↓
         [Niveau 2: Téléphone] → [Niveau 3: Identité]
```

### 4.2 Avertissement lors des transactions

Quand un utilisateur veut réserver avec un voyageur NON vérifié :

```
┌─────────────────────────────────────┐
│ ⚠️ Ce voyageur n'est pas certifié   │
│                                     │
│ Akiri ne garantit pas les           │
│ transactions avec les comptes       │
│ non vérifiés.                       │
│                                     │
│ [Continuer quand même] [Annuler]    │
└─────────────────────────────────────┘
```

## 5. Fichiers à créer

```
src/
├── app/(main)/profil/verification/page.tsx
├── components/features/verification/
│   ├── VerificationPage.tsx
│   ├── VerificationLevel.tsx
│   ├── PhoneVerification.tsx
│   ├── IdentityVerification.tsx
│   └── VerificationBadge.tsx
├── lib/
│   ├── services/verification.ts
│   └── verification/
│       ├── provider.ts
│       ├── mock-provider.ts
│       └── stripe-provider.ts
└── app/api/
    ├── verification/
    │   ├── phone/send/route.ts
    │   ├── phone/verify/route.ts
    │   └── identity/create-session/route.ts
    └── webhooks/stripe-identity/route.ts
```

## 6. Base de données

### 6.1 Modifications table `profiles`

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(20) DEFAULT 'none'
  CHECK (id_verification_status IN ('none', 'pending', 'verified', 'failed'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_level SMALLINT DEFAULT 1
  CHECK (verification_level BETWEEN 1 AND 3);
```

### 6.2 Nouvelle table `verification_sessions`

```sql
CREATE TABLE verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('phone', 'identity')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('mock', 'stripe', 'twilio')),
  external_session_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_verification_sessions_user ON verification_sessions(user_id);
CREATE INDEX idx_verification_sessions_external ON verification_sessions(external_session_id);
```

## 7. API Routes

| Route                                       | Méthode | Description                   |
| ------------------------------------------- | ------- | ----------------------------- |
| `/api/verification/phone/send`              | POST    | Envoie code OTP               |
| `/api/verification/phone/verify`            | POST    | Vérifie code OTP              |
| `/api/verification/identity/create-session` | POST    | Crée session Stripe Identity  |
| `/api/webhooks/stripe-identity`             | POST    | Webhook résultat vérification |

## 8. Variables d'environnement

```bash
# Mode KYC
NEXT_PUBLIC_KYC_MODE=mock  # "mock" en dev, "stripe" en prod

# Twilio (optionnel, pour SMS)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+33xxx
```

## 9. Provider Pattern

```typescript
interface VerificationProvider {
  createIdentitySession(userId: string): Promise<{ sessionId: string; url: string }>;
  getVerificationStatus(sessionId: string): Promise<'pending' | 'verified' | 'failed'>;
}
```

- **MockProvider**: Approuve automatiquement après 3 secondes (dev)
- **StripeIdentityProvider**: Vérification réelle via Stripe (prod)

## 10. Types TypeScript

```typescript
// Ajout au type Profile existant
interface Profile {
  // ... existants ...
  phone: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  id_verification_status: 'none' | 'pending' | 'verified' | 'failed';
  id_verified_at: string | null;
  verification_level: 1 | 2 | 3;
}

// Nouveau type
interface VerificationSession {
  id: string;
  user_id: string;
  type: 'phone' | 'identity';
  provider: 'mock' | 'stripe' | 'twilio';
  external_session_id: string | null;
  status: 'pending' | 'processing' | 'verified' | 'failed' | 'expired';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}
```

## 11. Standards industrie respectés

- **Audit trail**: Table `verification_sessions` pour traçabilité RGPD
- **Timestamps**: Preuves horodatées de vérification
- **Provider agnostic**: Facilite switch entre fournisseurs
- **Pas de PII stocké**: Documents restent chez Stripe (conformité)
- **Expiration**: Sessions expirent pour sécurité

---

**Prochaine étape:** Plan d'implémentation détaillé
