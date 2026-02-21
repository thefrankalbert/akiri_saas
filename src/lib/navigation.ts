import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  House,
  MagnifyingGlass,
  Package,
  GlobeHemisphereWest,
  ChatCircle,
  Plus,
  User,
  GearSix,
} from '@phosphor-icons/react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: PhosphorIcon;
  badge?: number;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  isCta?: boolean;
  order: number;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Accueil',
    href: '/dashboard',
    icon: House,
    showOnMobile: true,
    showOnDesktop: true,
    order: 1,
  },
  {
    id: 'explore',
    label: 'Explorer',
    href: '/annonces',
    icon: MagnifyingGlass,
    showOnMobile: true,
    showOnDesktop: true,
    order: 2,
  },
  {
    id: 'requests',
    label: 'Demandes',
    href: '/demandes',
    icon: Package,
    showOnMobile: false,
    showOnDesktop: true,
    order: 3,
  },
  {
    id: 'corridors',
    label: 'Corridors',
    href: '/corridors',
    icon: GlobeHemisphereWest,
    showOnMobile: false,
    showOnDesktop: true,
    order: 4,
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: ChatCircle,
    showOnMobile: true,
    showOnDesktop: true,
    order: 5,
  },
  {
    id: 'publish',
    label: 'Publier',
    href: '/annonces/new',
    icon: Plus,
    showOnMobile: true,
    showOnDesktop: true,
    isCta: true,
    order: 3, // Between explore and messages on mobile
  },
  {
    id: 'profile',
    label: 'Profil',
    href: '/profil',
    icon: User,
    showOnMobile: true,
    showOnDesktop: false,
    order: 6,
  },
  {
    id: 'settings',
    label: 'Parametres',
    href: '/parametres',
    icon: GearSix,
    showOnMobile: false,
    showOnDesktop: true,
    order: 7,
  },
];

/** Bottom nav items: mobile-visible, max 5, sorted by order */
export function getBottomNavItems(): NavItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.showOnMobile)
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);
}

/** Sidebar items: desktop-visible, no CTAs (CTA rendered separately), sorted by order */
export function getSidebarItems(): NavItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.showOnDesktop && !item.isCta).sort(
    (a, b) => a.order - b.order
  );
}

/** Sidebar CTA item */
export function getSidebarCta(): NavItem | undefined {
  return NAVIGATION_ITEMS.find((item) => item.showOnDesktop && item.isCta);
}

/** Mobile menu items: all navigation items for the burger menu, excluding CTA */
export function getMobileMenuItems(): NavItem[] {
  return NAVIGATION_ITEMS.filter((item) => !item.isCta && item.id !== 'home').sort(
    (a, b) => a.order - b.order
  );
}
