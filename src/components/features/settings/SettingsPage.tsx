'use client';

import { useState } from 'react';
import { UnderlineTabs, Shimmer } from '@/components/ui';
import { useAuth } from '@/lib/hooks';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { PhoneVerification } from '@/components/features/verification';
import { IdentityVerification } from '@/components/features/verification';

const tabs = [
  { id: 'profile', label: 'Profil' },
  { id: 'verification', label: 'Vérification' },
  { id: 'account', label: 'Compte' },
];

export function SettingsPage() {
  const { profile, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Shimmer className="mb-6 h-8 w-48" />
        <Shimmer className="mb-4 h-10 w-full" />
        <Shimmer className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-neutral-900">Paramètres</h1>

      <UnderlineTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'profile' && <ProfileSettingsTab profile={profile} />}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            <PhoneVerification
              isVerified={profile?.phone_verified || false}
              currentPhone={profile?.phone}
            />
            <IdentityVerification status={profile?.id_verification_status || 'none'} />
          </div>
        )}

        {activeTab === 'account' && <AccountSettingsTab email={user?.email || ''} />}
      </div>
    </div>
  );
}
