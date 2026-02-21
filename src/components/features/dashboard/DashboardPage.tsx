'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  AirplaneTilt,
  ChatCircle,
  TrendUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  WarningCircle,
  Star,
  ShieldCheck,
  CaretRight,
  GlobeHemisphereWest,
  GearSix,
} from '@phosphor-icons/react';
import { Avatar, FadeIn, Shimmer } from '@/components/ui';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { mockProfiles } from '@/lib/mock-data';
import { formatRelativeDate } from '@/lib/utils';

interface DashboardStats {
  activeListings: number;
  pendingRequests: number;
  unreadMessages: number;
  totalEarnings: number;
}

interface ActivityItem {
  id: string;
  type: 'listing' | 'request' | 'message' | 'payment' | 'review';
  title: string;
  description: string;
  timestamp: Date;
  icon: 'plane' | 'package' | 'message' | 'payment' | 'star';
  status?: 'success' | 'pending' | 'info';
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'listing',
    title: 'Nouvelle annonce publiée',
    description: 'Paris → Dakar, 10kg disponibles',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: 'plane',
    status: 'success',
  },
  {
    id: '2',
    type: 'request',
    title: "Demande d'envoi reçue",
    description: 'Colis 3kg pour Abidjan',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    icon: 'package',
    status: 'pending',
  },
  {
    id: '3',
    type: 'message',
    title: 'Nouveau message',
    description: 'De Aminata K. concernant votre annonce',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    icon: 'message',
    status: 'info',
  },
  {
    id: '4',
    type: 'review',
    title: 'Nouvel avis reçu',
    description: '★★★★★ "Excellent service"',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: 'star',
    status: 'success',
  },
];

const activityIcons = {
  plane: AirplaneTilt,
  package: Package,
  message: ChatCircle,
  payment: TrendUp,
  star: Star,
};

const statusDot = {
  success: 'bg-success',
  pending: 'bg-warning',
  info: 'bg-info',
};

export function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    pendingRequests: 0,
    unreadMessages: 0,
    totalEarnings: 0,
  });
  const [activities] = useState<ActivityItem[]>(mockActivities);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        setProfile(mockProfiles[0] as Profile);
        setStats({
          activeListings: 3,
          pendingRequests: 2,
          unreadMessages: 5,
          totalEarnings: 450,
        });
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchDashboard = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || controller.signal.aborted) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (controller.signal.aborted) return;

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const [listingsRes, requestsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('traveler_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('shipment_requests')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id)
          .eq('status', 'pending'),
      ]);

      if (controller.signal.aborted) return;

      setStats({
        activeListings: listingsRes.count || 0,
        pendingRequests: requestsRes.count || 0,
        unreadMessages: 0,
        totalEarnings: 0,
      });

      setLoading(false);
    };

    fetchDashboard();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-7 lg:px-8">
        <Shimmer className="mb-6 h-32 w-full rounded-2xl" />
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-10 w-32 rounded-lg" />
          ))}
        </div>
        <Shimmer className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const statItems = [
    { label: 'Annonces', value: stats.activeListings, href: '/annonces' },
    { label: 'Demandes', value: stats.pendingRequests, href: '/demandes' },
    { label: 'Messages', value: stats.unreadMessages, href: '/messages' },
    { label: 'Gains', value: `${stats.totalEarnings} €`, href: '/transactions' },
  ];

  const quickActions = [
    {
      href: '/annonces/new',
      icon: Plus,
      label: 'Publier',
      bg: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20',
    },
    {
      href: '/annonces',
      icon: Package,
      label: 'Envoyer',
      bg: 'bg-surface-700 border border-white/[0.08] text-neutral-100 hover:bg-surface-600',
    },
    {
      href: '/corridors',
      icon: GlobeHemisphereWest,
      label: 'Corridors',
      bg: 'bg-surface-700 border border-white/[0.08] text-neutral-100 hover:bg-surface-600',
    },
    {
      href: '/messages',
      icon: ChatCircle,
      label: stats.unreadMessages > 0 ? `Messages (${stats.unreadMessages})` : 'Messages',
      bg: 'bg-surface-700 border border-white/[0.08] text-neutral-100 hover:bg-surface-600',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-7 lg:px-8">
      {/* ===== HERO: Welcome + Stats ===== */}
      <FadeIn>
        <div className="bg-surface-800 mb-6 rounded-2xl px-5 py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: avatar + greeting */}
            <div className="flex items-center gap-3">
              {profile && (
                <div className="ring-primary-500/30 rounded-full ring-2">
                  <Avatar
                    src={profile.avatar_url}
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    size="md"
                    isVerified={profile.is_verified}
                  />
                </div>
              )}
              <div>
                <h1 className="text-base font-semibold text-neutral-100 sm:text-lg">
                  Bonjour, {profile?.first_name || 'Utilisateur'}
                </h1>
                <p className="text-surface-100 flex items-center gap-1.5 text-xs">
                  Voici votre tableau de bord
                  <Link
                    href="/parametres"
                    className="text-surface-200 transition-colors hover:text-neutral-100"
                  >
                    <GearSix weight="duotone" size={14} />
                  </Link>
                </p>
              </div>
            </div>

            {/* Right: inline stats */}
            <div className="hidden items-center gap-6 sm:flex">
              {statItems.map((s) => (
                <Link key={s.label} href={s.href} className="group text-center">
                  <p className="group-hover:text-primary-400 text-lg font-bold text-neutral-100 transition-colors">
                    {s.value}
                  </p>
                  <p className="text-surface-100 text-[10px]">{s.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile stats row — 2 cols for readability at 375px */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
            {statItems.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="bg-surface-700 hover:bg-surface-600 rounded-xl p-3 text-center transition-colors"
              >
                <p className="text-sm font-bold text-neutral-100">{s.value}</p>
                <p className="text-surface-100 text-[10px]">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Verification inline if needed */}
          {profile && !profile.is_verified && (
            <div className="border-warning/20 bg-warning/10 mt-4 flex items-center justify-between rounded-xl border px-3 py-2">
              <div className="flex items-center gap-2">
                <WarningCircle weight="duotone" size={16} className="text-warning" />
                <span className="text-warning text-xs">Identité non vérifiée</span>
              </div>
              <Link
                href="/profil/verification"
                className="text-warning flex items-center gap-1 text-xs font-medium hover:text-amber-300"
              >
                Vérifier
                <ArrowRight weight="bold" size={12} />
              </Link>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ===== QUICK ACTIONS: Horizontal pills ===== */}
      <FadeIn delay={0.1}>
        <div className="mb-6 flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${action.bg}`}
              >
                <Icon weight="bold" size={15} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </FadeIn>

      {/* ===== MAIN: Activity timeline ===== */}
      <FadeIn delay={0.2}>
        <div className="bg-surface-800 rounded-2xl border border-white/[0.08] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold text-neutral-100">
              <Clock weight="duotone" size={14} className="text-surface-200" />
              Activité récente
            </h2>
            <Link
              href="/activite"
              className="text-primary-400 hover:text-primary-300 flex items-center gap-0.5 text-xs font-medium"
            >
              Tout voir
              <CaretRight weight="bold" size={12} />
            </Link>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-0.5">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.icon];
                return (
                  <div
                    key={activity.id}
                    className="hover:bg-surface-700 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                  >
                    {/* Status dot */}
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${statusDot[activity.status || 'info']}`}
                    />

                    {/* Icon */}
                    <Icon weight="duotone" size={16} className="text-surface-200 shrink-0" />

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-neutral-100">{activity.title}</span>
                      <span className="text-surface-400 mx-1.5">&middot;</span>
                      <span className="text-surface-100 text-sm">{activity.description}</span>
                    </div>

                    {/* Time */}
                    <span className="text-surface-200 shrink-0 text-[11px]">
                      {formatRelativeDate(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Clock weight="duotone" size={24} className="text-surface-300 mx-auto" />
              <p className="text-surface-100 mt-2 text-sm">Aucune activité récente</p>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ===== BOTTOM: Trust indicators ===== */}
      <FadeIn delay={0.3}>
        <div className="text-surface-200 mt-6 flex flex-wrap items-center justify-center gap-5 text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck weight="duotone" size={14} className="text-success" />
            Paiements sécurisés
          </span>
          <span className="flex items-center gap-1.5">
            <Star weight="duotone" size={14} className="text-amber-400" />
            Profils vérifiés
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle weight="duotone" size={14} className="text-primary-400" />
            Escrow garanti
          </span>
        </div>
      </FadeIn>
    </div>
  );
}
