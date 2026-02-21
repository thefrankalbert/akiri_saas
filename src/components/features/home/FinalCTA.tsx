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
    <section ref={inViewRef} className="bg-surface-950 relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'bg-surface-900 relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-20 lg:px-20',
            'transition-all duration-700',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          {/* Gradient effects */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(108,92,231,0.2),transparent_60%)]" />
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
              <div className="glass text-surface-50 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Sparkle weight="fill" size={14} className="text-primary-400" />
                Inscription gratuite en 2 minutes
              </div>
            </div>

            {/* Heading */}
            <h2 className="mx-auto mt-6 max-w-3xl text-center text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl md:text-[2.625rem] lg:text-5xl">
              Rejoignez des milliers de
              <br />
              <span className="from-primary-400 via-accent-400 to-primary-400 bg-gradient-to-r bg-clip-text text-transparent">
                membres de la diaspora
              </span>
            </h2>

            <p className="text-surface-100 mx-auto mt-4 max-w-lg text-center text-base">
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
                      className="ring-surface-900 ring-2"
                    />
                  </div>
                ))}
                <div className="from-primary-500 to-primary-600 ring-surface-900 -ml-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r text-xs font-bold text-white ring-2">
                  +2k
                </div>
              </div>
              <div className="ml-4 text-left">
                <p className="text-sm font-semibold text-neutral-100">2 500+</p>
                <p className="text-surface-100 text-xs">membres actifs</p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group from-primary-500 to-primary-600 shadow-glow-primary inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r px-7 text-sm font-semibold text-white transition-all hover:shadow-lg"
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
                className="glass inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold text-neutral-100 transition-colors hover:bg-white/[0.06]"
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
                  className="text-surface-100 flex items-center gap-1.5 text-xs"
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
