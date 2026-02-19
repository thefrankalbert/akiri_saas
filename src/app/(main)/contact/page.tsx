import type { Metadata } from 'next';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Contactez l'équipe Akiri.",
};

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Contactez-nous</h1>
        <p className="mt-2 text-neutral-500">Notre équipe est là pour vous aider</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <Mail className="text-primary-500 mx-auto h-8 w-8" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">Email</h3>
            <p className="mt-1 text-sm text-neutral-500">support@akiri.app</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="text-secondary-500 mx-auto h-8 w-8" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">Chat</h3>
            <p className="mt-1 text-sm text-neutral-500">Lun-Ven, 9h-18h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="text-accent-500 mx-auto h-8 w-8" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">Adresse</h3>
            <p className="mt-1 text-sm text-neutral-500">Paris, France</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Envoyez-nous un message</h2>
          <form className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Nom complet
              </label>
              <input
                type="text"
                className="focus:border-primary-500 focus:ring-primary-500 flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:ring-1 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
              <input
                type="email"
                className="focus:border-primary-500 focus:ring-primary-500 flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:ring-1 focus:outline-none"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Sujet</label>
              <select className="focus:border-primary-500 focus:ring-primary-500 flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:ring-1 focus:outline-none">
                <option value="">Sélectionnez un sujet</option>
                <option value="general">Question générale</option>
                <option value="payment">Problème de paiement</option>
                <option value="dispute">Litige</option>
                <option value="account">Mon compte</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Message</label>
              <textarea
                rows={5}
                className="focus:border-primary-500 focus:ring-primary-500 flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                placeholder="Décrivez votre demande..."
              />
            </div>
            <p className="text-xs text-neutral-400">
              Ce formulaire sera fonctionnel une fois le backend connecté.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
