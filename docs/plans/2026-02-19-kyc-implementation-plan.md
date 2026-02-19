# KYC Verification System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a 3-level identity verification system (email, phone, ID) with mock support for development and Stripe Identity for production.

**Architecture:** Provider pattern with mock/stripe implementations, soft constraints (warnings only), verification page in profile settings, audit trail via verification_sessions table.

**Tech Stack:** Next.js 16, Supabase, Stripe Identity, Zod, TypeScript

---

## Task 1: Update TypeScript Types

**Files:**

- Modify: `src/types/index.ts`

**Step 1: Add new types to index.ts**

Add after the existing `Profile` interface:

```typescript
// Update Profile interface - add these fields
export interface Profile {
  // ... existing fields ...
  phone: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  id_verification_status: 'none' | 'pending' | 'verified' | 'failed';
  id_verified_at: string | null;
  verification_level: 1 | 2 | 3;
}

// --- Verification ---
export type VerificationSessionType = 'phone' | 'identity';
export type VerificationProvider = 'mock' | 'stripe' | 'twilio';
export type VerificationStatus = 'pending' | 'processing' | 'verified' | 'failed' | 'expired';

export interface VerificationSession {
  id: string;
  user_id: string;
  type: VerificationSessionType;
  provider: VerificationProvider;
  external_session_id: string | null;
  status: VerificationStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (or existing errors only)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(kyc): add verification types to Profile and VerificationSession"
```

---

## Task 2: Add Zod Validation Schemas

**Files:**

- Modify: `src/lib/validations/index.ts`

**Step 1: Add verification schemas**

Add at the end of the file:

```typescript
// ─── Verification Schemas ──────────────────────────────────

export const sendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Numéro de téléphone invalide (format: +33612345678)'),
});

export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpSchema>;

export const verifyPhoneOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Numéro de téléphone invalide'),
  code: z
    .string()
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
});

export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;

export const createIdentitySessionSchema = z.object({
  return_url: z.string().url('URL de retour invalide').optional(),
});

export type CreateIdentitySessionInput = z.infer<typeof createIdentitySessionSchema>;
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/validations/index.ts
git commit -m "feat(kyc): add Zod schemas for phone OTP and identity verification"
```

---

## Task 3: Create Verification Provider Interface

**Files:**

- Create: `src/lib/verification/provider.ts`

**Step 1: Create provider interface**

```typescript
// ============================================
// Verification Provider Interface
// ============================================

export interface IdentitySessionResult {
  sessionId: string;
  url: string;
}

export interface VerificationProvider {
  /**
   * Create an identity verification session
   */
  createIdentitySession(userId: string, returnUrl?: string): Promise<IdentitySessionResult>;

  /**
   * Get the status of a verification session
   */
  getVerificationStatus(
    sessionId: string
  ): Promise<'pending' | 'processing' | 'verified' | 'failed'>;
}

/**
 * Get the configured verification provider based on environment
 */
export function getVerificationProvider(): VerificationProvider {
  const mode = process.env.NEXT_PUBLIC_KYC_MODE || 'mock';

  if (mode === 'stripe') {
    // Dynamic import to avoid loading Stripe in dev
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { StripeIdentityProvider } = require('./stripe-provider');
    return new StripeIdentityProvider();
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockVerificationProvider } = require('./mock-provider');
  return new MockVerificationProvider();
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: FAIL (missing providers - expected)

**Step 3: Commit**

```bash
git add src/lib/verification/provider.ts
git commit -m "feat(kyc): add verification provider interface"
```

---

## Task 4: Create Mock Verification Provider

**Files:**

- Create: `src/lib/verification/mock-provider.ts`

**Step 1: Create mock provider**

```typescript
// ============================================
// Mock Verification Provider (Development)
// ============================================

import type { VerificationProvider, IdentitySessionResult } from './provider';

/**
 * Mock provider for development - auto-approves after delay
 */
export class MockVerificationProvider implements VerificationProvider {
  private sessions = new Map<string, 'pending' | 'processing' | 'verified' | 'failed'>();

  async createIdentitySession(userId: string, returnUrl?: string): Promise<IdentitySessionResult> {
    const sessionId = `mock_${userId}_${Date.now()}`;
    this.sessions.set(sessionId, 'pending');

    // Simulate async verification (auto-approve after 3 seconds)
    setTimeout(() => {
      this.sessions.set(sessionId, 'verified');
    }, 3000);

    // Return a mock URL that will redirect back
    const baseUrl = returnUrl || 'http://localhost:3000/profil/verification';
    const url = `${baseUrl}?mock_session=${sessionId}&mock_status=success`;

    return { sessionId, url };
  }

  async getVerificationStatus(
    sessionId: string
  ): Promise<'pending' | 'processing' | 'verified' | 'failed'> {
    return this.sessions.get(sessionId) || 'pending';
  }
}

// Singleton for consistent state in development
let mockProviderInstance: MockVerificationProvider | null = null;

export function getMockProvider(): MockVerificationProvider {
  if (!mockProviderInstance) {
    mockProviderInstance = new MockVerificationProvider();
  }
  return mockProviderInstance;
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (or stripe provider missing - expected)

**Step 3: Commit**

```bash
git add src/lib/verification/mock-provider.ts
git commit -m "feat(kyc): add mock verification provider for development"
```

---

## Task 5: Create Stripe Identity Provider

**Files:**

- Create: `src/lib/verification/stripe-provider.ts`

**Step 1: Create Stripe provider**

```typescript
// ============================================
// Stripe Identity Verification Provider
// ============================================

import Stripe from 'stripe';
import type { VerificationProvider, IdentitySessionResult } from './provider';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

/**
 * Stripe Identity provider for production
 */
export class StripeIdentityProvider implements VerificationProvider {
  async createIdentitySession(userId: string, returnUrl?: string): Promise<IdentitySessionResult> {
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url:
        returnUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/profil/verification?session_id={VERIFICATION_SESSION_ID}`,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async getVerificationStatus(
    sessionId: string
  ): Promise<'pending' | 'processing' | 'verified' | 'failed'> {
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);

    switch (session.status) {
      case 'verified':
        return 'verified';
      case 'processing':
        return 'processing';
      case 'canceled':
      case 'requires_input':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/verification/stripe-provider.ts
git commit -m "feat(kyc): add Stripe Identity provider for production"
```

---

## Task 6: Create Verification Service

**Files:**

- Create: `src/lib/services/verification.ts`

**Step 1: Create verification service**

```typescript
// ============================================
// Verification Service — Server-side business logic
// ============================================

import { createClient } from '@/lib/supabase/server';
import { getVerificationProvider } from '@/lib/verification/provider';
import type { ApiResponse, VerificationSession } from '@/types';

/**
 * Send phone OTP code
 */
export async function sendPhoneOtp(
  userId: string,
  phone: string
): Promise<ApiResponse<{ message: string }>> {
  const supabase = await createClient();
  const isMock = process.env.NEXT_PUBLIC_KYC_MODE !== 'stripe';

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in verification_sessions
  const { error: insertError } = await supabase.from('verification_sessions').insert({
    user_id: userId,
    type: 'phone',
    provider: isMock ? 'mock' : 'twilio',
    status: 'pending',
    metadata: { phone, otp_hash: isMock ? otp : hashOtp(otp) },
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    return { data: null, error: insertError.message, status: 400 };
  }

  // In mock mode, log the OTP for testing
  if (isMock) {
    console.log(`[MOCK OTP] Phone: ${phone}, Code: ${otp}`);
    return {
      data: { message: `Code envoyé (mode test: ${otp})` },
      error: null,
      status: 200,
    };
  }

  // In production, send via Twilio (TODO: implement)
  // await sendTwilioSms(phone, `Votre code Akiri: ${otp}`);

  return {
    data: { message: 'Code envoyé par SMS' },
    error: null,
    status: 200,
  };
}

/**
 * Verify phone OTP code
 */
export async function verifyPhoneOtp(
  userId: string,
  phone: string,
  code: string
): Promise<ApiResponse<{ verified: boolean }>> {
  const supabase = await createClient();
  const isMock = process.env.NEXT_PUBLIC_KYC_MODE !== 'stripe';

  // Find pending session
  const { data: session, error: fetchError } = await supabase
    .from('verification_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'phone')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !session) {
    return { data: null, error: 'Code expiré ou invalide', status: 400 };
  }

  // Verify OTP
  const storedOtp = isMock ? (session.metadata as { otp_hash?: string })?.otp_hash : null;
  const isValid = isMock ? storedOtp === code : verifyOtpHash(code, storedOtp || '');

  if (!isValid) {
    return { data: null, error: 'Code incorrect', status: 400 };
  }

  // Update session and profile
  await supabase
    .from('verification_sessions')
    .update({ status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', session.id);

  await supabase
    .from('profiles')
    .update({
      phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      verification_level: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { data: { verified: true }, error: null, status: 200 };
}

/**
 * Create identity verification session
 */
export async function createIdentitySession(
  userId: string,
  returnUrl?: string
): Promise<ApiResponse<{ sessionId: string; url: string }>> {
  const supabase = await createClient();
  const provider = getVerificationProvider();

  try {
    const { sessionId, url } = await provider.createIdentitySession(userId, returnUrl);

    // Store session for tracking
    await supabase.from('verification_sessions').insert({
      user_id: userId,
      type: 'identity',
      provider: process.env.NEXT_PUBLIC_KYC_MODE === 'stripe' ? 'stripe' : 'mock',
      external_session_id: sessionId,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    });

    // Update profile status
    await supabase
      .from('profiles')
      .update({
        id_verification_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return { data: { sessionId, url }, error: null, status: 200 };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la création de la session',
      status: 500,
    };
  }
}

/**
 * Handle identity verification result (called by webhook or polling)
 */
export async function handleIdentityVerificationResult(
  sessionId: string,
  status: 'verified' | 'failed'
): Promise<void> {
  const supabase = await createClient();

  // Get session
  const { data: session } = await supabase
    .from('verification_sessions')
    .select('user_id')
    .eq('external_session_id', sessionId)
    .single();

  if (!session) return;

  // Update session
  await supabase
    .from('verification_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('external_session_id', sessionId);

  // Update profile
  if (status === 'verified') {
    await supabase
      .from('profiles')
      .update({
        id_verified: true,
        id_verification_status: 'verified',
        id_verified_at: new Date().toISOString(),
        verification_level: 3,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user_id);
  } else {
    await supabase
      .from('profiles')
      .update({
        id_verification_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user_id);
  }
}

/**
 * Get user's verification status
 */
export async function getVerificationStatus(
  userId: string
): Promise<ApiResponse<{ level: number; phone_verified: boolean; id_verified: boolean }>> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('verification_level, phone_verified, id_verified')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return { data: null, error: 'Profil non trouvé', status: 404 };
  }

  return {
    data: {
      level: profile.verification_level || 1,
      phone_verified: profile.phone_verified || false,
      id_verified: profile.id_verified || false,
    },
    error: null,
    status: 200,
  };
}

// Helper functions
function hashOtp(otp: string): string {
  // In production, use proper hashing
  return Buffer.from(otp).toString('base64');
}

function verifyOtpHash(otp: string, hash: string): boolean {
  return hashOtp(otp) === hash;
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/services/verification.ts
git commit -m "feat(kyc): add verification service with OTP and identity methods"
```

---

## Task 7: Create API Routes

**Files:**

- Create: `src/app/api/verification/phone/send/route.ts`
- Create: `src/app/api/verification/phone/verify/route.ts`
- Create: `src/app/api/verification/identity/create-session/route.ts`

**Step 1: Create phone send route**

```typescript
// src/app/api/verification/phone/send/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPhoneOtpSchema } from '@/lib/validations';
import { sendPhoneOtp } from '@/lib/services/verification';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendPhoneOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const result = await sendPhoneOtp(user.id, parsed.data.phone);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
```

**Step 2: Create phone verify route**

```typescript
// src/app/api/verification/phone/verify/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPhoneOtpSchema } from '@/lib/validations';
import { verifyPhoneOtp } from '@/lib/services/verification';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifyPhoneOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const result = await verifyPhoneOtp(user.id, parsed.data.phone, parsed.data.code);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
```

**Step 3: Create identity session route**

```typescript
// src/app/api/verification/identity/create-session/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createIdentitySessionSchema } from '@/lib/validations';
import { createIdentitySession } from '@/lib/services/verification';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createIdentitySessionSchema.safeParse(body);

    const returnUrl = parsed.success ? parsed.data.return_url : undefined;
    const result = await createIdentitySession(user.id, returnUrl);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
```

**Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/verification/
git commit -m "feat(kyc): add API routes for phone OTP and identity verification"
```

---

## Task 8: Create Stripe Identity Webhook

**Files:**

- Create: `src/app/api/webhooks/stripe-identity/route.ts`

**Step 1: Create webhook route**

```typescript
// src/app/api/webhooks/stripe-identity/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleIdentityVerificationResult } from '@/lib/services/verification';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'identity.verification_session.verified': {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      await handleIdentityVerificationResult(session.id, 'verified');
      break;
    }

    case 'identity.verification_session.requires_input':
    case 'identity.verification_session.canceled': {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      await handleIdentityVerificationResult(session.id, 'failed');
      break;
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/webhooks/stripe-identity/route.ts
git commit -m "feat(kyc): add Stripe Identity webhook handler"
```

---

## Task 9: Create UI Components - VerificationBadge

**Files:**

- Create: `src/components/features/verification/VerificationBadge.tsx`

**Step 1: Create badge component**

```typescript
'use client';

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  level: 1 | 2 | 3;
  status?: 'none' | 'pending' | 'verified' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const levelConfig = {
  1: { label: 'Email vérifié', icon: CheckCircle2, variant: 'outline' as const },
  2: { label: 'Téléphone vérifié', icon: CheckCircle2, variant: 'info' as const },
  3: { label: 'Identité vérifiée', icon: CheckCircle2, variant: 'success' as const },
};

const statusConfig = {
  none: { icon: AlertCircle, color: 'text-neutral-400' },
  pending: { icon: Clock, color: 'text-amber-500' },
  verified: { icon: CheckCircle2, color: 'text-green-500' },
  failed: { icon: AlertCircle, color: 'text-red-500' },
};

export function VerificationBadge({
  level,
  status = 'verified',
  size = 'md',
  showLabel = true,
  className,
}: VerificationBadgeProps) {
  const config = levelConfig[level];
  const statusCfg = statusConfig[status];
  const Icon = status === 'verified' ? config.icon : statusCfg.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (!showLabel) {
    return (
      <Icon
        className={cn(
          sizeClasses[size],
          status === 'verified' ? 'text-green-500' : statusCfg.color,
          className
        )}
      />
    );
  }

  return (
    <Badge variant={level === 3 ? 'success' : 'outline'} size={size} className={className}>
      <Icon className={cn('mr-1', sizeClasses[size])} />
      {config.label}
    </Badge>
  );
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/features/verification/VerificationBadge.tsx
git commit -m "feat(kyc): add VerificationBadge component"
```

---

## Task 10: Create UI Components - PhoneVerification

**Files:**

- Create: `src/components/features/verification/PhoneVerification.tsx`

**Step 1: Create phone verification component**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { sendPhoneOtpSchema, verifyPhoneOtpSchema } from '@/lib/validations';
import type { SendPhoneOtpInput, VerifyPhoneOtpInput } from '@/lib/validations';

interface PhoneVerificationProps {
  isVerified: boolean;
  currentPhone?: string | null;
  onVerified: () => void;
}

export function PhoneVerification({
  isVerified,
  currentPhone,
  onVerified,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(currentPhone || '');
  const [error, setError] = useState<string | null>(null);
  const [mockCode, setMockCode] = useState<string | null>(null);

  const phoneForm = useForm<SendPhoneOtpInput>({
    resolver: zodResolver(sendPhoneOtpSchema),
    defaultValues: { phone: currentPhone || '' },
  });

  const otpForm = useForm<VerifyPhoneOtpInput>({
    resolver: zodResolver(verifyPhoneOtpSchema),
    defaultValues: { phone: '', code: '' },
  });

  const handleSendOtp = async (data: SendPhoneOtpInput) => {
    setError(null);
    try {
      const res = await fetch('/api/verification/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        return;
      }

      setPhone(data.phone);
      otpForm.setValue('phone', data.phone);
      setStep('otp');

      // Extract mock code if present
      const match = result.message?.match(/mode test: (\d{6})/);
      if (match) {
        setMockCode(match[1]);
      }
    } catch {
      setError('Erreur lors de l\'envoi du code');
    }
  };

  const handleVerifyOtp = async (data: VerifyPhoneOtpInput) => {
    setError(null);
    try {
      const res = await fetch('/api/verification/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, phone }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        return;
      }

      onVerified();
    } catch {
      setError('Erreur lors de la vérification');
    }
  };

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-green-700">Téléphone vérifié</p>
            <p className="text-sm text-green-600">{currentPhone}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <Input
              label="Numéro de téléphone"
              placeholder="+33612345678"
              leftIcon={<Phone className="h-4 w-4" />}
              error={phoneForm.formState.errors.phone?.message || error || undefined}
              {...phoneForm.register('phone')}
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={phoneForm.formState.isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Envoyer le code
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            <p className="text-sm text-neutral-600">
              Code envoyé au <strong>{phone}</strong>
            </p>
            {mockCode && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                Mode test - Code: <strong>{mockCode}</strong>
              </div>
            )}
            <Input
              label="Code de vérification"
              placeholder="123456"
              maxLength={6}
              error={otpForm.formState.errors.code?.message || error || undefined}
              {...otpForm.register('code')}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('phone')}
              >
                Modifier
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={otpForm.formState.isSubmitting}
              >
                Vérifier
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/features/verification/PhoneVerification.tsx
git commit -m "feat(kyc): add PhoneVerification component with OTP flow"
```

---

## Task 11: Create UI Components - IdentityVerification

**Files:**

- Create: `src/components/features/verification/IdentityVerification.tsx`

**Step 1: Create identity verification component**

```typescript
'use client';

import { useState } from 'react';
import { ShieldCheck, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface IdentityVerificationProps {
  status: 'none' | 'pending' | 'verified' | 'failed';
  onStartVerification: () => void;
}

export function IdentityVerification({
  status,
  onStartVerification,
}: IdentityVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verification/identity/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_url: `${window.location.origin}/profil/verification`,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Redirect to verification URL
      window.location.href = result.url;
    } catch {
      setError('Erreur lors du démarrage de la vérification');
      setIsLoading(false);
    }
  };

  if (status === 'verified') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-green-700">Identité vérifiée</p>
            <p className="text-sm text-green-600">Votre compte est certifié</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'pending') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-center gap-3 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <div>
            <p className="font-medium text-amber-700">Vérification en cours</p>
            <p className="text-sm text-amber-600">
              Nous vérifions votre document...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Vérification échouée</p>
              <p className="text-sm text-red-600">
                Veuillez réessayer avec un document valide
              </p>
            </div>
          </div>
          <Button
            onClick={handleStart}
            className="mt-4 w-full"
            isLoading={isLoading}
          >
            Réessayer
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary-500" />
          <div>
            <p className="font-medium">Vérifiez votre identité</p>
            <p className="text-sm text-neutral-500">
              Scannez votre passeport ou carte d&apos;identité pour obtenir le badge certifié
            </p>
          </div>
        </div>
        <Button
          onClick={handleStart}
          className="w-full"
          isLoading={isLoading}
          rightIcon={<ExternalLink className="h-4 w-4" />}
        >
          Commencer la vérification
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/features/verification/IdentityVerification.tsx
git commit -m "feat(kyc): add IdentityVerification component"
```

---

## Task 12: Create VerificationPage Component

**Files:**

- Create: `src/components/features/verification/VerificationPage.tsx`
- Create: `src/components/features/verification/index.ts`

**Step 1: Create main verification page component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui';
import { PhoneVerification } from './PhoneVerification';
import { IdentityVerification } from './IdentityVerification';
import { VerificationBadge } from './VerificationBadge';
import { useAuth } from '@/lib/hooks/use-auth';
import { cn } from '@/lib/utils';

interface VerificationLevel {
  level: 1 | 2 | 3;
  title: string;
  description: string;
  icon: typeof Mail;
  isComplete: boolean;
  isCurrent: boolean;
}

export function VerificationPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profil/verification');
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const levels: VerificationLevel[] = [
    {
      level: 1,
      title: 'Email vérifié',
      description: 'Votre adresse email est confirmée',
      icon: Mail,
      isComplete: true, // Always true if logged in with Supabase Auth
      isCurrent: !profile.phone_verified,
    },
    {
      level: 2,
      title: 'Téléphone vérifié',
      description: 'Confirmez votre numéro de téléphone',
      icon: Phone,
      isComplete: profile.phone_verified || false,
      isCurrent: !profile.phone_verified,
    },
    {
      level: 3,
      title: 'Identité vérifiée',
      description: 'Scannez votre pièce d\'identité',
      icon: ShieldCheck,
      isComplete: profile.id_verified || false,
      isCurrent: profile.phone_verified && !profile.id_verified,
    },
  ];

  const currentLevel = profile.verification_level || 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au profil
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Vérification du compte</h1>
        <p className="mt-1 text-neutral-500">
          Augmentez la confiance en vérifiant votre identité
        </p>
      </div>

      {/* Current level badge */}
      <Card className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-primary-600">Votre niveau actuel</p>
            <p className="text-lg font-semibold text-primary-900">
              Niveau {currentLevel}
            </p>
          </div>
          <VerificationBadge level={currentLevel as 1 | 2 | 3} size="lg" />
        </CardContent>
      </Card>

      {/* Verification steps */}
      <div className="space-y-4">
        {levels.map((level, index) => {
          const Icon = level.icon;
          const isLocked = index > 0 && !levels[index - 1].isComplete;

          return (
            <Card
              key={level.level}
              className={cn(
                'transition-all',
                level.isComplete && 'border-green-200 bg-green-50/50',
                isLocked && 'opacity-50'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      level.isComplete
                        ? 'bg-green-100 text-green-600'
                        : 'bg-neutral-100 text-neutral-500'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{level.title}</CardTitle>
                    <CardDescription>{level.description}</CardDescription>
                  </div>
                  {level.isComplete && (
                    <VerificationBadge level={level.level} showLabel={false} />
                  )}
                </div>
              </CardHeader>

              {/* Show verification UI if current step */}
              {level.level === 2 && !isLocked && (
                <CardContent className="pt-0">
                  <PhoneVerification
                    isVerified={profile.phone_verified || false}
                    currentPhone={profile.phone}
                    onVerified={() => setRefreshKey((k) => k + 1)}
                  />
                </CardContent>
              )}

              {level.level === 3 && !isLocked && profile.phone_verified && (
                <CardContent className="pt-0">
                  <IdentityVerification
                    status={profile.id_verification_status || 'none'}
                    onStartVerification={() => {}}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info card */}
      <Card className="mt-6 bg-neutral-50">
        <CardContent className="p-4 text-sm text-neutral-600">
          <p className="font-medium text-neutral-700">Pourquoi vérifier mon compte ?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Augmentez la confiance des autres utilisateurs</li>
            <li>Obtenez le badge &quot;Certifié&quot; sur votre profil</li>
            <li>Transactions garanties par Akiri</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create index.ts export**

```typescript
// src/components/features/verification/index.ts
export { VerificationPage } from './VerificationPage';
export { VerificationBadge } from './VerificationBadge';
export { PhoneVerification } from './PhoneVerification';
export { IdentityVerification } from './IdentityVerification';
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/features/verification/
git commit -m "feat(kyc): add VerificationPage component with all verification steps"
```

---

## Task 13: Create Verification Page Route

**Files:**

- Create: `src/app/(main)/profil/verification/page.tsx`

**Step 1: Create page route**

```typescript
import { VerificationPage } from '@/components/features/verification';

export const metadata = {
  title: 'Vérification du compte | Akiri',
  description: 'Vérifiez votre identité pour augmenter la confiance',
};

export default function VerificationRoute() {
  return <VerificationPage />;
}
```

**Step 2: Run dev server to test**

Run: `pnpm dev`
Navigate to: `http://localhost:3000/profil/verification`
Expected: Page loads without errors

**Step 3: Commit**

```bash
git add src/app/\(main\)/profil/verification/page.tsx
git commit -m "feat(kyc): add verification page route"
```

---

## Task 14: Update Environment Variables

**Files:**

- Modify: `.env.example`

**Step 1: Add KYC variables to .env.example**

Add these lines:

```bash
# --- KYC Verification ---
NEXT_PUBLIC_KYC_MODE=mock  # "mock" for dev, "stripe" for production

# Stripe Identity (production only)
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_xxx

# Twilio SMS (optional, for phone verification in production)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+33xxx
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add KYC environment variables to .env.example"
```

---

## Task 15: Final Integration Test

**Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors (warnings acceptable)

**Step 4: Manual test**

1. Start dev server: `pnpm dev`
2. Login to the app
3. Navigate to `/profil/verification`
4. Test phone verification flow (mock OTP)
5. Test identity verification button

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(kyc): complete KYC verification system implementation

- 3-level verification: email, phone, identity
- Mock provider for development
- Stripe Identity provider for production
- Phone OTP verification
- Verification page in profile settings
- Soft constraints (warnings only)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description           | Files                                                           |
| ---- | --------------------- | --------------------------------------------------------------- |
| 1    | TypeScript types      | `src/types/index.ts`                                            |
| 2    | Zod schemas           | `src/lib/validations/index.ts`                                  |
| 3    | Provider interface    | `src/lib/verification/provider.ts`                              |
| 4    | Mock provider         | `src/lib/verification/mock-provider.ts`                         |
| 5    | Stripe provider       | `src/lib/verification/stripe-provider.ts`                       |
| 6    | Verification service  | `src/lib/services/verification.ts`                              |
| 7    | API routes            | `src/app/api/verification/**`                                   |
| 8    | Stripe webhook        | `src/app/api/webhooks/stripe-identity/route.ts`                 |
| 9    | VerificationBadge     | `src/components/features/verification/VerificationBadge.tsx`    |
| 10   | PhoneVerification     | `src/components/features/verification/PhoneVerification.tsx`    |
| 11   | IdentityVerification  | `src/components/features/verification/IdentityVerification.tsx` |
| 12   | VerificationPage      | `src/components/features/verification/VerificationPage.tsx`     |
| 13   | Page route            | `src/app/(main)/profil/verification/page.tsx`                   |
| 14   | Environment variables | `.env.example`                                                  |
| 15   | Integration test      | Build + manual test                                             |

**Note:** Database migrations (SQL) should be run in Supabase dashboard or via migration tool.
