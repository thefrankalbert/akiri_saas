'use client';

import { Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';

export function DemandesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Demandes d&apos;envoi</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Consultez les demandes d&apos;envoi de colis de la communauté
          </p>
        </div>
      </div>

      {/* Empty state */}
      <Card className="py-16">
        <CardContent className="text-center">
          <Package className="mx-auto h-16 w-16 text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-700">
            Aucune demande pour le moment
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            Les demandes d&apos;envoi apparaîtront ici une fois que des expéditeurs auront soumis
            leurs demandes. En attendant, consultez les annonces disponibles.
          </p>
          <Link href="/annonces" className="mt-6 inline-block">
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Voir les annonces</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
