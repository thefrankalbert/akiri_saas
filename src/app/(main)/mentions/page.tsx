import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales',
  description: 'Mentions légales de la plateforme Akiri.',
};

export default function Mentions() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-neutral-100">Mentions Légales</h1>

      <div className="text-surface-100 max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Éditeur du site</h2>
          <p>
            Akiri SAS
            <br />
            Plateforme de transport collaboratif de colis
            <br />
            Paris, France
            <br />
            Email : contact@akiri.app
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Hébergement</h2>
          <p>
            Le site est hébergé par :<br />
            Vercel Inc.
            <br />
            340 S Lemon Ave #4133
            <br />
            Walnut, CA 91789, USA
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Base de données</h2>
          <p>
            Les données sont stockées et gérées par :<br />
            Supabase Inc.
            <br />
            San Francisco, CA, USA
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Paiements</h2>
          <p>
            Les transactions financières sont gérées par :<br />
            Stripe, Inc.
            <br />
            354 Oyster Point Blvd
            <br />
            South San Francisco, CA 94080, USA
            <br />
            Certifié PCI DSS Level 1
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des éléments composant le site Akiri (textes, images, logo, design, code
            source) sont protégés par le droit de la propriété intellectuelle. Toute reproduction,
            même partielle, est interdite sans autorisation préalable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Responsabilité</h2>
          <p>
            Akiri est une plateforme de mise en relation entre voyageurs et expéditeurs. Akiri ne
            transporte pas directement les colis et ne peut être tenu responsable des actes des
            utilisateurs. Akiri met en place des mesures de sécurité (vérification d&apos;identité,
            escrow, système de litiges) pour protéger les utilisateurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-100">Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, les
            tribunaux de Paris seront seuls compétents.
          </p>
        </section>
      </div>
    </div>
  );
}
