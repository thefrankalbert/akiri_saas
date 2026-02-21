'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, SignOut } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import { useAuth, useConversations } from '@/lib/hooks';
import { getSidebarItems, getSidebarCta } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isAuthenticated, signOut } = useAuth();
  const { totalUnread } = useConversations('mock-user-001');

  const sidebarItems = getSidebarItems();
  const ctaItem = getSidebarCta();

  return (
    <aside className="bg-surface-900 fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r border-white/[0.06] transition-all duration-300 ease-in-out md:flex lg:w-60">
      {/* Logo — icon only on tablet, full on desktop */}
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/[0.06] lg:justify-start lg:px-5">
        <Link href="/dashboard" className="flex items-center">
          <div className="from-primary-500 to-primary-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="ml-2 text-xl font-bold text-neutral-100 opacity-0 transition-opacity duration-300 lg:opacity-100">
            Akiri
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1 px-2 pt-4">
        {sidebarItems
          .filter((item) => item.id !== 'settings')
          .map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-surface-800 text-primary-400'
                    : 'text-surface-200 hover:bg-surface-800 hover:text-neutral-100'
                )}
              >
                <div className="relative shrink-0">
                  <Icon weight={isActive ? 'fill' : 'duotone'} size={20} />
                  {item.id === 'messages' && totalUnread > 0 && (
                    <>
                      {/* Full badge on desktop */}
                      <span className="absolute -top-1 -right-1.5 hidden h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white lg:flex">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                      {/* Small dot on tablet (collapsed) */}
                      <span className="ring-surface-900 absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 lg:hidden" />
                    </>
                  )}
                </div>
                {/* Label with opacity transition */}
                <span className="truncate opacity-0 transition-opacity duration-300 lg:opacity-100">
                  {item.label}
                </span>
                {/* Tooltip for collapsed mode */}
                <span className="bg-surface-800 pointer-events-none absolute left-full ml-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-neutral-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:hidden">
                  {item.label}
                </span>
              </Link>
            );
          })}

        {/* CTA: Publier */}
        {ctaItem && (
          <Link
            href={ctaItem.href}
            title={ctaItem.label}
            className="from-primary-500 to-primary-600 group relative mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:shadow-lg lg:justify-start"
          >
            <Plus weight="bold" size={20} className="shrink-0" />
            <span className="truncate opacity-0 transition-opacity duration-300 lg:opacity-100">
              {ctaItem.label}
            </span>
            {/* Tooltip for collapsed mode */}
            <span className="bg-surface-800 pointer-events-none absolute left-full ml-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-neutral-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:hidden">
              {ctaItem.label}
            </span>
          </Link>
        )}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 border-t border-white/[0.06] px-2 py-3">
        {/* Settings */}
        {sidebarItems
          .filter((item) => item.id === 'settings')
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-surface-800 text-primary-400'
                    : 'text-surface-200 hover:bg-surface-800 hover:text-neutral-100'
                )}
              >
                <Icon weight={isActive ? 'fill' : 'duotone'} size={20} className="shrink-0" />
                <span className="truncate opacity-0 transition-opacity duration-300 lg:opacity-100">
                  {item.label}
                </span>
                <span className="bg-surface-800 pointer-events-none absolute left-full ml-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-neutral-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:hidden">
                  {item.label}
                </span>
              </Link>
            );
          })}

        {isAuthenticated && (
          <>
            <Link
              href="/dashboard"
              title={profile?.first_name || 'Profil'}
              className="text-surface-200 hover:bg-surface-800 group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:text-neutral-100"
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
              <span className="truncate text-sm font-medium opacity-0 transition-opacity duration-300 lg:opacity-100">
                {profile?.first_name || 'Mon compte'}
              </span>
              <span className="bg-surface-800 pointer-events-none absolute left-full ml-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-neutral-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:hidden">
                {profile?.first_name || 'Mon compte'}
              </span>
            </Link>

            <button
              onClick={signOut}
              title="Deconnexion"
              className="text-surface-200 hover:bg-error/10 hover:text-error group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
            >
              <SignOut weight="duotone" size={20} className="shrink-0" />
              <span className="truncate opacity-0 transition-opacity duration-300 lg:opacity-100">
                Deconnexion
              </span>
              <span className="bg-surface-800 pointer-events-none absolute left-full ml-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-neutral-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:hidden">
                Deconnexion
              </span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
