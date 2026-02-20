'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Globe, Package, CheckCircle2, Zap, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-neutral-950 sm:min-h-[88vh]">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="from-primary-950/90 absolute inset-0 bg-gradient-to-br via-neutral-950 to-neutral-950" />
        <div className="animate-gradient-x from-primary-500/20 absolute top-0 -left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-r to-transparent blur-[120px]" />
        <div
          className="animate-gradient-x from-secondary-500/15 absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-l to-transparent blur-[100px]"
          style={{ animationDelay: '2s' }}
        />
        <div className="animate-float-slow bg-accent-500/10 absolute top-1/4 left-1/3 h-[300px] w-[300px] rounded-full blur-[80px]" />
      </div>

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
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="bg-secondary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-secondary-400 relative inline-flex h-2.5 w-2.5 rounded-full" />
            </span>
            <span className="text-sm font-medium text-neutral-300">
              <span className="font-bold text-white">+250</span> voyageurs cette semaine
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
          <span className="block text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Envoyez vos colis
          </span>
          <span className="mt-2 block text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="animate-gradient-x from-primary-400 via-accent-400 to-primary-400 bg-gradient-to-r bg-clip-text text-transparent">
              avec la diaspora
            </span>
          </span>
        </h1>

        <p
          className={cn(
            'mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-neutral-400 transition-all delay-400 duration-1000 sm:text-lg',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          Akiri connecte expéditeurs et voyageurs de la diaspora africaine. Économique. Sécurisé.{' '}
          <span className="font-semibold text-white">Communautaire.</span>
        </p>

        {/* CTA */}
        <div
          className={cn(
            'mt-10 flex flex-col items-center gap-4 transition-all delay-500 duration-1000 sm:flex-row',
            heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <Link href="/annonces">
            <Button
              size="lg"
              className="animate-glow shadow-primary-500/25 h-14 rounded-xl px-8 text-base font-semibold shadow-lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Trouver un voyageur
            </Button>
          </Link>
          <Link href="/register">
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-xl border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10"
            >
              Je suis voyageur
            </Button>
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
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
          >
            <Package className="h-3.5 w-3.5" />
            Voir les demandes
          </Link>
          <Link
            href="/corridors"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
          >
            <Globe className="h-3.5 w-3.5" />
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
            { icon: Shield, text: 'Paiement sécurisé' },
            { icon: CheckCircle2, text: 'Profils vérifiés' },
            { icon: Zap, text: 'Inscription gratuite' },
          ].map((item) => (
            <span key={item.text} className="flex items-center gap-1.5 text-sm text-neutral-500">
              <item.icon className="text-secondary-400 h-3.5 w-3.5" />
              {item.text}
            </span>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce-subtle mt-16 sm:mt-20">
          <ArrowDown className="h-5 w-5 text-neutral-600" />
        </div>
      </div>
    </section>
  );
}
