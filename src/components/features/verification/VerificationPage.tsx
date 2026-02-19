'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, ShieldCheck, Lock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui';
import { useAuth } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { VerificationBadge } from './VerificationBadge';
import { PhoneVerification } from './PhoneVerification';
import { IdentityVerification } from './IdentityVerification';

interface VerificationLevelCardProps {
  level: 1 | 2 | 3;
  title: string;
  description: string;
  icon: React.ElementType;
  isComplete: boolean;
  isLocked: boolean;
  children?: React.ReactNode;
}

function VerificationLevelCard({
  level,
  title,
  description,
  icon: Icon,
  isComplete,
  isLocked,
  children,
}: VerificationLevelCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        isComplete && 'border-green-200 bg-green-50/50',
        isLocked && 'opacity-60'
      )}
    >
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600">
            <Lock className="h-4 w-4" />
            <span>Complétez le niveau précédent</span>
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isComplete ? 'bg-green-100' : 'bg-neutral-100'
              )}
            >
              <Icon className={cn('h-5 w-5', isComplete ? 'text-green-600' : 'text-neutral-500')} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>Niveau {level}</span>
                {isComplete && (
                  <Badge variant="success" size="sm">
                    Complété
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="font-medium">{title}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-neutral-600">{description}</p>
        {!isLocked && children}
      </CardContent>
    </Card>
  );
}

export function VerificationPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  const handlePhoneVerified = () => {
    // Refresh the page to get updated profile
    router.refresh();
  };

  const handleIdentityStarted = () => {
    // Refresh to show pending state
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-neutral-200" />
            <div className="h-32 rounded-xl bg-neutral-200" />
            <div className="h-48 rounded-xl bg-neutral-200" />
            <div className="h-48 rounded-xl bg-neutral-200" />
            <div className="h-48 rounded-xl bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }

  const verificationLevel = profile?.verification_level || 1;
  const phoneVerified = profile?.phone_verified || false;
  const idStatus = profile?.id_verification_status || 'none';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Vérification du compte</h1>
          <p className="text-neutral-600">
            Augmentez la confiance des utilisateurs en vérifiant votre compte
          </p>
        </div>

        {/* Current Level Badge */}
        <Card className="from-primary-500 to-primary-600 mb-6 bg-gradient-to-r">
          <CardContent className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm opacity-90">Niveau actuel</p>
              <p className="text-2xl font-bold">Niveau {verificationLevel}</p>
            </div>
            <VerificationBadge
              level={verificationLevel as 1 | 2 | 3}
              size="lg"
              className="bg-white/20 text-white"
            />
          </CardContent>
        </Card>

        {/* Verification Levels */}
        <div className="space-y-4">
          {/* Level 1 - Email (always complete via Supabase Auth) */}
          <VerificationLevelCard
            level={1}
            title="Email vérifié"
            description="Votre adresse email a été vérifiée lors de votre inscription."
            icon={Mail}
            isComplete={true}
            isLocked={false}
          >
            <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700">
              <Mail className="h-4 w-4" />
              <span>{profile?.user_id ? 'Email vérifié' : 'Vérifié automatiquement'}</span>
            </div>
          </VerificationLevelCard>

          {/* Level 2 - Phone */}
          <VerificationLevelCard
            level={2}
            title="Téléphone vérifié"
            description="Confirmez votre numéro de téléphone pour une sécurité renforcée."
            icon={Phone}
            isComplete={phoneVerified}
            isLocked={false}
          >
            <PhoneVerification
              isVerified={phoneVerified}
              currentPhone={profile?.phone}
              onVerified={handlePhoneVerified}
            />
          </VerificationLevelCard>

          {/* Level 3 - Identity */}
          <VerificationLevelCard
            level={3}
            title="Identité vérifiée"
            description="Vérifiez votre identité avec une pièce d'identité officielle."
            icon={ShieldCheck}
            isComplete={idStatus === 'verified'}
            isLocked={!phoneVerified}
          >
            <IdentityVerification status={idStatus} onStartVerification={handleIdentityStarted} />
          </VerificationLevelCard>
        </div>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="mb-2 font-medium">Pourquoi se faire vérifier ?</p>
              <ul className="list-inside list-disc space-y-1 text-blue-700">
                <li>Augmentez la confiance des autres utilisateurs</li>
                <li>Accédez à plus de fonctionnalités</li>
                <li>Apparaissez en priorité dans les recherches</li>
                <li>Badge de vérification visible sur votre profil</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
