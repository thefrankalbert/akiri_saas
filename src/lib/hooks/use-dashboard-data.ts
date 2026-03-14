'use client';

import { useEffect, useState } from 'react';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { mockProfiles } from '@/lib/mock-data';

export interface DashboardStats {
  activeListings: number;
  pendingRequests: number;
  unreadMessages: number;
  totalEarnings: number;
}

export interface ActivityItem {
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

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const requestStatusMap: Record<
  string,
  {
    title: string;
    icon: ActivityItem['icon'];
    status: ActivityItem['status'];
    type: ActivityItem['type'];
  }
> = {
  pending: {
    title: "Nouvelle demande d'expédition",
    icon: 'package',
    status: 'pending',
    type: 'request',
  },
  accepted: { title: 'Demande acceptée', icon: 'package', status: 'info', type: 'request' },
  paid: { title: 'Paiement reçu', icon: 'payment', status: 'success', type: 'payment' },
  delivered: { title: 'Colis livré', icon: 'package', status: 'success', type: 'request' },
  confirmed: { title: 'Livraison confirmée', icon: 'package', status: 'success', type: 'request' },
};

export interface DashboardData {
  profile: Profile | null;
  stats: DashboardStats;
  activities: ActivityItem[];
  loading: boolean;
  statItems: { label: string; value: string | number; href: string }[];
}

export function useDashboardData(): DashboardData {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    pendingRequests: 0,
    unreadMessages: 0,
    totalEarnings: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
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

      // Fetch recent activities
      const [requestsActivity, reviewsActivity] = await Promise.all([
        supabase
          .from('shipment_requests')
          .select(
            'id, status, updated_at, weight_kg, listing:listings(departure_city, arrival_city)'
          )
          .or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`)
          .order('updated_at', { ascending: false })
          .limit(10),
        supabase
          .from('reviews')
          .select('id, rating, created_at, comment')
          .eq('reviewee_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (controller.signal.aborted) return;

      const realActivities: ActivityItem[] = [];

      if (requestsActivity.data) {
        for (const req of requestsActivity.data) {
          const mapping = requestStatusMap[req.status as string];
          if (!mapping) continue;
          const listing = req.listing as { departure_city?: string; arrival_city?: string } | null;
          const route =
            listing?.departure_city && listing?.arrival_city
              ? `${listing.departure_city} → ${listing.arrival_city}`
              : '';
          const desc = [route, req.weight_kg ? `${req.weight_kg}kg` : '']
            .filter(Boolean)
            .join(', ');
          realActivities.push({
            id: `req-${req.id}`,
            type: mapping.type,
            title: mapping.title,
            description: desc || formatRelativeTime(new Date(req.updated_at as string)),
            timestamp: new Date(req.updated_at as string),
            icon: mapping.icon,
            status: mapping.status,
          });
        }
      }

      if (reviewsActivity.data) {
        for (const rev of reviewsActivity.data) {
          realActivities.push({
            id: `rev-${rev.id}`,
            type: 'review',
            title: `Nouvel avis reçu (${rev.rating}/5)`,
            description: rev.comment ? `"${(rev.comment as string).slice(0, 60)}"` : '',
            timestamp: new Date(rev.created_at as string),
            icon: 'star',
            status: 'success',
          });
        }
      }

      // Sort combined activities by timestamp descending, take top 10
      realActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (realActivities.length > 0) {
        setActivities(realActivities.slice(0, 10));
      }

      setLoading(false);
    };

    fetchDashboard();

    return () => controller.abort();
  }, []);

  const statItems = [
    { label: 'Annonces', value: stats.activeListings, href: '/annonces' },
    { label: 'Demandes', value: stats.pendingRequests, href: '/demandes' },
    { label: 'Messages', value: stats.unreadMessages, href: '/messages' },
    { label: 'Gains', value: `${stats.totalEarnings} €`, href: '/transactions' },
  ];

  return { profile, stats, activities, loading, statItems };
}
