'use client';

import { Star, MapPin, Quotes } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';
import { mockProfiles } from '@/lib/mock-data';

const testimonials = [
  {
    profile: mockProfiles[0],
    text: "Grâce à Akiri, j'envoie des colis à ma famille à Douala chaque mois. C'est fiable, économique et la communauté est incroyable !",
    role: 'Voyageur vérifié',
    corridor: 'Paris → Douala',
    rating: 5,
    highlight: true,
  },
  {
    profile: mockProfiles[2],
    text: 'Je voyage souvent entre Paris et Yaoundé. Akiri me permet de rentabiliser mes kilos disponibles. Tout le monde y gagne !',
    role: 'Voyageur premium',
    corridor: 'Paris → Yaoundé',
    rating: 5,
    highlight: false,
  },
  {
    profile: mockProfiles[11],
    text: "Le système d'escrow est rassurant. On sait que le paiement est sécurisé. Je recommande à 100% !",
    role: 'Expéditrice régulière',
    corridor: 'Paris → Dakar',
    rating: 5,
    highlight: false,
  },
  {
    profile: mockProfiles[7],
    text: "5 ans d'expérience en transport de colis entre Lyon et Abidjan. Akiri a simplifié tout le processus.",
    role: 'Voyageuse expérimentée',
    corridor: 'Lyon → Abidjan',
    rating: 5,
    highlight: false,
  },
  {
    profile: mockProfiles[9],
    text: "Service impeccable. J'ai pu envoyer des médicaments à ma mère en RD Congo rapidement et en toute sécurité.",
    role: 'Expéditeuse',
    corridor: 'Bruxelles → Kinshasa',
    rating: 5,
    highlight: false,
  },
  {
    profile: mockProfiles[4],
    text: 'En tant que consultant, je voyage souvent. Akiri me permet de rendre service tout en gagnant un complément.',
    role: 'Voyageur régulier',
    corridor: 'Paris → Dakar',
    rating: 4,
    highlight: false,
  },
];

export function TestimonialsSection() {
  const { inViewRef, inView } = useInView(0.1);

  return (
    <section ref={inViewRef} className="bg-surface-950 relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            'flex flex-col items-start justify-between gap-4 transition-all duration-700 sm:flex-row sm:items-end',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div>
            <div className="text-warning flex items-center gap-2 text-sm font-medium">
              <Star weight="fill" size={16} />
              <span>Témoignages</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl md:text-[2.625rem] lg:text-5xl">
              Ils nous font
              <br />
              <span className="text-surface-200">confiance.</span>
            </h2>
          </div>
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} weight="fill" size={14} className="text-warning" />
              ))}
            </div>
            <span className="text-sm font-bold text-neutral-100">4.8/5</span>
            <span className="text-surface-100 text-xs">sur 2 500+ avis</span>
          </div>
        </div>

        {/* Masonry-style grid */}
        <div className="mt-12 columns-1 gap-3 space-y-3 sm:columns-2 lg:columns-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={cn(
                'glass break-inside-avoid rounded-xl p-5 transition-all duration-500',
                t.highlight ? 'border-primary-500/20' : 'hover:border-white/[0.12]',
                inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Quote icon for highlighted */}
              {t.highlight && (
                <Quotes weight="fill" size={24} className="text-primary-400/20 mb-3" />
              )}

              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} weight="fill" size={14} className="text-warning" />
                ))}
              </div>

              {/* Quote */}
              <blockquote
                className={cn(
                  'text-sm leading-relaxed',
                  t.highlight ? 'text-base font-medium text-neutral-100' : 'text-neutral-200'
                )}
              >
                &ldquo;{t.text}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-4 flex items-center gap-3">
                <Avatar
                  firstName={t.profile.first_name}
                  lastName={t.profile.last_name}
                  size="sm"
                  isVerified={t.profile.is_verified}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-100">
                    {t.profile.first_name} {t.profile.last_name.charAt(0)}.
                  </p>
                  <p className="text-surface-100 text-xs">{t.role}</p>
                </div>
              </div>

              {/* Corridor badge */}
              <div className="bg-surface-800 text-surface-100 mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
                <MapPin weight="duotone" size={10} />
                {t.corridor}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
