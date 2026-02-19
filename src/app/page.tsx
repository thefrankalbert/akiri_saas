'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Globe,
  Wallet,
  Star,
  Package,
  Plane,
  Users,
  CheckCircle2,
  TrendingUp,
  Heart,
  Zap,
  ArrowDown,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button, Badge, Avatar } from '@/components/ui';
import { SUPPORTED_COUNTRIES } from '@/constants';
import { cn } from '@/lib/utils';
import { mockListings, mockProfiles } from '@/lib/mock-data';

// ============================================
// Data
// ============================================

const heroStats = [
  {
    label: 'Voyageurs actifs',
    value: 2500,
    suffix: '+',
    icon: Users,
    color: 'from-primary-500 to-primary-600',
  },
  {
    label: 'Colis livrés',
    value: 15000,
    suffix: '+',
    icon: Package,
    color: 'from-secondary-500 to-secondary-600',
  },
  { label: 'Corridors', value: 25, suffix: '+', icon: Globe, color: 'from-blue-500 to-blue-600' },
  {
    label: 'Satisfaction',
    value: 4.8,
    suffix: '/5',
    icon: Star,
    color: 'from-accent-500 to-accent-600',
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Plane,
    title: 'Le voyageur publie',
    description: 'Trajet, date de départ et kilos disponibles.',
    emoji: '✈️',
  },
  {
    step: 2,
    icon: Package,
    title: "L'expéditeur demande",
    description: 'Description du colis, poids. Paiement sécurisé.',
    emoji: '📦',
  },
  {
    step: 3,
    icon: Users,
    title: 'Rencontre & remise',
    description: 'Point de collecte convenu. Le voyageur prend le colis.',
    emoji: '🤝',
  },
  {
    step: 4,
    icon: CheckCircle2,
    title: 'Livraison confirmée',
    description: 'Code à 6 chiffres. Le voyageur est payé instantanément.',
    emoji: '✅',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Escrow garanti',
    description:
      'Votre argent est protégé. Le voyageur est payé uniquement après confirmation de livraison.',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    stat: '100%',
    statLabel: 'sécurisé',
  },
  {
    icon: Globe,
    title: '15+ corridors',
    description:
      "France, Cameroun, Sénégal, Côte d'Ivoire... Trouvez un voyageur sur votre corridor.",
    gradient: 'from-secondary-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
    stat: '15+',
    statLabel: 'pays',
  },
  {
    icon: Wallet,
    title: '-70% vs fret',
    description:
      "Jusqu'à 70% moins cher. Les voyageurs rentabilisent leurs kilos. Tout le monde y gagne.",
    gradient: 'from-primary-500 to-amber-600',
    bgGradient: 'from-orange-50 to-amber-50',
    stat: '70%',
    statLabel: "d'économies",
  },
  {
    icon: Heart,
    title: 'Communauté vérifiée',
    description:
      "Profils vérifiés, avis authentiques, vérification d'identité. Confiance garantie.",
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50',
    stat: '4.8',
    statLabel: '/5 de note',
  },
];

const testimonials = [
  {
    profile: mockProfiles[0],
    text: "Grâce à Akiri, j'envoie des colis à ma famille à Douala chaque mois. C'est fiable, économique et la communauté est incroyable !",
    role: 'Expéditrice régulière',
    corridor: 'Paris → Douala',
  },
  {
    profile: mockProfiles[2],
    text: 'Je voyage souvent entre Paris et Yaoundé. Akiri me permet de rentabiliser mes kilos disponibles. Tout le monde y gagne !',
    role: 'Voyageur vérifié',
    corridor: 'Paris → Yaoundé',
  },
  {
    profile: mockProfiles[11],
    text: "Le système d'escrow est rassurant. On sait que le paiement est sécurisé. Je recommande à 100% !",
    role: 'Voyageur premium',
    corridor: 'Bruxelles → Kinshasa',
  },
];

// ============================================
// Helpers
// ============================================

function formatStatValue(value: number, suffix: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace('.', ',')}k${suffix}`;
  }
  return `${value}${suffix}`;
}

// ============================================
// Intersection observer hook
// ============================================

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// ============================================
// Component
// ============================================

export default function HomePage() {
  // --- Animated stats ---
  const [displayedStats, setDisplayedStats] = useState(heroStats.map(() => 0));
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [_liveFeedIndex, setLiveFeedIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  // --- Intersection observers for scroll reveal ---
  const statsSection = useInView(0.2);
  const howItWorksSection = useInView(0.15);
  const featuresSection = useInView(0.15);
  const testimonialsSection = useInView(0.15);
  const corridorsSection = useInView(0.15);

  // --- Live feed simulation ---
  const liveFeedItems = useMemo(() => {
    return mockListings.slice(0, 10).map((listing) => ({
      traveler: listing.traveler,
      departure: listing.departure_city,
      arrival: listing.arrival_city,
      kg: listing.available_kg,
      price: listing.price_per_kg,
    }));
  }, []);

  // --- Top corridors from mock data ---
  const topCorridors = useMemo(() => {
    const corridorMap = new Map<
      string,
      { count: number; from: string; to: string; fromFlag: string; toFlag: string; totalKg: number }
    >();

    for (const listing of mockListings) {
      const fromCountry = SUPPORTED_COUNTRIES.find((c) => c.name === listing.departure_country);
      const toCountry = SUPPORTED_COUNTRIES.find((c) => c.name === listing.arrival_country);
      if (!fromCountry || !toCountry) continue;

      const key = `${fromCountry.code}-${toCountry.code}`;
      const existing = corridorMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalKg += listing.available_kg;
      } else {
        corridorMap.set(key, {
          count: 1,
          from: listing.departure_city,
          to: listing.arrival_city,
          fromFlag: fromCountry.flag,
          toFlag: toCountry.flag,
          totalKg: listing.available_kg,
        });
      }
    }

    return Array.from(corridorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, []);

  // --- Hero entrance animation ---
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- Animated counter on mount ---
  useEffect(() => {
    if (!statsSection.isInView) return;

    const targets = heroStats.map((s) => s.value);
    const steps = 50;
    const interval = 2000 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);

      setDisplayedStats(
        targets.map((target) => {
          const val = target * eased;
          return target < 10 ? Math.round(val * 10) / 10 : Math.round(val);
        })
      );

      if (step >= steps) {
        clearInterval(timer);
        setDisplayedStats(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [statsSection.isInView]);

  // --- Testimonial auto-rotate ---
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // --- How it works step auto-advance ---
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % howItWorks.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // --- Live feed cycling ---
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveFeedIndex((prev) => (prev + 1) % liveFeedItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [liveFeedItems.length]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ===== HERO SECTION — Dark, cinematic ===== */}
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
              Akiri connecte expéditeurs et voyageurs de la diaspora africaine. Économique.
              Sécurisé. <span className="font-semibold text-white">Communautaire.</span>
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
                <span
                  key={item.text}
                  className="flex items-center gap-1.5 text-sm text-neutral-500"
                >
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

        {/* ===== LIVE MARQUEE TICKER ===== */}
        <section className="relative overflow-hidden border-b border-neutral-200 bg-white py-3">
          <div className="flex items-center">
            <div className="z-10 flex shrink-0 items-center gap-2 bg-white pr-3 pl-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-bold tracking-wider text-green-600 uppercase">
                Live
              </span>
            </div>

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <div className="animate-marquee flex gap-8 whitespace-nowrap">
                {[...liveFeedItems, ...liveFeedItems].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-sm text-neutral-600">
                    <span className="font-semibold text-neutral-900">
                      {item.traveler?.first_name} {item.traveler?.last_name?.charAt(0)}.
                    </span>
                    <span className="text-primary-500">→</span>
                    <span>
                      {item.departure} → {item.arrival}
                    </span>
                    <Badge variant="outline" size="sm">
                      {item.kg}kg
                    </Badge>
                    <span className="text-primary-600 font-medium">{item.price}€/kg</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== ANIMATED STATS ===== */}
        <section ref={statsSection.ref} className="relative bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {heroStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 text-center shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-6',
                      statsSection.isInView
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                    )}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div
                      className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', stat.color)}
                    />

                    <div
                      className={cn(
                        'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                        stat.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                      {formatStatValue(displayedStats[i], stat.suffix)}
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS — Timeline ===== */}
        <section
          ref={howItWorksSection.ref}
          className="relative overflow-hidden bg-neutral-50 py-20 sm:py-28"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-primary-100/30 absolute top-0 right-0 h-72 w-72 rounded-full blur-[100px]" />
            <div className="bg-secondary-100/30 absolute bottom-0 left-0 h-72 w-72 rounded-full blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                'mx-auto max-w-2xl text-center transition-all duration-700',
                howItWorksSection.isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
            >
              <div className="bg-primary-100 text-primary-700 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Simple &amp; rapide
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Comment ça marche ?
              </h2>
              <p className="mt-3 text-neutral-500">
                Envoyez vos colis en Afrique en 4 étapes simples
              </p>
            </div>

            {/* Steps */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              {/* Desktop connecting line */}
              <div className="from-primary-200 via-primary-300 to-secondary-200 absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b lg:block" />

              <div className="grid gap-8 lg:gap-0">
                {howItWorks.map((item, index) => {
                  const isActive = activeStep === index;
                  const isEven = index % 2 === 0;

                  return (
                    <div
                      key={item.step}
                      className={cn(
                        'relative transition-all duration-700',
                        howItWorksSection.isInView
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-8 opacity-0'
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
                          {index < howItWorks.length - 1 && (
                            <div className="absolute top-full left-1/2 h-8 w-px -translate-x-1/2 bg-neutral-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white transition-colors',
                                isActive ? 'bg-primary-500' : 'bg-neutral-400'
                              )}
                            >
                              {item.step}
                            </span>
                            <h3 className="text-base font-semibold text-neutral-900">
                              {item.title}
                            </h3>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Desktop layout — alternating timeline */}
                      <div className="hidden lg:grid lg:grid-cols-[1fr,auto,1fr] lg:items-center lg:gap-8 lg:py-6">
                        <div className={cn('transition-all duration-300', isEven ? '' : 'order-3')}>
                          <button
                            type="button"
                            className={cn(
                              'w-full rounded-2xl p-6 text-left transition-all duration-300',
                              isEven ? 'text-right' : 'text-left',
                              isActive ? 'scale-[1.02] bg-white shadow-lg' : 'bg-transparent'
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

        {/* ===== FEATURES ===== */}
        <section ref={featuresSection.ref} className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                'mx-auto max-w-2xl text-center transition-all duration-700',
                featuresSection.isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
            >
              <div className="bg-secondary-100 text-secondary-700 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
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
                      'group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl sm:p-8',
                      featuresSection.isInView
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                    )}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                        feature.bgGradient
                      )}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm',
                            feature.gradient
                          )}
                        >
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              'bg-gradient-to-r bg-clip-text text-2xl font-extrabold text-transparent',
                              feature.gradient
                            )}
                          >
                            {feature.stat}
                          </span>
                          <p className="text-xs text-neutral-500">{feature.statLabel}</p>
                        </div>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-neutral-900">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS — Dark section ===== */}
        <section
          ref={testimonialsSection.ref}
          className="relative overflow-hidden bg-neutral-950 py-20 sm:py-28"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="from-primary-950/50 to-secondary-950/30 absolute inset-0 bg-gradient-to-br via-transparent" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                'mx-auto max-w-2xl text-center transition-all duration-700',
                testimonialsSection.isInView
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-8 opacity-0'
              )}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-neutral-300">
                <Star className="text-accent-400 h-4 w-4" />
                Témoignages
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">La communauté parle</h2>
              <p className="mt-3 text-neutral-400">
                Des milliers de membres font confiance à Akiri
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-3xl">
              <div className="relative min-h-[280px] sm:min-h-[240px]">
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      'transition-all duration-700',
                      i === activeTestimonial
                        ? 'relative scale-100 opacity-100'
                        : 'pointer-events-none absolute inset-0 scale-95 opacity-0'
                    )}
                  >
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                      <div className="mb-4 flex gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="fill-accent-400 text-accent-400 h-5 w-5" />
                        ))}
                      </div>

                      <blockquote className="text-lg leading-relaxed font-medium text-white sm:text-xl">
                        &ldquo;{t.text}&rdquo;
                      </blockquote>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            firstName={t.profile.first_name}
                            lastName={t.profile.last_name}
                            size="lg"
                            isVerified={t.profile.is_verified}
                          />
                          <div>
                            <p className="font-semibold text-white">
                              {t.profile.first_name} {t.profile.last_name}
                            </p>
                            <p className="text-sm text-neutral-400">{t.role}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          size="sm"
                          className="w-fit border-white/20 text-neutral-400"
                        >
                          <MapPin className="mr-1 h-3 w-3" />
                          {t.corridor}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation dots — 44px touch targets */}
              <div className="mt-8 flex justify-center gap-3">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className="flex h-11 w-11 items-center justify-center"
                    aria-label={`Témoignage ${i + 1}`}
                  >
                    <span
                      className={cn(
                        'block h-2.5 rounded-full transition-all duration-300',
                        i === activeTestimonial ? 'bg-primary-500 w-10' : 'w-2.5 bg-neutral-600'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CORRIDORS ===== */}
        <section ref={corridorsSection.ref} className="bg-neutral-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                'mx-auto max-w-2xl text-center transition-all duration-700',
                corridorsSection.isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                <Globe className="h-4 w-4" />
                Corridors
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Les routes les plus actives
              </h2>
              <p className="mt-3 text-neutral-500">
                Des voyageurs disponibles chaque semaine sur ces corridors
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topCorridors.map((corridor, i) => (
                <Link
                  key={i}
                  href="/corridors"
                  className={cn(
                    'transition-all duration-500',
                    corridorsSection.isInView
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0'
                  )}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-3xl">
                        <span>{corridor.fromFlag}</span>
                        <div className="bg-primary-100 flex h-7 w-7 items-center justify-center rounded-full">
                          <Plane className="text-primary-600 h-3.5 w-3.5" />
                        </div>
                        <span>{corridor.toFlag}</span>
                      </div>
                      <ArrowRight className="group-hover:text-primary-500 ml-auto h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1" />
                    </div>

                    <p className="mt-3 truncate text-sm font-semibold text-neutral-900">
                      {corridor.from} → {corridor.to}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {corridor.count} annonce{corridor.count > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="text-secondary-500 h-3 w-3" />
                        {corridor.totalKg}kg dispo
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Country pills */}
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
              {SUPPORTED_COUNTRIES.map((country) => (
                <Link key={country.code} href={`/annonces?to=${country.code}`}>
                  <span className="hover:border-primary-200 hover:bg-primary-50 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors">
                    <span>{country.flag}</span>
                    {country.name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/corridors">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Explorer le hub des corridors
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA — Dark cinematic ===== */}
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
              <span className="ml-4 text-sm font-medium text-neutral-300">
                +2 500 membres actifs
              </span>
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
      </main>

      <Footer />
    </div>
  );
}
