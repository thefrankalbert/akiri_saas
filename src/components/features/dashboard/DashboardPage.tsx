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
  Sparkle,
  CaretRight,
} from '@phosphor-icons/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
  Shimmer,
} from '@/components/ui';
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

// Mock activity data for demo
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
    description: '★★★★★ "Excellent service, très professionnel"',
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

const statusColors = {
  success: 'bg-success/10 text-success',
  pending: 'bg-amber-100 text-amber-600',
  info: 'bg-blue-100 text-blue-600',
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Shimmer className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Shimmer className="h-7 w-48 rounded-lg" />
            <Shimmer className="h-4 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Shimmer className="h-64 rounded-lg" />
          <Shimmer className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Annonces actives',
      value: stats.activeListings,
      icon: AirplaneTilt,
      iconColor: 'text-primary-500',
      lightBg: 'bg-primary-50',
      href: '/annonces',
    },
    {
      label: 'Demandes en cours',
      value: stats.pendingRequests,
      icon: Package,
      iconColor: 'text-secondary-500',
      lightBg: 'bg-secondary-50',
      href: '/demandes',
    },
    {
      label: 'Messages',
      value: stats.unreadMessages,
      icon: ChatCircle,
      iconColor: 'text-blue-500',
      lightBg: 'bg-blue-50',
      href: '/messages',
    },
    {
      label: 'Gains totaux',
      value: stats.totalEarnings,
      icon: TrendUp,
      iconColor: 'text-accent-500',
      lightBg: 'bg-amber-50',
      href: '/transactions',
      suffix: ' €',
    },
  ];

  const quickActions = [
    {
      href: '/annonces/new',
      icon: AirplaneTilt,
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-50',
      label: 'Publier une annonce',
      description: 'Proposez vos kilos disponibles',
    },
    {
      href: '/annonces',
      icon: Package,
      iconColor: 'text-secondary-500',
      iconBg: 'bg-secondary-50',
      label: 'Envoyer un colis',
      description: 'Trouvez un voyageur',
    },
    {
      href: '/messages',
      icon: ChatCircle,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
      label: 'Mes messages',
      description: stats.unreadMessages > 0 ? `${stats.unreadMessages} non lus` : 'Aucun nouveau',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <FadeIn>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {profile && (
              <div className="relative">
                <Avatar
                  src={profile.avatar_url}
                  firstName={profile.first_name}
                  lastName={profile.last_name}
                  size="lg"
                  isVerified={profile.is_verified}
                />
                {profile.is_verified && (
                  <div className="absolute -right-1 -bottom-1 rounded-full bg-white p-0.5 shadow-sm">
                    <ShieldCheck weight="duotone" size={16} className="text-success" />
                  </div>
                )}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                Bonjour, {profile?.first_name || 'Utilisateur'} !
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                <Sparkle weight="duotone" size={16} className="text-amber-400" />
                Voici un résumé de votre activité
              </p>
            </div>
          </div>
          <Link href="/annonces/new" className="shrink-0">
            <Button size="lg" leftIcon={<Plus weight="bold" size={20} />}>
              Nouvelle annonce
            </Button>
          </Link>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <StaggerContainer className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <Link href={stat.href}>
                <Card
                  variant="elevated"
                  padding="none"
                  className="group relative overflow-hidden transition-shadow duration-200 hover:shadow-md"
                >
                  <CardContent className="flex items-center gap-4 p-5">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.lightBg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon weight="duotone" size={28} className={stat.iconColor} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-neutral-900">{stat.value}</span>
                        {stat.suffix && (
                          <span className="text-lg font-medium text-neutral-500">
                            {stat.suffix}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">{stat.label}</p>
                    </div>
                    <CaretRight
                      weight="bold"
                      size={20}
                      className="text-neutral-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-neutral-400"
                    />
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <SlideUp delay={0.2}>
          <Card variant="elevated" padding="none" className="h-full">
            <CardHeader className="border-b border-neutral-100 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkle weight="duotone" size={20} className="text-amber-400" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="block">
                    <div className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition-all hover:border-neutral-200 hover:shadow-md">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg}`}
                      >
                        <Icon weight="duotone" size={24} className={action.iconColor} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-neutral-900">{action.label}</p>
                        <p className="truncate text-sm text-neutral-500">{action.description}</p>
                      </div>
                      <ArrowRight
                        weight="bold"
                        size={20}
                        className="text-neutral-300 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </SlideUp>

        {/* Activity Feed */}
        <SlideUp delay={0.3}>
          <Card variant="elevated" padding="none" className="h-full">
            <CardHeader className="border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock weight="duotone" size={20} className="text-neutral-400" />
                  Activité récente
                </CardTitle>
                <Link
                  href="/activite"
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                >
                  Tout voir
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity, index) => {
                    const Icon = activityIcons[activity.icon];
                    return (
                      <FadeIn key={activity.id} delay={index * 0.1}>
                        <div className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusColors[activity.status || 'info']}`}
                          >
                            <Icon weight="duotone" size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-neutral-900">{activity.title}</p>
                            <p className="truncate text-sm text-neutral-500">
                              {activity.description}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-neutral-400">
                            {formatRelativeDate(activity.timestamp)}
                          </span>
                        </div>
                      </FadeIn>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                    <Clock weight="duotone" size={32} className="text-neutral-300" />
                  </div>
                  <p className="mt-4 font-medium text-neutral-600">Aucune activité récente</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Vos dernières transactions apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </SlideUp>
      </div>

      {/* Verification Banner */}
      {profile && !profile.is_verified && (
        <FadeIn delay={0.4}>
          <Card className="mt-6 overflow-hidden border-0 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <WarningCircle weight="duotone" size={24} className="text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">Vérifiez votre identité</h3>
                    <Badge variant="warning" size="sm">
                      Non vérifié
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Gagnez la confiance de la communauté et accédez à toutes les fonctionnalités
                  </p>
                </div>
              </div>
              <Link href="/profil/verification" className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<CheckCircle weight="duotone" size={16} />}
                >
                  Vérifier maintenant
                </Button>
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Trust indicators */}
      <FadeIn delay={0.5}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck weight="duotone" size={20} className="text-success" />
            <span>Paiements sécurisés</span>
          </div>
          <div className="flex items-center gap-2">
            <Star weight="duotone" size={20} className="text-amber-400" />
            <span>Utilisateurs vérifiés</span>
          </div>
          <div className="flex items-center gap-2">
            <ChatCircle weight="duotone" size={20} className="text-blue-400" />
            <span>Support 24/7</span>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
