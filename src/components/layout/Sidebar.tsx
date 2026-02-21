'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  MagnifyingGlass,
  Package,
  GlobeHemisphereWest,
  ChatCircle,
  Plus,
  GearSix,
  SignOut,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/lib/hooks';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
}

const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: House },
  { href: '/annonces', label: 'Explorer', icon: MagnifyingGlass },
  { href: '/demandes', label: 'Demandes', icon: Package },
  { href: '/corridors', label: 'Corridors', icon: GlobeHemisphereWest },
  { href: '/messages', label: 'Messages', icon: ChatCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isAuthenticated, signOut } = useAuth();

  return (
    <aside className="bg-surface-900 fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r border-white/[0.06] md:flex lg:w-60">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/[0.06] lg:justify-start lg:px-5">
        <div className="from-primary-500 to-primary-600 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r">
          <span className="text-lg font-bold text-white">A</span>
        </div>
        <span className="hidden text-xl font-bold text-neutral-100 lg:ml-2 lg:inline">Akiri</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1 px-2 pt-4">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-surface-800 text-primary-400'
                  : 'text-surface-200 hover:bg-surface-800 hover:text-neutral-100'
              )}
            >
              <Icon weight={isActive ? 'fill' : 'duotone'} size={20} className="shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}

        {/* CTA: Publier */}
        <Link
          href="/annonces/new"
          title="Publier"
          className="from-primary-500 to-primary-600 mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:shadow-lg lg:justify-start"
        >
          <Plus weight="bold" size={20} className="shrink-0" />
          <span className="hidden lg:inline">Publier</span>
        </Link>
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 border-t border-white/[0.06] px-2 py-3">
        <Link
          href="/parametres"
          title="Parametres"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
            pathname.startsWith('/parametres')
              ? 'bg-surface-800 text-primary-400'
              : 'text-surface-200 hover:bg-surface-800 hover:text-neutral-100'
          )}
        >
          <GearSix
            weight={pathname.startsWith('/parametres') ? 'fill' : 'duotone'}
            size={20}
            className="shrink-0"
          />
          <span className="hidden lg:inline">Parametres</span>
        </Link>

        {isAuthenticated && (
          <>
            <Link
              href="/dashboard"
              title={profile?.first_name || 'Profil'}
              className="text-surface-200 hover:bg-surface-800 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:text-neutral-100"
            >
              <div className="ring-primary-500/30 shrink-0 rounded-full ring-2">
                <Avatar
                  src={profile?.avatar_url}
                  firstName={profile?.first_name}
                  lastName={profile?.last_name}
                  isVerified={profile?.verification_level === 3}
                  size="sm"
                />
              </div>
              <span className="hidden truncate text-sm font-medium lg:inline">
                {profile?.first_name || 'Mon compte'}
              </span>
            </Link>

            <button
              onClick={signOut}
              title="Deconnexion"
              className="text-surface-200 hover:bg-error/10 hover:text-error flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
            >
              <SignOut weight="duotone" size={20} className="shrink-0" />
              <span className="hidden lg:inline">Deconnexion</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
