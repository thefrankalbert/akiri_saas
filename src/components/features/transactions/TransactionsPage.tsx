'use client';

import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockTransactions, mockRequests } from '@/lib/mock-data';

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'info' | 'default'; icon: typeof Clock }
> = {
  pending: { label: 'En attente', variant: 'warning', icon: Clock },
  held: { label: 'En escrow', variant: 'info', icon: ShieldCheck },
  released: { label: 'Payé', variant: 'success', icon: CheckCircle },
  refunded: { label: 'Remboursé', variant: 'default', icon: ArrowDownLeft },
  disputed: { label: 'Litige', variant: 'warning', icon: Clock },
};

export function TransactionsPage() {
  // Enrich transactions with request data
  const enrichedTransactions = mockTransactions.map((txn) => {
    const request = mockRequests.find((r) => r.id === txn.request_id);
    return { ...txn, request };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Transactions</h1>
        <p className="mt-1 text-sm text-neutral-500">Historique de vos paiements et transactions</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900">
              {formatCurrency(mockTransactions.reduce((sum, t) => sum + t.amount, 0))}
            </p>
            <p className="text-xs text-neutral-500">Total des transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-secondary-600 text-2xl font-bold">
              {formatCurrency(
                mockTransactions
                  .filter((t) => t.status === 'released')
                  .reduce((sum, t) => sum + t.amount - t.platform_fee, 0)
              )}
            </p>
            <p className="text-xs text-neutral-500">Revenus perçus</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                mockTransactions
                  .filter((t) => t.status === 'held')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
            <p className="text-xs text-neutral-500">En escrow</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {enrichedTransactions.map((txn) => {
          const config = statusConfig[txn.status] || statusConfig.pending;
          const StatusIcon = config.icon;

          return (
            <Card key={txn.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    txn.status === 'released' ? 'bg-green-100' : 'bg-blue-100'
                  }`}
                >
                  {txn.status === 'released' ? (
                    <ArrowDownLeft className="text-green-600" size={20} />
                  ) : (
                    <ArrowUpRight className="text-blue-600" size={20} />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {txn.request?.item_description || 'Transaction'}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(txn.created_at)}
                    {txn.request?.listing && (
                      <>
                        {' '}
                        · {txn.request.listing.departure_city} → {txn.request.listing.arrival_city}
                      </>
                    )}
                  </p>
                </div>

                {/* Amount & Status */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-neutral-900">{formatCurrency(txn.amount)}</p>
                  <Badge variant={config.variant} size="sm">
                    <StatusIcon className="mr-1" size={12} />
                    {config.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-neutral-400">
        Commission plateforme : 10% par transaction
      </p>
    </div>
  );
}
