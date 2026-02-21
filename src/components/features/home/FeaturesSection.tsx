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
    <section ref={inViewRef} className="bg-neutral-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — left aligned */}
        <div
          className={cn(
            'max-w-xl transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="text-primary-600 flex items-center gap-2 text-sm font-medium">
            <TrendUp weight="duotone" size={16} />
            <span>Pourquoi Akiri</span>
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
            Conçu pour la
            <br />
            <span className="text-neutral-400">confiance.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* HERO card — Escrow (spans 2 cols on lg) */}
          <div
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-500 sm:p-8 lg:col-span-2 lg:row-span-2',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                <Lock weight="fill" size={12} />
                Système Escrow
              </div>

              <h3 className="mt-5 text-2xl font-bold text-neutral-900 sm:text-3xl">
                Paiement sécurisé.
                <br />
                <span className="text-neutral-400">Toujours.</span>
              </h3>

              <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
                Votre argent est protégé dans un escrow Stripe. Le voyageur n&apos;est payé
                qu&apos;après confirmation de livraison par code à 6 chiffres.
              </p>

              {/* Visual mock — escrow flow */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <Wallet weight="duotone" size={18} className="text-neutral-600" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-neutral-300 via-emerald-400 to-neutral-300" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <ShieldCheck weight="fill" size={18} />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-neutral-300 via-emerald-400 to-neutral-300" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <CheckCircle weight="duotone" size={18} className="text-emerald-500" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400">
                <span className="flex-1 text-center">Expéditeur paie</span>
                <span className="flex-1 text-center font-medium text-emerald-600">
                  Escrow sécurisé
                </span>
                <span className="flex-1 text-center">Voyageur reçoit</span>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/10" />
          </div>

          {/* Card 2 — 15+ corridors */}
          <div
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-500',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '100ms' }}
          >
            <GlobeHemisphereWest weight="duotone" size={28} className="text-primary-500" />

            <h3 className="mt-4 text-lg font-bold text-neutral-900">15+ corridors</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              France, Cameroun, Sénégal, Côte d&apos;Ivoire, RD Congo...
            </p>

            {/* Mini flag grid */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['🇫🇷', '🇨🇲', '🇸🇳', '🇨🇮', '🇨🇩', '🇲🇱', '🇬🇦', '🇧🇪'].map((f, i) => (
                <span
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-base transition-transform hover:scale-110"
                >
                  {f}
                </span>
              ))}
              <span className="bg-primary-50 text-primary-600 flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium">
                +7
              </span>
            </div>

            <div className="bg-primary-500/5 group-hover:bg-primary-500/10 pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-2xl transition-all duration-500" />
          </div>

          {/* Card 3 — Économies */}
          <div
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 p-6 text-white transition-all duration-500',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="flex items-start justify-between">
              <Wallet weight="duotone" size={28} className="text-primary-400" />
              <span className="text-4xl font-extrabold tracking-tight text-white">
                -70<span className="text-primary-400">%</span>
              </span>
            </div>

            <h3 className="mt-4 text-lg font-bold">vs transport classique</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
              Jusqu&apos;à 70% moins cher que le fret traditionnel. Les voyageurs rentabilisent
              leurs kilos.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="text-xs text-neutral-400">Fret classique</p>
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
              'group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-500 sm:col-span-2 lg:col-span-1',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '300ms' }}
          >
            <Heart weight="duotone" size={28} className="text-rose-500" />

            <h3 className="mt-4 text-lg font-bold text-neutral-900">Communauté vérifiée</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              Profils vérifiés, avis authentiques, identité confirmée.
            </p>

            {/* Trust metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-neutral-50 p-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <Star weight="fill" size={12} className="text-amber-400" />
                  <span className="text-sm font-bold text-neutral-900">4.8</span>
                </div>
                <p className="text-[10px] text-neutral-400">note moyenne</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <CheckCircle weight="fill" size={12} className="text-emerald-500" />
                  <span className="text-sm font-bold text-neutral-900">96%</span>
                </div>
                <p className="text-[10px] text-neutral-400">succès</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <ChatCircle weight="fill" size={12} className="text-primary-500" />
                  <span className="text-sm font-bold text-neutral-900">2.5k</span>
                </div>
                <p className="text-[10px] text-neutral-400">avis</p>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl transition-all duration-500 group-hover:bg-rose-500/10" />
          </div>

          {/* Card 5 — CTA card */}
          <div
            className={cn(
              'group border-primary-200 bg-primary-50 flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-500 sm:col-span-2 lg:col-span-2',
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            )}
            style={{ transitionDelay: '400ms' }}
          >
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Prêt à envoyer votre premier colis ?
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Inscription gratuite. Trouvez un voyageur en quelques clics.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/annonces"
                className="bg-primary-600 hover:bg-primary-700 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
              >
                Explorer les annonces
                <ArrowRight weight="bold" size={16} />
              </Link>
              <Link
                href="/register"
                className="border-primary-200 text-primary-600 hover:bg-primary-50 inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-2.5 text-sm font-medium transition-colors"
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
