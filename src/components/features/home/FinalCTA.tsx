'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, CheckCircle, Lightning, Sparkle } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import { mockProfiles } from '@/lib/mock-data';
import { useInView } from '@/lib/hooks/use-in-view';
import { cn } from '@/lib/utils';

export function FinalCTA() {
  const { inViewRef, inView } = useInView(0.1);

  return (
    <section ref={inViewRef} className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 sm:px-12 sm:py-20 lg:px-20',
            'transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          {/* Gradient effects */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.15),transparent_60%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-neutral-300 backdrop-blur-sm">
                <Sparkle weight="fill" size={14} className="text-primary-400" />
                Inscription gratuite en 2 minutes
              </div>
            </div>

            {/* Heading */}
            <h2 className="mx-auto mt-6 max-w-3xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Rejoignez des milliers de
              <br />
              <span className="from-primary-400 via-accent-400 to-primary-400 bg-gradient-to-r bg-clip-text text-transparent">
                membres de la diaspora
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-center text-base text-neutral-400">
              Expéditeurs et voyageurs connectés sur les corridors Afrique-Europe. Rejoignez la
              communauté.
            </p>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center">
                {mockProfiles.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="-ml-2.5 first:ml-0" style={{ zIndex: 5 - i }}>
                    <Avatar
                      firstName={p.first_name}
                      lastName={p.last_name}
                      size="md"
                      className="ring-2 ring-neutral-950"
                    />
                  </div>
                ))}
                <div className="bg-primary-600 -ml-2.5 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-neutral-950">
                  +2k
                </div>
              </div>
              <div className="ml-4 text-left">
                <p className="text-sm font-semibold text-white">2 500+</p>
                <p className="text-xs text-neutral-500">membres actifs</p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group bg-primary-500 hover:bg-primary-600 inline-flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-semibold text-white transition-colors"
              >
                Créer mon compte gratuitement
                <ArrowRight
                  weight="bold"
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/annonces"
                className="inline-flex h-12 items-center rounded-xl border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Voir les annonces
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { icon: ShieldCheck, text: 'Paiement sécurisé' },
                { icon: CheckCircle, text: 'Profils vérifiés' },
                { icon: Lightning, text: 'Inscription gratuite' },
              ].map((item) => (
                <span
                  key={item.text}
                  className="flex items-center gap-1.5 text-xs text-neutral-500"
                >
                  <item.icon weight="duotone" size={14} className="text-primary-400" />
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
