'use client';

import {
  ShieldCheck,
  GlobeHemisphereWest,
  Wallet,
  Heart,
  TrendUp,
  ArrowRight,
  Lock,
  CheckCircle,
  Star,
  ChatCircle,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

export function FeaturesSection() {
  const { inViewRef, inView } = useInView(0.1);

  return (
    <section ref={inViewRef} className="bg-surface-950 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — left aligned */}
        <div
          className={cn(
            'max-w-xl transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="bg-primary-500/10 text-primary-400 inline-flex items-center gap-2 rounded-full px-3 py-1">
              <TrendUp weight="duotone" size={16} />
              <span>Pourquoi Akiri</span>
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl md:text-[2.625rem] lg:text-5xl">
            Conçu pour la
            <br />
            <span className="text-surface-200">confiance.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* HERO card — Escrow (spans 2 cols on lg) */}
          <div
            className={cn(
              'glass group border-primary-500/20 hover:border-primary-500/30 relative overflow-hidden rounded-2xl p-6 transition-all duration-500 sm:p-8 lg:col-span-2 lg:row-span-2',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Lock weight="fill" size={12} />
                Système Escrow
              </div>

              <h3 className="mt-5 text-2xl font-bold text-neutral-100 sm:text-3xl">
                Paiement sécurisé.
                <br />
                <span className="text-surface-200">Toujours.</span>
              </h3>

              <p className="text-surface-100 mt-3 max-w-md text-sm leading-relaxed">
                Votre argent est protégé dans un escrow Stripe. Le voyageur n&apos;est payé
                qu&apos;après confirmation de livraison par code à 6 chiffres.
              </p>

              {/* Visual mock — escrow flow */}
              <div className="mt-6 flex items-center gap-3">
                <div className="bg-surface-800 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08]">
                  <Wallet weight="duotone" size={18} className="text-surface-100" />
                </div>
                <div className="from-surface-400 to-surface-400 h-px flex-1 bg-gradient-to-r via-emerald-400" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <ShieldCheck weight="fill" size={18} />
                </div>
                <div className="from-surface-400 to-surface-400 h-px flex-1 bg-gradient-to-r via-emerald-400" />
                <div className="bg-surface-800 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08]">
                  <CheckCircle weight="duotone" size={18} className="text-emerald-400" />
                </div>
              </div>

              <div className="text-surface-100 mt-3 flex items-center gap-3 text-[11px]">
                <span className="flex-1 text-center">Expéditeur paie</span>
                <span className="flex-1 text-center font-medium text-emerald-400">
                  Escrow sécurisé
                </span>
                <span className="flex-1 text-center">Voyageur reçoit</span>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/10" />
          </div>

          {/* Card 2 — 15+ corridors */}
          <div
            className={cn(
              'glass group hover:border-primary-500/20 relative overflow-hidden rounded-2xl p-6 transition-all duration-500',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="bg-primary-500/10 inline-flex rounded-xl p-3">
              <GlobeHemisphereWest weight="duotone" size={24} className="text-primary-400" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-neutral-100">15+ corridors</h3>
            <p className="text-surface-100 mt-1.5 text-sm leading-relaxed">
              France, Cameroun, Sénégal, Côte d&apos;Ivoire, RD Congo...
            </p>

            {/* Mini flag grid */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['🇫🇷', '🇨🇲', '🇸🇳', '🇨🇮', '🇨🇩', '🇲🇱', '🇬🇦', '🇧🇪'].map((f, i) => (
                <span
                  key={i}
                  className="bg-surface-800 flex h-8 w-8 items-center justify-center rounded-lg text-base transition-transform hover:scale-110"
                >
                  {f}
                </span>
              ))}
              <span className="bg-primary-500/10 text-primary-400 flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium">
                +7
              </span>
            </div>

            <div className="bg-primary-500/5 group-hover:bg-primary-500/10 pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-2xl transition-all duration-500" />
          </div>

          {/* Card 3 — Économies */}
          <div
            className={cn(
              'glass group hover:border-primary-500/20 relative overflow-hidden rounded-2xl p-6 transition-all duration-500',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="flex items-start justify-between">
              <div className="bg-primary-500/10 inline-flex rounded-xl p-3">
                <Wallet weight="duotone" size={24} className="text-primary-400" />
              </div>
              <span className="text-4xl font-extrabold tracking-tight text-neutral-100">
                -70<span className="text-primary-400">%</span>
              </span>
            </div>

            <h3 className="mt-4 text-lg font-bold text-neutral-100">vs transport classique</h3>
            <p className="text-surface-100 mt-1.5 text-sm leading-relaxed">
              Jusqu&apos;à 70% moins cher que le fret traditionnel. Les voyageurs rentabilisent
              leurs kilos.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="bg-surface-800 flex-1 rounded-lg px-3 py-2 text-center">
                <p className="text-surface-100 text-xs">Fret classique</p>
                <p className="text-sm font-bold text-red-400 line-through">25&euro;/kg</p>
              </div>
              <ArrowRight weight="bold" size={14} className="text-primary-400" />
              <div className="bg-primary-500/10 flex-1 rounded-lg px-3 py-2 text-center">
                <p className="text-primary-300 text-xs">Akiri</p>
                <p className="text-primary-400 text-sm font-bold">8-12&euro;/kg</p>
              </div>
            </div>
          </div>

          {/* Card 4 — Communauté vérifiée */}
          <div
            className={cn(
              'glass group hover:border-primary-500/20 relative overflow-hidden rounded-2xl p-6 transition-all duration-500 sm:col-span-2 lg:col-span-1',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="inline-flex rounded-xl bg-rose-500/10 p-3">
              <Heart weight="duotone" size={24} className="text-rose-400" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-neutral-100">Communauté vérifiée</h3>
            <p className="text-surface-100 mt-1.5 text-sm leading-relaxed">
              Profils vérifiés, avis authentiques, identité confirmée.
            </p>

            {/* Trust metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-surface-800 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <Star weight="fill" size={12} className="text-warning" />
                  <span className="text-sm font-bold text-neutral-100">4.8</span>
                </div>
                <p className="text-surface-100 text-[10px]">note moyenne</p>
              </div>
              <div className="bg-surface-800 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <CheckCircle weight="fill" size={12} className="text-emerald-400" />
                  <span className="text-sm font-bold text-neutral-100">96%</span>
                </div>
                <p className="text-surface-100 text-[10px]">succès</p>
              </div>
              <div className="bg-surface-800 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <ChatCircle weight="fill" size={12} className="text-primary-400" />
                  <span className="text-sm font-bold text-neutral-100">2.5k</span>
                </div>
                <p className="text-surface-100 text-[10px]">avis</p>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-rose-500/5 blur-2xl transition-all duration-500 group-hover:bg-rose-500/10" />
          </div>

          {/* Card 5 — CTA card */}
          <div
            className={cn(
              'glass group border-primary-500/20 flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-500 sm:col-span-2 lg:col-span-2',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '400ms' }}
          >
            <div>
              <h3 className="text-lg font-bold text-neutral-100">
                Prêt à envoyer votre premier colis ?
              </h3>
              <p className="text-surface-100 mt-1 text-sm">
                Inscription gratuite. Trouvez un voyageur en quelques clics.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/annonces"
                className="from-primary-500 to-primary-600 shadow-glow-primary inline-flex items-center gap-2 rounded-lg bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg"
              >
                Explorer les annonces
                <ArrowRight weight="bold" size={16} />
              </Link>
              <Link
                href="/register"
                className="glass inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-neutral-100 transition-colors hover:bg-white/[0.06]"
              >
                Créer mon compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
