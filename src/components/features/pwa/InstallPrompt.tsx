'use client';

import { useState, useEffect } from 'react';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user already dismissed the prompt
    const dismissed = localStorage.getItem('akiri-install-dismissed');
    if (dismissed) return;

    // Check if app is already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('akiri-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="animate-in slide-in-from-bottom fixed right-4 bottom-20 left-4 z-50 md:right-4 md:bottom-4 md:left-auto md:w-96">
      <div className="bg-surface-800 rounded-2xl border border-white/[0.08] p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="bg-primary-500/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <DownloadSimple className="text-primary-400" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-100">Installer Akiri</h3>
            <p className="text-surface-100 mt-0.5 text-sm">
              Installez l&apos;application pour un acc&egrave;s rapide depuis votre &eacute;cran
              d&apos;accueil.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleInstall}>
                Installer
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Plus tard
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-surface-200 hover:bg-surface-700 shrink-0 rounded-lg p-1 hover:text-neutral-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
