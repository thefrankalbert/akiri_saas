'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plane, MessageCircle, TrendingUp, Plus, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { mockProfiles } from '@/lib/mock-data';
import { toast } from 'sonner';

interface DashboardStats {
  activeListings: number;
  pendingRequests: number;
  unreadMessages: number;
  totalEarnings: number;
}

export function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    pendingRequests: 0,
    unreadMessages: 0,
    totalEarnings: 0,
  });
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

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (controller.signal.aborted) return;

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch stats
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
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Annonces actives',
      value: stats.activeListings,
      icon: Plane,
      color: 'text-primary-500',
      bg: 'bg-primary-50',
      href: '/annonces',
    },
    {
      label: 'Demandes en cours',
      value: stats.pendingRequests,
      icon: Package,
      color: 'text-secondary-500',
      bg: 'bg-secondary-50',
      href: '/demandes',
    },
    {
      label: 'Messages',
      value: stats.unreadMessages,
      icon: MessageCircle,
      color: 'text-info',
      bg: 'bg-blue-50',
      href: '/messages',
    },
    {
      label: 'Gains totaux',
      value: `${stats.totalEarnings} EUR`,
      icon: TrendingUp,
      color: 'text-accent-500',
      bg: 'bg-amber-50',
      href: '/transactions',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {profile && (
            <Avatar
              src={profile.avatar_url}
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="lg"
              isVerified={profile.is_verified}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Bonjour, {profile?.first_name || 'Utilisateur'} !
            </h1>
            <p className="text-sm text-neutral-500">Voici un résumé de votre activité</p>
          </div>
        </div>
        <Link href="/annonces/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nouvelle annonce</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                    <p className="text-sm text-neutral-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            <Link href="/annonces/new" className="block">
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <Plane className="text-primary-500 h-5 w-5" />
                  <span className="text-sm font-medium text-neutral-700">
                    Publier une nouvelle annonce
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </div>
            </Link>
            <Link href="/annonces" className="block">
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <Package className="text-secondary-500 h-5 w-5" />
                  <span className="text-sm font-medium text-neutral-700">Envoyer un colis</span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </div>
            </Link>
            <Link href="/messages" className="block">
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <MessageCircle className="text-info h-5 w-5" />
                  <span className="text-sm font-medium text-neutral-700">Mes messages</span>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-10 w-10 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucune activité récente</p>
              <p className="mt-1 text-xs text-neutral-400">
                Vos dernières transactions et activités apparaîtront ici
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification banner */}
      {profile && !profile.is_verified && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Badge variant="warning" size="md">
                Non vérifié
              </Badge>
              <p className="text-sm text-amber-800">
                Vérifiez votre identité pour gagner la confiance de la communauté
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info('Vérification à venir', {
                  description: "La vérification d'identité sera disponible prochainement.",
                })
              }
            >
              Vérifier
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
