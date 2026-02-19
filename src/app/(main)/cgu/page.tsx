import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Conditions générales d'utilisation de la plateforme Akiri.",
};

export default function CGU() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900">
        Conditions Générales d&apos;Utilisation
      </h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm leading-relaxed text-neutral-700">
        <p className="text-neutral-500">Dernière mise à jour : 11 février 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">1. Objet</h2>
          <p>
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation
            de la plateforme Akiri, un service de mise en relation entre voyageurs et expéditeurs
            pour le transport collaboratif de colis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">2. Inscription</h2>
          <p>
            L&apos;inscription est gratuite et ouverte à toute personne majeure. L&apos;utilisateur
            s&apos;engage à fournir des informations exactes et à maintenir son profil à jour. La
            vérification d&apos;identité est recommandée pour renforcer la confiance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">3. Fonctionnement</h2>
          <p>
            Akiri est une plateforme de mise en relation. Les voyageurs publient leurs trajets et
            kilos disponibles. Les expéditeurs soumettent des demandes d&apos;envoi. Akiri facilite
            la transaction mais ne transporte pas les colis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">4. Paiements</h2>
          <p>
            Les paiements sont gérés par Stripe via un système d&apos;escrow. L&apos;argent est
            bloqué jusqu&apos;à confirmation de livraison. Akiri prélève une commission de 10% par
            transaction. Le voyageur est payé après confirmation via le code à 6 chiffres.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">5. Responsabilités</h2>
          <p>
            Les utilisateurs sont responsables du contenu de leurs colis. Les articles interdits par
            les compagnies aériennes et la loi sont strictement prohibés. Akiri se réserve le droit
            de suspendre tout compte en cas de violation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">6. Litiges</h2>
          <p>
            En cas de litige entre un voyageur et un expéditeur, Akiri propose un service de
            médiation. L&apos;argent en escrow reste bloqué jusqu&apos;à résolution. Les décisions
            d&apos;Akiri sont prises en équité.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">7. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble du contenu de la plateforme (design, textes, logo) est la propriété
            d&apos;Akiri. Toute reproduction non autorisée est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">8. Modification des CGU</h2>
          <p>
            Akiri se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
            seront informés par notification. L&apos;utilisation continue de la plateforme vaut
            acceptation des nouvelles conditions.
          </p>
        </section>
      </div>
    </div>
  );
}
