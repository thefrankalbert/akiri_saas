'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, MagnifyingGlass, Plus, ChatCircle, User } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
  isCta?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: House },
  { href: '/annonces', label: 'Explorer', icon: MagnifyingGlass },
  { href: '/annonces/new', label: 'Publier', icon: Plus, isCta: true },
  { href: '/messages', label: 'Messages', icon: ChatCircle },
  { href: '/profil', label: 'Profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom bg-surface-950/90 fixed right-0 bottom-0 left-0 z-50 border-t border-white/[0.06] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href) && !item.isCta;
          const Icon = item.icon;

          // Center CTA button
          if (item.isCta) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center transition-all duration-200"
              >
                <div className="from-primary-500 to-primary-600 shadow-glow-primary -mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r">
                  <Icon weight="bold" size={24} className="text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-2 transition-all duration-200',
                isActive ? 'text-primary-400' : 'text-surface-200'
              )}
            >
              <Icon weight={isActive ? 'fill' : 'regular'} size={22} />
              {isActive && (
                <span className="text-[10px] leading-tight font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
