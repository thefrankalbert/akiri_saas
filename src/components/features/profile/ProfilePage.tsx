'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Shield, Calendar, ArrowLeft, Package, Plane } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';
import type { Profile, Review } from '@/types';
import { formatDate } from '@/lib/utils';
import { mockProfiles } from '@/lib/mock-data';

interface ProfilePageProps {
  userId: string;
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const mockProfile = mockProfiles.find((p) => p.user_id === userId) || null;
        setProfile(mockProfile as Profile | null);
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      const supabase = createClient();

      const [profileRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviewer_id(*)')
          .eq('reviewed_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (controller.signal.aborted) return;

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }
      if (reviewsRes.data) {
        setReviews(reviewsRes.data as Review[]);
      }

      setLoading(false);
    };

    fetchProfile();

    return () => controller.abort();
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="h-20 w-20" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-neutral-700">Profil introuvable</h2>
        <Link href="/annonces" className="mt-4 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Retour aux annonces
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/annonces"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 sm:items-center">
            <Avatar
              src={profile.avatar_url}
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="xl"
              isVerified={profile.is_verified}
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-neutral-900">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="fill-accent-500 text-accent-500 h-4 w-4" />
                    <span className="text-sm font-medium">{profile.rating.toFixed(1)}</span>
                    <span className="text-xs text-neutral-400">({profile.total_reviews} avis)</span>
                  </div>
                )}
                {profile.is_verified && (
                  <Badge variant="success" size="sm">
                    <Shield className="mr-1 h-3 w-3" />
                    Vérifié
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                <Calendar className="mr-1 inline h-3 w-3" />
                Membre depuis {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-neutral-50 p-3 text-center">
              <Plane className="text-primary-500 mx-auto h-5 w-5" />
              <p className="mt-1 text-lg font-bold text-neutral-900">{profile.total_trips}</p>
              <p className="text-xs text-neutral-500">Trajets</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 text-center">
              <Package className="text-secondary-500 mx-auto h-5 w-5" />
              <p className="mt-1 text-lg font-bold text-neutral-900">{profile.total_shipments}</p>
              <p className="text-xs text-neutral-500">Envois</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 text-center">
              <Star className="text-accent-500 mx-auto h-5 w-5" />
              <p className="mt-1 text-lg font-bold text-neutral-900">{profile.total_reviews}</p>
              <p className="text-xs text-neutral-500">Avis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Avis ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Star className="mx-auto h-10 w-10 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">Aucun avis pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {review.reviewer && (
                      <Avatar
                        src={review.reviewer.avatar_url}
                        firstName={review.reviewer.first_name}
                        lastName={review.reviewer.last_name}
                        size="sm"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700">
                          {review.reviewer
                            ? `${review.reviewer.first_name} ${review.reviewer.last_name.charAt(0)}.`
                            : 'Utilisateur'}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating
                                  ? 'fill-accent-500 text-accent-500'
                                  : 'text-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-neutral-600">{review.comment}</p>
                      )}
                      <p className="mt-1 text-xs text-neutral-400">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
