import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Questions fréquemment posées sur Akiri.',
};

const faqs = [
  {
    question: 'Comment fonctionne Akiri ?',
    answer:
      "Akiri met en relation des voyageurs ayant des kilos disponibles dans leurs bagages avec des expéditeurs souhaitant envoyer des colis en Afrique. Le voyageur publie son trajet et ses kilos disponibles, l'expéditeur soumet une demande, le paiement est sécurisé par escrow, et le voyageur est payé après confirmation de livraison.",
  },
  {
    question: 'Le paiement est-il sécurisé ?',
    answer:
      "Oui, tous les paiements passent par Stripe avec un système d'escrow. L'argent est bloqué sur un compte sécurisé et n'est libéré au voyageur qu'après confirmation de la livraison par l'expéditeur via un code à 6 chiffres.",
  },
  {
    question: 'Quels types de colis puis-je envoyer ?',
    answer:
      'Vous pouvez envoyer des vêtements, chaussures, électronique, cosmétiques, médicaments (non réglementés), alimentation emballée, documents, jouets et livres. Les articles interdits par les compagnies aériennes sont exclus.',
  },
  {
    question: 'Combien coûte le service ?',
    answer:
      "Le prix est fixé par le voyageur (en €/kg). Akiri prélève une commission de 10% sur chaque transaction. En moyenne, c'est 70% moins cher que les services de fret traditionnels.",
  },
  {
    question: 'Comment devenir voyageur ?',
    answer:
      'Créez un compte gratuit, complétez votre profil avec vos informations et publiez votre premier trajet. Indiquez la date de départ, le corridor (ex: Paris → Douala) et le nombre de kilos disponibles.',
  },
  {
    question: 'Que se passe-t-il en cas de litige ?',
    answer:
      "En cas de problème, les deux parties peuvent ouvrir un litige. Notre équipe examine la situation et prend une décision. L'argent en escrow est protégé pendant toute la durée du processus.",
  },
  {
    question: 'Le poids maximum par envoi est de combien ?',
    answer:
      'Le poids maximum par demande est de 30 kg. Si vous avez besoin de plus, vous pouvez soumettre plusieurs demandes à différents voyageurs.',
  },
  {
    question: "L'inscription est-elle gratuite ?",
    answer:
      'Oui, la création de compte est entièrement gratuite. Vous ne payez que lorsque vous effectuez une transaction (envoi de colis). La commission de 10% est incluse dans le prix final.',
  },
];

export default function FAQ() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-100">Questions fréquentes</h1>
        <p className="text-surface-100 mt-2">Tout ce que vous devez savoir sur Akiri</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold text-neutral-100">{faq.question}</h3>
              <p className="text-surface-100 mt-2 text-sm leading-relaxed">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-surface-800 mt-10 rounded-2xl border border-white/[0.08] p-6 text-center">
        <p className="text-surface-100 text-sm">
          Vous n&apos;avez pas trouvé la réponse à votre question ?
        </p>
        <Link
          href="/contact"
          className="text-primary-400 hover:text-primary-300 mt-2 inline-block text-sm font-semibold"
        >
          Contactez-nous →
        </Link>
      </div>
    </div>
  );
}
