import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: 'Politique de confidentialité et protection des données personnelles.',
};

export default function Confidentialite() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900">Politique de Confidentialité</h1>

      <div className="prose prose-neutral max-w-none space-y-6 text-sm leading-relaxed text-neutral-700">
        <p className="text-neutral-500">Dernière mise à jour : 11 février 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">1. Données collectées</h2>
          <p>
            Nous collectons les données nécessaires au fonctionnement du service : nom, prénom,
            adresse email, numéro de téléphone (optionnel), photo de profil (optionnelle) et données
            de transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">2. Utilisation des données</h2>
          <p>
            Vos données sont utilisées pour : la gestion de votre compte, la mise en relation avec
            d&apos;autres utilisateurs, le traitement des paiements via Stripe, l&apos;amélioration
            du service et les communications relatives à votre compte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">3. Partage des données</h2>
          <p>
            Vos données ne sont jamais vendues à des tiers. Elles sont partagées uniquement avec :
            Stripe (paiements), Supabase (hébergement des données) et Vercel (hébergement de la
            plateforme). Seules les informations nécessaires sont partagées.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">4. Protection des données</h2>
          <p>
            Toutes les données sont chiffrées en transit (TLS 1.3) et au repos. Les mots de passe
            sont hashés avec bcrypt. Les données de paiement sont gérées directement par Stripe
            (certifié PCI DSS).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">5. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de
            suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous
            contactant à privacy@akiri.app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">6. Cookies</h2>
          <p>
            Nous utilisons des cookies essentiels pour le fonctionnement du site (authentification,
            préférences). Aucun cookie publicitaire n&apos;est utilisé.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">7. Conservation</h2>
          <p>
            Les données de compte sont conservées tant que le compte est actif. Les données de
            transaction sont conservées 5 ans conformément aux obligations légales. Vous pouvez
            demander la suppression de votre compte à tout moment.
          </p>
        </section>
      </div>
    </div>
  );
}
