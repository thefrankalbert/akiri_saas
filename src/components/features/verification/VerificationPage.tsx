'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Envelope, Phone, ShieldCheck, Lock, Info } from '@phosphor-icons/react';
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
        isComplete && 'border-success/20 bg-success/5',
        isLocked && 'opacity-60'
      )}
    >
      {isLocked && (
        <div className="bg-surface-900/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface-700 text-surface-100 flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Lock size={16} />
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
                isComplete ? 'bg-success/10' : 'bg-surface-700'
              )}
            >
              <Icon size={20} className={cn(isComplete ? 'text-success' : 'text-surface-200')} />
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
        <p className="text-surface-100 mb-4 text-sm">{description}</p>
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
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-surface-700 h-6 w-48 rounded" />
          <div className="bg-surface-700 h-32 rounded-xl" />
          <div className="bg-surface-700 h-48 rounded-xl" />
          <div className="bg-surface-700 h-48 rounded-xl" />
          <div className="bg-surface-700 h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const verificationLevel = profile?.verification_level || 1;
  const phoneVerified = profile?.phone_verified || false;
  const idStatus = profile?.id_verification_status || 'none';

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-surface-100 mb-4 inline-flex items-center gap-1 text-sm hover:text-neutral-100"
        >
          <ArrowLeft size={16} />
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100">Vérification du compte</h1>
        <p className="text-surface-100">
          Augmentez la confiance des utilisateurs en vérifiant votre compte
        </p>
      </div>

      {/* Current Level Badge */}
      <Card className="from-primary-600 to-primary-700 mb-6 bg-gradient-to-r">
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
          icon={Envelope}
          isComplete={true}
          isLocked={false}
        >
          <div className="bg-success/10 text-success flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <Envelope size={16} />
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
      <Card className="border-info/20 bg-info/5 mt-6">
        <CardContent className="flex gap-3">
          <Info size={20} className="text-info shrink-0" />
          <div className="text-info text-sm">
            <p className="mb-2 font-medium">Pourquoi se faire vérifier ?</p>
            <ul className="list-inside list-disc space-y-1 opacity-90">
              <li>Augmentez la confiance des autres utilisateurs</li>
              <li>Accédez à plus de fonctionnalités</li>
              <li>Apparaissez en priorité dans les recherches</li>
              <li>Badge de vérification visible sur votre profil</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
