'use client';

import { CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';

export function TransactionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Transactions</h1>
        <p className="mt-1 text-sm text-neutral-500">Historique de vos paiements et transactions</p>
      </div>

      {/* Empty state */}
      <Card className="py-16">
        <CardContent className="text-center">
          <CreditCard className="mx-auto h-16 w-16 text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-700">Aucune transaction</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            Vos transactions apparaîtront ici une fois que vous aurez effectué ou reçu des paiements
            sur la plateforme.
          </p>
          <Link href="/annonces" className="mt-6 inline-block">
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Explorer les annonces</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
