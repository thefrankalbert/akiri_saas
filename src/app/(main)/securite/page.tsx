import type { Metadata } from 'next';
import { ShieldCheck, Lock, CreditCard, Eye, UserCheck, Warning } from '@phosphor-icons/react/ssr';
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
    color: 'text-info bg-info/10',
  },
  {
    icon: Lock,
    title: 'Chiffrement des données',
    description:
      'Toutes les communications et données personnelles sont chiffrées en transit (TLS 1.3) et au repos. Vos informations ne sont jamais partagées sans votre consentement.',
    color: 'text-accent-400 bg-accent-500/10',
  },
  {
    icon: UserCheck,
    title: 'Vérification des profils',
    description:
      'Chaque utilisateur peut vérifier son identité. Les profils vérifiés affichent un badge de confiance. Les avis authentiques renforcent la transparence.',
    color: 'text-primary-400 bg-primary-500/10',
  },
  {
    icon: Eye,
    title: 'Transparence des transactions',
    description:
      'Chaque étape du processus est traçable : demande, acceptation, paiement, collecte, transit, livraison. Les deux parties sont informées en temps réel.',
    color: 'text-success bg-success/10',
  },
  {
    icon: Warning,
    title: 'Système de litiges',
    description:
      "En cas de problème, notre système de litiges permet de bloquer le paiement et d'arbitrer la situation. L'argent reste protégé en escrow.",
    color: 'text-error bg-error/10',
  },
  {
    icon: ShieldCheck,
    title: 'Code de confirmation',
    description:
      "La livraison est validée par un code unique à 6 chiffres. Seul l'expéditeur connaît ce code. Sans ce code, le paiement ne peut pas être libéré.",
    color: 'text-primary-300 bg-primary-500/10',
  },
];

export default function Securite() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-100">Sécurité</h1>
        <p className="text-surface-100 mt-2">
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
                  <Icon size={20} />
                </div>
                <h3 className="mt-3 text-base font-semibold text-neutral-100">{feature.title}</h3>
                <p className="text-surface-100 mt-1.5 text-sm leading-relaxed">
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
