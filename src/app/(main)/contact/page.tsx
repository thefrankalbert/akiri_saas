import type { Metadata } from 'next';
import { Envelope, ChatCircle, MapPin } from '@phosphor-icons/react/ssr';
import { Card, CardContent } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Contactez l'équipe Akiri.",
};

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-100">Contactez-nous</h1>
        <p className="text-surface-100 mt-2">Notre équipe est là pour vous aider</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <Envelope className="text-primary-400 mx-auto" size={32} />
            <h3 className="mt-3 text-sm font-semibold text-neutral-100">Email</h3>
            <p className="text-surface-100 mt-1 text-sm">support@akiri.app</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <ChatCircle className="text-accent-400 mx-auto" size={32} />
            <h3 className="mt-3 text-sm font-semibold text-neutral-100">Chat</h3>
            <p className="text-surface-100 mt-1 text-sm">Lun-Ven, 9h-18h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="text-success mx-auto" size={32} />
            <h3 className="mt-3 text-sm font-semibold text-neutral-100">Adresse</h3>
            <p className="text-surface-100 mt-1 text-sm">Paris, France</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-100">Envoyez-nous un message</h2>
          <form className="space-y-4">
            <div>
              <label className="text-surface-50 mb-1.5 block text-sm font-medium">
                Nom complet
              </label>
              <input
                type="text"
                className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500 flex h-10 w-full rounded-lg border border-white/[0.08] px-3 text-sm text-neutral-100 focus:ring-1 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="text-surface-50 mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500 flex h-10 w-full rounded-lg border border-white/[0.08] px-3 text-sm text-neutral-100 focus:ring-1 focus:outline-none"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="text-surface-50 mb-1.5 block text-sm font-medium">Sujet</label>
              <select className="bg-surface-700 focus:border-primary-500 focus:ring-primary-500 flex h-10 w-full rounded-lg border border-white/[0.08] px-3 text-sm text-neutral-100 focus:ring-1 focus:outline-none">
                <option value="">Sélectionnez un sujet</option>
                <option value="general">Question générale</option>
                <option value="payment">Problème de paiement</option>
                <option value="dispute">Litige</option>
                <option value="account">Mon compte</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-surface-50 mb-1.5 block text-sm font-medium">Message</label>
              <textarea
                rows={5}
                className="bg-surface-700 placeholder:text-surface-200 focus:border-primary-500 focus:ring-primary-500 flex w-full rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-neutral-100 focus:ring-1 focus:outline-none"
                placeholder="Décrivez votre demande..."
              />
            </div>
            <p className="text-surface-200 text-xs">
              Ce formulaire sera fonctionnel une fois le backend connecté.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
