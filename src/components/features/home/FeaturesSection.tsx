'use client';

import { Shield, Globe, Wallet, Heart, TrendingUp } from 'lucide-react';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Shield,
    title: 'Escrow garanti',
    description:
      'Votre argent est protégé. Le voyageur est payé uniquement après confirmation de livraison.',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    stat: '100%',
    statLabel: 'sécurisé',
  },
  {
    icon: Globe,
    title: '15+ corridors',
    description:
      "France, Cameroun, Sénégal, Côte d'Ivoire... Trouvez un voyageur sur votre corridor.",
    gradient: 'from-secondary-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
    stat: '15+',
    statLabel: 'pays',
  },
  {
    icon: Wallet,
    title: '-70% vs fret',
    description:
      "Jusqu'à 70% moins cher. Les voyageurs rentabilisent leurs kilos. Tout le monde y gagne.",
    gradient: 'from-primary-500 to-amber-600',
    bgGradient: 'from-orange-50 to-amber-50',
    stat: '70%',
    statLabel: "d'économies",
  },
  {
    icon: Heart,
    title: 'Communauté vérifiée',
    description:
      "Profils vérifiés, avis authentiques, vérification d'identité. Confiance garantie.",
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50',
    stat: '4.8',
    statLabel: '/5 de note',
  },
];

export function FeaturesSection() {
  const { inViewRef, inView } = useInView(0.15);

  return (
    <section ref={inViewRef} className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'mx-auto max-w-2xl text-center transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="bg-secondary-100 text-secondary-700 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Avantages
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            Pourquoi choisir Akiri ?
          </h2>
          <p className="mt-3 text-neutral-500">Une plateforme pensée par et pour la diaspora</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl sm:p-8',
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                    feature.bgGradient
                  )}
                />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm',
                        feature.gradient
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'bg-gradient-to-r bg-clip-text text-2xl font-extrabold text-transparent',
                          feature.gradient
                        )}
                      >
                        {feature.stat}
                      </span>
                      <p className="text-xs text-neutral-500">{feature.statLabel}</p>
                    </div>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-neutral-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
