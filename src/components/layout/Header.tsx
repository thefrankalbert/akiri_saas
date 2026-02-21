'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  List,
  X,
  MagnifyingGlass,
  Bell,
  ChatCircle,
  SignOut,
  TestTube,
  ArrowLeft,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { APP_NAME } from '@/constants';
import { useAuth } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isDemo, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-surface-950/80 sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl md:ml-16 lg:ml-60">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="border-warning/20 bg-warning/10 text-warning border-b px-4 py-1.5 text-center text-sm font-medium">
          <TestTube weight="duotone" size={16} className="mr-1.5 inline-block" />
          Mode Demonstration — Les donnees sont simulees
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Back button + Logo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.back()}
            className="text-surface-200 hover:bg-surface-800 rounded-lg p-2 transition-colors duration-150 hover:text-neutral-100 md:hidden"
            aria-label="Retour"
          >
            <ArrowLeft weight="bold" size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <div className="from-primary-500 to-primary-600 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold text-neutral-100">{APP_NAME}</span>
          </Link>
        </div>

        {/* Desktop Actions (simplified — sidebar handles main nav) */}
        <div className="hidden items-center gap-2 md:flex">
          <button className="text-surface-200 hover:bg-surface-800 rounded-lg p-2 transition-colors duration-150 hover:text-neutral-100">
            <MagnifyingGlass weight="duotone" size={20} />
          </button>
          <button className="text-surface-100 hover:bg-surface-800 relative rounded-lg p-2 transition-colors duration-150 hover:text-neutral-100">
            <Bell weight="duotone" size={20} />
          </button>
          {!isAuthenticated && (
            <>
              <div className="mx-2 h-6 w-px bg-white/[0.06]" />
              <Link
                href="/login"
                className="text-surface-100 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 hover:text-neutral-100"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="from-primary-500 to-primary-600 hover:shadow-glow-primary rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-medium text-white transition-all duration-150"
              >
                Publier une annonce
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2.5 text-neutral-200 transition-colors duration-150 hover:text-neutral-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X weight="bold" size={24} /> : <List weight="duotone" size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="bg-surface-950/95 border-t border-white/[0.06] px-4 pb-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href="/annonces"
              className="hover:bg-surface-800 rounded-xl px-4 py-3 text-sm font-medium text-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Annonces
            </Link>
            <Link
              href="/demandes"
              className="hover:bg-surface-800 rounded-xl px-4 py-3 text-sm font-medium text-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Demandes
            </Link>
            <Link
              href="/corridors"
              className="hover:bg-surface-800 rounded-xl px-4 py-3 text-sm font-medium text-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Corridors
            </Link>
            <div className="my-2 h-px bg-white/[0.06]" />
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:bg-surface-800 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="ring-primary-500/30 rounded-full ring-2">
                    <Avatar
                      src={profile?.avatar_url}
                      firstName={profile?.first_name}
                      lastName={profile?.last_name}
                      isVerified={profile?.verification_level === 3}
                      size="sm"
                    />
                  </div>
                  <span>{profile?.first_name || 'Mon compte'}</span>
                </Link>
                <Link
                  href="/messages"
                  className="hover:bg-surface-800 rounded-xl px-4 py-3 text-sm font-medium text-neutral-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-error hover:bg-error/10 w-full rounded-xl px-4 py-3 text-left text-sm font-medium"
                >
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:bg-surface-800 block rounded-xl px-4 py-3 text-center text-sm font-medium text-neutral-100 ring-1 ring-white/[0.08]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="from-primary-500 to-primary-600 hover:shadow-glow-primary block rounded-xl bg-gradient-to-r px-4 py-3 text-center text-sm font-medium text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Publier une annonce
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
