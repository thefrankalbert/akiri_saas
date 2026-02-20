'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin } from 'lucide-react';
import { Badge, Avatar } from '@/components/ui';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';
import { mockProfiles } from '@/lib/mock-data';

const testimonials = [
  {
    profile: mockProfiles[0],
    text: "Grâce à Akiri, j'envoie des colis à ma famille à Douala chaque mois. C'est fiable, économique et la communauté est incroyable !",
    role: 'Expéditrice régulière',
    corridor: 'Paris → Douala',
  },
  {
    profile: mockProfiles[2],
    text: 'Je voyage souvent entre Paris et Yaoundé. Akiri me permet de rentabiliser mes kilos disponibles. Tout le monde y gagne !',
    role: 'Voyageur vérifié',
    corridor: 'Paris → Yaoundé',
  },
  {
    profile: mockProfiles[11],
    text: "Le système d'escrow est rassurant. On sait que le paiement est sécurisé. Je recommande à 100% !",
    role: 'Voyageur premium',
    corridor: 'Bruxelles → Kinshasa',
  },
];

export function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { inViewRef, inView } = useInView(0.15);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={inViewRef} className="relative overflow-hidden bg-neutral-950 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="from-primary-950/50 to-secondary-950/30 absolute inset-0 bg-gradient-to-br via-transparent" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'mx-auto max-w-2xl text-center transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-neutral-300">
            <Star className="text-accent-400 h-4 w-4" />
            Témoignages
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">La communauté parle</h2>
          <p className="mt-3 text-neutral-400">Des milliers de membres font confiance à Akiri</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="relative min-h-[280px] sm:min-h-[240px]">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={cn(
                  'transition-all duration-700',
                  i === activeTestimonial
                    ? 'relative scale-100 opacity-100'
                    : 'pointer-events-none absolute inset-0 scale-95 opacity-0'
                )}
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="fill-accent-400 text-accent-400 h-5 w-5" />
                    ))}
                  </div>

                  <blockquote className="text-lg leading-relaxed font-medium text-white sm:text-xl">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={t.profile.first_name}
                        lastName={t.profile.last_name}
                        size="lg"
                        isVerified={t.profile.is_verified}
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {t.profile.first_name} {t.profile.last_name}
                        </p>
                        <p className="text-sm text-neutral-400">{t.role}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="w-fit border-white/20 text-neutral-400"
                    >
                      <MapPin className="mr-1 h-3 w-3" />
                      {t.corridor}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          <div className="mt-8 flex justify-center gap-3">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className="flex h-11 w-11 items-center justify-center"
                aria-label={`Témoignage ${i + 1}`}
              >
                <span
                  className={cn(
                    'block h-2.5 rounded-full transition-all duration-300',
                    i === activeTestimonial ? 'bg-primary-500 w-10' : 'w-2.5 bg-neutral-600'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
