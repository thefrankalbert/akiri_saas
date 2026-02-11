import Link from 'next/link';
import { ArrowRight, Shield, Globe, Wallet, Star, Package, Plane, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { SUPPORTED_COUNTRIES } from '@/constants';

const stats = [
  { label: 'Voyageurs actifs', value: '2,500+' },
  { label: 'Colis livrés', value: '15,000+' },
  { label: 'Corridors', value: '25+' },
  { label: 'Satisfaction', value: '4.8/5' },
];

const features = [
  {
    icon: Shield,
    title: 'Paiement sécurisé',
    description:
      "Votre argent est protégé par notre système d'escrow. Le voyageur est payé uniquement après confirmation de livraison.",
  },
  {
    icon: Globe,
    title: 'Corridors africains',
    description:
      "France, Cameroun, Sénégal, Côte d'Ivoire, RD Congo et bien plus. Trouvez un voyageur sur votre corridor.",
  },
  {
    icon: Wallet,
    title: 'Économique',
    description:
      "Jusqu'à 70% moins cher que les services de fret traditionnels. Les voyageurs rentabilisent leurs kilos disponibles.",
  },
  {
    icon: Star,
    title: 'Communauté de confiance',
    description:
      "Profils vérifiés, avis authentiques et vérification d'identité pour une expérience sûre.",
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Plane,
    title: 'Le voyageur publie',
    description: 'Indiquez votre trajet, date de départ et kilos disponibles.',
  },
  {
    step: 2,
    icon: Package,
    title: "L'expéditeur demande",
    description: 'Décrivez votre colis, poids et payez en toute sécurité.',
  },
  {
    step: 3,
    icon: Users,
    title: 'Rencontre & remise',
    description: 'Rendez-vous au point de collecte. Le voyageur prend le colis.',
  },
  {
    step: 4,
    icon: Shield,
    title: 'Livraison confirmée',
    description: 'Code de confirmation à 6 chiffres. Le voyageur est payé.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="from-primary-50 to-secondary-50 relative overflow-hidden bg-gradient-to-br via-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="bg-primary-100 text-primary-700 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-primary-500 relative inline-flex h-2 w-2 rounded-full" />
                </span>
                +250 voyageurs cette semaine
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Envoyez vos colis avec des{' '}
                <span className="text-primary-500">voyageurs de confiance</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
                Akiri connecte les expéditeurs de la diaspora africaine avec des voyageurs qui ont
                des kilos disponibles dans leurs bagages. Économique, sécurisé, communautaire.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/annonces">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Trouver un voyageur
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg">
                    Je suis voyageur
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="shadow-card rounded-xl bg-white/80 p-4 text-center backdrop-blur-sm"
                >
                  <div className="text-primary-600 text-2xl font-bold">{stat.value}</div>
                  <div className="mt-1 text-xs text-neutral-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-neutral-900">Comment ça marche ?</h2>
              <p className="mt-3 text-neutral-600">En 4 étapes simples</p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative text-center">
                    <div className="bg-primary-100 text-primary-600 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="bg-primary-500 absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white">
                      {item.step}
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-neutral-500">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-neutral-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-neutral-900">Pourquoi choisir Akiri ?</h2>
              <p className="mt-3 text-neutral-600">Une plateforme pensée pour la diaspora</p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="shadow-card hover:shadow-soft rounded-xl bg-white p-6 transition-shadow"
                  >
                    <div className="bg-primary-100 text-primary-600 mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900">{feature.title}</h3>
                    <p className="mt-2 text-sm text-neutral-500">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Corridors Preview */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-neutral-900">Nos corridors</h2>
              <p className="mt-3 text-neutral-600">Découvrez les trajets les plus populaires</p>
            </div>

            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
              {SUPPORTED_COUNTRIES.map((country) => (
                <div
                  key={country.code}
                  className="hover:border-primary-300 hover:bg-primary-50 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors"
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/corridors">
                <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Voir tous les corridors
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="from-primary-500 to-primary-600 bg-gradient-to-r py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">Prêt à envoyer votre premier colis ?</h2>
            <p className="text-primary-100 mx-auto mt-4 max-w-xl text-lg">
              Rejoignez des milliers d’expéditeurs et voyageurs qui font confiance à Akiri.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="text-primary-600 hover:bg-primary-50 bg-white"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Créer mon compte gratuitement
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
