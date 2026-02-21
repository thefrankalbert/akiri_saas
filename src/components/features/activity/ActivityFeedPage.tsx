'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AirplaneTilt,
  Package,
  ChatCircle,
  TrendUp,
  Star,
  Clock,
  ArrowLeft,
} from '@phosphor-icons/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui';
import { formatRelativeDate } from '@/lib/utils';

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
    type: 'payment',
    title: 'Paiement reçu',
    description: '45,00 € pour envoi Paris → Douala',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    icon: 'payment',
    status: 'success',
  },
  {
    id: '5',
    type: 'review',
    title: 'Nouvel avis reçu',
    description: '★★★★★ "Excellent service, très professionnel"',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: 'star',
    status: 'success',
  },
  {
    id: '6',
    type: 'listing',
    title: 'Annonce expirée',
    description: 'Lyon → Bamako, 5kg — annonce clôturée',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    icon: 'plane',
    status: 'info',
  },
  {
    id: '7',
    type: 'request',
    title: 'Demande acceptée',
    description: 'Votre demande pour Marseille → Lomé a été acceptée',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    icon: 'package',
    status: 'success',
  },
  {
    id: '8',
    type: 'message',
    title: 'Nouveau message',
    description: 'De Ousmane D. à propos de la livraison',
    timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
    icon: 'message',
    status: 'info',
  },
  {
    id: '9',
    type: 'payment',
    title: 'Remboursement effectué',
    description: '25,00 € — annulation envoi Bordeaux → Conakry',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    icon: 'payment',
    status: 'pending',
  },
  {
    id: '10',
    type: 'review',
    title: 'Avis laissé',
    description: 'Vous avez évalué Fatou M. ★★★★☆',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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

type FilterType = 'all' | 'listing' | 'request' | 'message' | 'payment' | 'review';

const filters: { label: string; value: FilterType }[] = [
  { label: 'Tout', value: 'all' },
  { label: 'Annonces', value: 'listing' },
  { label: 'Demandes', value: 'request' },
  { label: 'Messages', value: 'message' },
  { label: 'Paiements', value: 'payment' },
  { label: 'Avis', value: 'review' },
];

export function ActivityFeedPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredActivities =
    activeFilter === 'all' ? mockActivities : mockActivities.filter((a) => a.type === activeFilter);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <FadeIn>
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Activité</h1>
          <p className="mt-1 text-neutral-500">
            Historique complet de vos actions et notifications
          </p>
        </div>
      </FadeIn>

      {/* Filters */}
      <SlideUp delay={0.1}>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </SlideUp>

      {/* Activity List */}
      <SlideUp delay={0.2}>
        <Card variant="elevated" padding="none">
          <CardHeader className="border-b border-neutral-100 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="text-neutral-400" size={20} />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {filteredActivities.length > 0 ? (
              <StaggerContainer className="space-y-2">
                {filteredActivities.map((activity) => {
                  const Icon = activityIcons[activity.icon];
                  return (
                    <StaggerItem key={activity.id}>
                      <div className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-neutral-50">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusColors[activity.status || 'info']}`}
                        >
                          <Icon size={20} />
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
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                  <Clock className="text-neutral-300" size={32} />
                </div>
                <p className="mt-4 font-medium text-neutral-600">Aucune activité</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Aucune activité ne correspond à ce filtre
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </SlideUp>
    </div>
  );
}
