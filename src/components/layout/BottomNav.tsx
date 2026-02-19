'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, Globe, Package, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  isAction?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/annonces', label: 'Annonces', icon: Search },
  { href: '/annonces/new', label: 'Publier', icon: PlusCircle, isAction: true },
  { href: '/demandes', label: 'Demandes', icon: Package },
  { href: '/corridors', label: 'Corridors', icon: Globe },
];

const secondaryItems: NavItem[] = [
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard', label: 'Profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const allItems = [...navItems, ...secondaryItems];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {allItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center"
              >
                <div className="bg-primary-500 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-2',
                isActive ? 'text-primary-600' : 'text-neutral-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] leading-tight font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
