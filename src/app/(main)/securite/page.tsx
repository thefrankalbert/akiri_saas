import type { Metadata } from 'next';
import { Shield, Lock, CreditCard, Eye, UserCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Sécurité',
  description: 'Comment Akiri protège vos transactions et vos données.',
};

const securityFeatures = [
  {
    icon: CreditCard,
    title: 'Escrow sécurisé',
    description:
      "Tous les paiements sont gérés par Stripe. L'argent est bloqué en escrow jusqu'à confirmation de livraison. Le voyageur n'est payé qu'après validation par l'expéditeur.",
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Lock,
    title: 'Chiffrement des données',
    description:
      'Toutes les communications et données personnelles sont chiffrées en transit (TLS 1.3) et au repos. Vos informations ne sont jamais partagées sans votre consentement.',
    color: 'text-secondary-600 bg-secondary-100',
  },
  {
    icon: UserCheck,
    title: 'Vérification des profils',
    description:
      'Chaque utilisateur peut vérifier son identité. Les profils vérifiés affichent un badge de confiance. Les avis authentiques renforcent la transparence.',
    color: 'text-primary-600 bg-primary-100',
  },
  {
    icon: Eye,
    title: 'Transparence des transactions',
    description:
      'Chaque étape du processus est traçable : demande, acceptation, paiement, collecte, transit, livraison. Les deux parties sont informées en temps réel.',
    color: 'text-accent-600 bg-accent-100',
  },
  {
    icon: AlertTriangle,
    title: 'Système de litiges',
    description:
      "En cas de problème, notre système de litiges permet de bloquer le paiement et d'arbitrer la situation. L'argent reste protégé en escrow.",
    color: 'text-red-600 bg-red-100',
  },
  {
    icon: Shield,
    title: 'Code de confirmation',
    description:
      "La livraison est validée par un code unique à 6 chiffres. Seul l'expéditeur connaît ce code. Sans ce code, le paiement ne peut pas être libéré.",
    color: 'text-indigo-600 bg-indigo-100',
  },
];

export default function Securite() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Sécurité</h1>
        <p className="mt-2 text-neutral-500">
          Comment Akiri protège vos transactions et vos données
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {securityFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardContent className="p-5">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-neutral-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
