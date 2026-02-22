'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { GlobeSimple } from '@phosphor-icons/react';

const localeNames: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const toggle = async () => {
    const next = locale === 'fr' ? 'en' : 'fr';

    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });

    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="text-surface-200 hover:text-primary-400 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
      title="Changer la langue"
    >
      <GlobeSimple size={16} weight="duotone" />
      {localeNames[locale] || 'FR'}
    </button>
  );
}
