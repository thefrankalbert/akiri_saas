'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  GlobeHemisphereWest,
  Package,
  CheckCircle,
  Lightning,
  ArrowDown,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-surface-950 relative min-h-dvh overflow-hidden sm:min-h-[88vh]">
      {/* Gradient mesh — primary + accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,92,231,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.1),transparent_60%)]" />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        {/* Live badge */}
        <div
          className={cn(
            'mb-8 transition-all duration-700',
            heroVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          )}
        >
          <div className="glass inline-flex items-center gap-2.5 rounded-full px-5 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-surface-50 text-sm font-medium">
              <span className="font-bold text-neutral-100">+250</span> voyageurs cette semaine
            </span>
          </div>
        </div>

        {/* Main heading with gradient text */}
        <h1
          className={cn(
            'mx-auto max-w-4xl text-center transition-all delay-200 duration-1000',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <span className="text-display text-neutral-100">Envoyez vos colis</span>
          <span className="text-display mt-2 block">
            <span className="animate-gradient-x via-primary-300 to-accent-400 bg-gradient-to-r from-neutral-100 bg-clip-text text-transparent">
              avec la diaspora
            </span>
          </span>
        </h1>

        <p
          className={cn(
            'text-surface-50 mx-auto mt-6 max-w-xl text-center text-base leading-relaxed transition-all delay-400 duration-1000 sm:text-lg',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          Akiri connecte expéditeurs et voyageurs de la diaspora africaine. Économique. Sécurisé.{' '}
          <span className="font-semibold text-neutral-100">Communautaire.</span>
        </p>

        {/* CTA */}
        <div
          className={cn(
            'mt-10 flex flex-col items-center gap-4 transition-all delay-150 duration-500 sm:flex-row',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <Link
            href="/annonces"
            className="from-primary-500 to-primary-600 shadow-glow-primary inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-r px-8 text-base font-semibold text-white transition-all hover:shadow-lg"
          >
            Trouver un voyageur
            <ArrowRight weight="bold" size={20} />
          </Link>
          <Link
            href="/register"
            className="glass inline-flex h-14 items-center rounded-xl px-8 text-base font-semibold text-neutral-100 transition-colors hover:bg-white/[0.06]"
          >
            Je suis voyageur
          </Link>
        </div>

        {/* Quick access links */}
        <div
          className={cn(
            'mt-6 flex flex-wrap items-center justify-center gap-3 transition-all delay-600 duration-1000',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
        >
          <Link
            href="/demandes"
            className="glass text-surface-50 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-white/[0.06] hover:text-neutral-100"
          >
            <Package weight="duotone" size={14} />
            Voir les demandes
          </Link>
          <Link
            href="/corridors"
            className="glass text-surface-50 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-white/[0.06] hover:text-neutral-100"
          >
            <GlobeHemisphereWest weight="duotone" size={14} />
            Hub des corridors
          </Link>
        </div>

        {/* Trust signals */}
        <div
          className={cn(
            'mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 transition-all delay-700 duration-1000',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
        >
          {[
            { icon: ShieldCheck, text: 'Paiement sécurisé' },
            { icon: CheckCircle, text: 'Profils vérifiés' },
            { icon: Lightning, text: 'Inscription gratuite' },
          ].map((item) => (
            <span key={item.text} className="text-surface-100 flex items-center gap-1.5 text-sm">
              <item.icon weight="duotone" size={14} className="text-primary-400" />
              {item.text}
            </span>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce-subtle mt-16 sm:mt-20">
          <ArrowDown weight="bold" size={20} className="text-surface-200" />
        </div>
      </div>
    </section>
  );
}
