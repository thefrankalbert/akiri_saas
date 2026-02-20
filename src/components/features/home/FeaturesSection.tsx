'use client';

import { ShieldCheck, GlobeHemisphereWest, Wallet, Heart, TrendUp } from '@phosphor-icons/react';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: ShieldCheck,
    title: 'Escrow garanti',
    description:
      'Votre argent est protégé. Le voyageur est payé uniquement après confirmation de livraison.',
    stat: '100%',
    statLabel: 'sécurisé',
  },
  {
    icon: GlobeHemisphereWest,
    title: '15+ corridors',
    description:
      "France, Cameroun, Sénégal, Côte d'Ivoire... Trouvez un voyageur sur votre corridor.",
    stat: '15+',
    statLabel: 'pays',
  },
  {
    icon: Wallet,
    title: '-70% vs fret',
    description:
      "Jusqu'à 70% moins cher. Les voyageurs rentabilisent leurs kilos. Tout le monde y gagne.",
    stat: '70%',
    statLabel: "d'économies",
  },
  {
    icon: Heart,
    title: 'Communauté vérifiée',
    description:
      "Profils vérifiés, avis authentiques, vérification d'identité. Confiance garantie.",
    stat: '4.8',
    statLabel: '/5 de note',
  },
];

export function FeaturesSection() {
  const { inViewRef, inView } = useInView(0.15);

  return (
    <section ref={inViewRef} className="bg-neutral-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'mx-auto max-w-2xl text-center transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="bg-primary-50 text-primary-600 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <TrendUp weight="duotone" size={16} />
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
                  'group hover:shadow-soft relative overflow-hidden rounded-lg border border-neutral-200/60 bg-white p-6 transition-all duration-200 hover:border-neutral-300',
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon weight="duotone" size={22} className="text-primary-600" />
                  </div>
                  <div className="text-right">
                    <span className="text-primary-600 text-2xl font-extrabold">{feature.stat}</span>
                    <p className="text-xs text-neutral-500">{feature.statLabel}</p>
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
