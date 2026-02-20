'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button, Avatar } from '@/components/ui';
import { mockProfiles } from '@/lib/mock-data';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-gradient-x bg-primary-500/15 absolute top-1/2 -left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[120px]" />
        <div
          className="animate-gradient-x bg-secondary-500/10 absolute top-1/2 -right-1/4 h-[400px] w-[400px] -translate-y-1/2 rounded-full blur-[100px]"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          Prêt à rejoindre la{' '}
          <span className="animate-gradient-x from-primary-400 via-accent-400 to-primary-400 bg-gradient-to-r bg-clip-text text-transparent">
            communauté
          </span>{' '}
          ?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">
          Rejoignez des milliers d&apos;expéditeurs et voyageurs de la diaspora. Inscription
          gratuite en 2 minutes.
        </p>

        {/* Social proof avatars */}
        <div className="mt-8 flex items-center justify-center gap-1">
          {mockProfiles.slice(0, 6).map((p, i) => (
            <div
              key={p.id}
              className="-ml-2 transition-transform first:ml-0 hover:z-10 hover:scale-110"
              style={{ zIndex: 6 - i }}
            >
              <Avatar
                firstName={p.first_name}
                lastName={p.last_name}
                size="md"
                className="ring-2 ring-neutral-950"
              />
            </div>
          ))}
          <span className="ml-4 text-sm font-medium text-neutral-300">+2 500 membres actifs</span>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/register">
            <Button
              size="lg"
              className="animate-glow shadow-primary-500/25 h-14 rounded-xl px-8 text-base font-semibold shadow-lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Créer mon compte gratuitement
            </Button>
          </Link>
          <Link href="/annonces">
            <Button
              size="lg"
              variant="ghost"
              className="h-14 rounded-xl px-8 text-base text-neutral-300 hover:bg-white/5 hover:text-white"
            >
              Voir les annonces
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
