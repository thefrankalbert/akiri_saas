'use client';

import { useState, useEffect } from 'react';
import { AirplaneTilt, Package, Users, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

const steps = [
  {
    step: 1,
    icon: AirplaneTilt,
    title: 'Le voyageur publie',
    description: 'Trajet, date de départ et kilos disponibles.',
    emoji: '\u2708\uFE0F',
  },
  {
    step: 2,
    icon: Package,
    title: "L'expéditeur demande",
    description: 'Description du colis, poids. Paiement sécurisé.',
    emoji: '\uD83D\uDCE6',
  },
  {
    step: 3,
    icon: Users,
    title: 'Rencontre & remise',
    description: 'Point de collecte convenu. Le voyageur prend le colis.',
    emoji: '\uD83E\uDD1D',
  },
  {
    step: 4,
    icon: CheckCircle,
    title: 'Livraison confirmée',
    description: 'Code à 6 chiffres. Le voyageur est payé instantanément.',
    emoji: '\u2705',
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const { inViewRef, inView } = useInView(0.15);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={inViewRef} className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'mx-auto max-w-2xl text-center transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="bg-primary-50 text-primary-600 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkle weight="duotone" size={16} />
            Simple &amp; rapide
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">Comment ça marche ?</h2>
          <p className="mt-3 text-neutral-500">Envoyez vos colis en Afrique en 4 étapes simples</p>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="from-primary-200 via-primary-300 to-primary-200 absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b lg:block" />

          <div className="grid gap-8 lg:gap-0">
            {steps.map((item, index) => {
              const isActive = activeStep === index;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={item.step}
                  className={cn(
                    'relative transition-all duration-700',
                    inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  )}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Mobile layout */}
                  <div className="flex items-start gap-4 lg:hidden">
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-300',
                          isActive
                            ? 'bg-primary-500 shadow-primary-500/25 scale-110 shadow-lg'
                            : 'border border-neutral-200 bg-white shadow-sm'
                        )}
                        onClick={() => setActiveStep(index)}
                      >
                        {item.emoji}
                      </button>
                      {index < steps.length - 1 && (
                        <div className="absolute top-full left-1/2 h-8 w-px -translate-x-1/2 bg-neutral-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'bg-primary-50 text-primary-600 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                            isActive ? 'bg-primary-500 text-white' : ''
                          )}
                        >
                          {item.step}
                        </span>
                        <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr,auto,1fr] lg:items-center lg:gap-8 lg:py-6">
                    <div className={cn('transition-all duration-300', isEven ? '' : 'order-3')}>
                      <button
                        type="button"
                        className={cn(
                          'w-full rounded-2xl p-6 text-left transition-all duration-300',
                          isEven ? 'text-right' : 'text-left',
                          isActive ? 'scale-[1.02] bg-neutral-50 shadow-sm' : 'bg-transparent'
                        )}
                        onClick={() => setActiveStep(index)}
                      >
                        <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                          {item.description}
                        </p>
                      </button>
                    </div>

                    <div className="order-2 flex flex-col items-center">
                      <div
                        className={cn(
                          'relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-300',
                          isActive
                            ? 'bg-primary-500 shadow-primary-500/30 scale-110 shadow-lg'
                            : 'border border-neutral-200 bg-white shadow-md'
                        )}
                      >
                        {item.emoji}
                      </div>
                    </div>

                    <div className={cn(isEven ? 'order-3' : '')} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
