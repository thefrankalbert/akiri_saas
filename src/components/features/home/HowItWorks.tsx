'use client';

import { useState, useEffect } from 'react';
import {
  AirplaneTilt,
  Package,
  Users,
  CheckCircle,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  CurrencyEur,
  QrCode,
} from '@phosphor-icons/react';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

const steps = [
  {
    step: 1,
    icon: AirplaneTilt,
    title: 'Le voyageur publie',
    description:
      'Trajet, date de départ et kilos disponibles. Visible par toute la communauté en quelques secondes.',
    visual: 'listing',
    accent: 'from-primary-500 to-primary-600',
    accentBg: 'bg-primary-500/10',
    accentText: 'text-primary-600',
  },
  {
    step: 2,
    icon: Package,
    title: "L'expéditeur demande",
    description:
      'Description du colis, poids souhaité. Le prix est calculé automatiquement. Paiement sécurisé par escrow.',
    visual: 'request',
    accent: 'from-accent-500 to-accent-600',
    accentBg: 'bg-accent-500/10',
    accentText: 'text-accent-600',
  },
  {
    step: 3,
    icon: Users,
    title: 'Rencontre & remise',
    description:
      'Point de collecte convenu via le chat. Le voyageur prend le colis en main propre.',
    visual: 'meetup',
    accent: 'from-emerald-500 to-emerald-600',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-600',
  },
  {
    step: 4,
    icon: CheckCircle,
    title: 'Livraison confirmée',
    description:
      'Code à 6 chiffres unique. Le destinataire confirme. Le voyageur est payé instantanément.',
    visual: 'confirmed',
    accent: 'from-amber-500 to-amber-600',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-600',
  },
];

function StepVisual({ step }: { step: (typeof steps)[0] }) {
  if (step.visual === 'listing') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500/20 h-8 w-8 rounded-full" />
          <div>
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="mt-1 h-2 w-16 rounded bg-neutral-100" />
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-900">
            <AirplaneTilt weight="duotone" size={14} className="text-primary-500" />
            Paris &rarr; Douala
          </div>
          <div className="mt-2 flex gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900">20</p>
              <p className="text-[10px] text-neutral-400">kg dispo</p>
            </div>
            <div className="text-center">
              <p className="text-primary-600 text-lg font-bold">10&euro;</p>
              <p className="text-[10px] text-neutral-400">par kg</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900">15 mars</p>
              <p className="text-[10px] text-neutral-400">départ</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {['Vêtements', 'Cosmétiques', 'Électronique'].map((t) => (
            <span
              key={t}
              className="bg-primary-50 text-primary-600 rounded-full px-2 py-0.5 text-[10px] font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (step.visual === 'request') {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-900">Demande d&apos;envoi</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              En attente
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Poids</span>
              <span className="font-medium text-neutral-900">5 kg</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Prix/kg</span>
              <span className="font-medium text-neutral-900">10 &euro;</span>
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Total</span>
              <span className="text-primary-600 text-sm font-bold">50 &euro;</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <ShieldCheck weight="duotone" size={14} className="text-emerald-600" />
          <span className="text-[11px] text-emerald-700">Escrow — Paiement sécurisé</span>
        </div>
      </div>
    );
  }

  if (step.visual === 'meetup') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-primary-100 h-10 w-10 rounded-full ring-2 ring-white" />
            <div className="bg-accent-100 absolute -right-1 -bottom-1 h-10 w-10 rounded-full ring-2 ring-white" />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-neutral-900">Moussa &amp; Aminata</p>
            <p className="text-[10px] text-neutral-500">Point de collecte confirmé</p>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="bg-primary-500 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white">
              M
            </span>
            Château Rouge, Paris
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-100 text-[8px]">
              📅
            </span>
            Samedi 15 mars, 14h
          </div>
        </div>
        <div className="bg-primary-50 rounded-lg px-3 py-2">
          <p className="text-primary-700 text-[11px]">Colis remis en main propre</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 py-4">
        <div className="text-center">
          <QrCode weight="duotone" size={32} className="mx-auto text-emerald-600" />
          <div className="mt-2 font-mono text-2xl font-bold tracking-[0.3em] text-neutral-900">
            4 8 2 9 1 5
          </div>
          <p className="mt-1 text-[10px] text-emerald-600">Code de confirmation</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5">
        <CurrencyEur weight="bold" size={16} className="text-white" />
        <span className="text-xs font-medium text-white">Paiement libéré au voyageur</span>
        <CheckCircle weight="fill" size={14} className="ml-auto text-white" />
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const { inViewRef, inView } = useInView(0.1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={inViewRef} className="relative overflow-hidden bg-white py-20 sm:py-28">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            'transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="text-primary-600 flex items-center gap-2 text-sm font-medium">
            <Sparkle weight="duotone" size={16} />
            <span>Comment ça marche</span>
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
            4 étapes simples.
            <br />
            <span className="text-neutral-400">Zéro complication.</span>
          </h2>
        </div>

        {/* Main: Steps + Visual */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr,400px] lg:gap-16">
          {/* Steps list */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;

              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    'group relative w-full rounded-xl px-5 py-4 text-left transition-all duration-300',
                    inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                    isActive
                      ? 'border border-neutral-200 bg-neutral-50'
                      : 'border border-transparent hover:bg-neutral-50/50'
                  )}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Number + Icon */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
                          isActive
                            ? `bg-gradient-to-br ${step.accent} text-white`
                            : 'border border-neutral-200 bg-white text-neutral-400'
                        )}
                      >
                        <Icon weight={isActive ? 'fill' : 'duotone'} size={20} />
                      </div>
                      {index < steps.length - 1 && (
                        <div className="h-4 w-px bg-neutral-200 lg:h-6" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-[11px] font-bold tracking-wider uppercase',
                            isActive ? step.accentText : 'text-neutral-400'
                          )}
                        >
                          Étape {step.step}
                        </span>
                        {isActive && (
                          <ArrowRight weight="bold" size={12} className={step.accentText} />
                        )}
                      </div>
                      <h3
                        className={cn(
                          'mt-1 text-base font-semibold transition-colors sm:text-lg',
                          isActive ? 'text-neutral-900' : 'text-neutral-600'
                        )}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={cn(
                          'mt-1 text-sm leading-relaxed transition-all duration-300',
                          isActive
                            ? 'max-h-20 text-neutral-500 opacity-100'
                            : 'max-h-0 overflow-hidden opacity-0'
                        )}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar for active step */}
                  {isActive && (
                    <div className="absolute right-5 bottom-0 left-5 h-0.5 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r', step.accent)}
                        style={{ animation: 'progressBar 4s linear' }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Visual preview card */}
          <div
            className={cn(
              'transition-all delay-300 duration-700',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            )}
          >
            <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              {/* Window chrome */}
              <div className="mb-4 flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="ml-3 h-5 flex-1 rounded-full bg-neutral-200/60" />
              </div>

              {/* Visual content with transition */}
              <div className="min-h-[240px]">
                {steps.map((step, i) => (
                  <div
                    key={step.step}
                    className={cn(
                      'transition-all duration-500',
                      i === activeStep
                        ? 'relative scale-100 opacity-100'
                        : 'pointer-events-none absolute inset-6 top-[52px] scale-95 opacity-0'
                    )}
                  >
                    <StepVisual step={step} />
                  </div>
                ))}
              </div>

              {/* Step indicator dots */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === activeStep
                        ? `w-6 bg-gradient-to-r ${step.accent}`
                        : 'w-1.5 bg-neutral-300'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
