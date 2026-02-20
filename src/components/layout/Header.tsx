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
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { APP_NAME } from '@/constants';
import { useAuth } from '@/lib/hooks';

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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-white">
          <TestTube weight="duotone" size={16} className="mr-1.5 inline-block" />
          Mode Démonstration — Les données sont simulées
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">{APP_NAME}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/annonces"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Annonces
          </Link>
          <Link
            href="/demandes"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Demandes
          </Link>
          <Link
            href="/corridors"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Corridors
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <button className="rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
            <MagnifyingGlass weight="duotone" size={20} />
          </button>
          {isAuthenticated ? (
            <>
              <Link
                href="/messages"
                className="relative rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              >
                <ChatCircle weight="duotone" size={20} />
              </Link>
              <button className="relative rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
                <Bell weight="duotone" size={20} />
              </button>
              <div className="mx-2 h-6 w-px bg-neutral-200" />
              <Link href="/dashboard" className="flex items-center gap-2">
                <Avatar
                  src={profile?.avatar_url}
                  firstName={profile?.first_name}
                  lastName={profile?.last_name}
                  isVerified={profile?.verification_level === 3}
                  size="sm"
                />
                <span className="text-sm font-medium text-neutral-700">
                  {profile?.first_name || user?.email?.split('@')[0]}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Déconnexion"
              >
                <SignOut weight="duotone" size={20} />
              </button>
            </>
          ) : (
            <>
              <button className="relative rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
                <Bell weight="duotone" size={20} />
              </button>
              <button className="rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
                <ChatCircle weight="duotone" size={20} />
              </button>
              <div className="mx-2 h-6 w-px bg-neutral-200" />
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-primary-500 hover:bg-primary-600 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Publier une annonce
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2.5 text-neutral-500 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X weight="bold" size={24} /> : <List weight="duotone" size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href="/annonces"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Annonces
            </Link>
            <Link
              href="/demandes"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Demandes
            </Link>
            <Link
              href="/corridors"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Corridors
            </Link>
            <div className="my-2 h-px bg-neutral-200" />
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Avatar
                    src={profile?.avatar_url}
                    firstName={profile?.first_name}
                    lastName={profile?.last_name}
                    isVerified={profile?.verification_level === 3}
                    size="sm"
                  />
                  <span>{profile?.first_name || 'Mon compte'}</span>
                </Link>
                <Link
                  href="/messages"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-500 hover:bg-primary-600 block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-white"
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
