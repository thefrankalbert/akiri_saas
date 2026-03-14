'use client';

import { useEffect, useState } from 'react';
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
import { supabaseConfigured } from '@/lib/supabase/client';
import type { Transaction } from '@/types';

interface EnrichedTransaction extends Transaction {
  request?: {
    item_description?: string;
    listing?: {
      departure_city?: string;
      arrival_city?: string;
    };
  };
}

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'info' | 'default'; icon: typeof Clock }
> = {
  pending: { label: 'En attente', variant: 'warning', icon: Clock },
  held: { label: 'En escrow', variant: 'info', icon: ShieldCheck },
  released: { label: 'Pay\u00e9', variant: 'success', icon: CheckCircle },
  refunded: { label: 'Rembours\u00e9', variant: 'default', icon: ArrowDownLeft },
  disputed: { label: 'Litige', variant: 'warning', icon: Clock },
};

function TransactionsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-800" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-neutral-800" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={i === 3 ? 'col-span-2 sm:col-span-1' : ''}>
            <CardContent className="p-4 text-center">
              <div className="mx-auto h-7 w-24 animate-pulse rounded bg-neutral-800" />
              <div className="mx-auto mt-2 h-3 w-32 animate-pulse rounded bg-neutral-800" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-800" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-36 animate-pulse rounded bg-neutral-800" />
              </div>
              <div className="space-y-2 text-right">
                <div className="ml-auto h-4 w-16 animate-pulse rounded bg-neutral-800" />
                <div className="ml-auto h-5 w-20 animate-pulse rounded bg-neutral-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fallback to mock data when Supabase is not configured
    if (!supabaseConfigured) {
      queueMicrotask(() => {
        const enriched = mockTransactions.map((txn) => {
          const request = mockRequests.find((r) => r.id === txn.request_id);
          return { ...txn, request } as EnrichedTransaction;
        });
        setTransactions(enriched);
        setLoading(false);
      });
      return;
    }

    const controller = new AbortController();

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/transactions', { signal: controller.signal });

        if (controller.signal.aborted) return;

        if (!res.ok) {
          setError('Erreur lors du chargement des transactions');
          setLoading(false);
          return;
        }

        const json = await res.json();
        const data = json.data?.data ?? json.data ?? [];
        setTransactions(data as EnrichedTransaction[]);
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? null
            : 'Erreur lors du chargement des transactions';
        if (message) {
          setError(message);
          setLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return <TransactionsSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-100">Transactions</h1>
          <p className="text-surface-100 mt-1 text-sm">
            Historique de vos paiements et transactions
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary mt-3 text-sm font-medium underline underline-offset-2"
            >
              R\u00e9essayer
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">Transactions</h1>
        <p className="text-surface-100 mt-1 text-sm">Historique de vos paiements et transactions</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-mono text-xl font-bold text-neutral-100 sm:text-2xl">
              {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
            </p>
            <p className="text-surface-100 text-xs">Total des transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-success font-mono text-xl font-bold sm:text-2xl">
              {formatCurrency(
                transactions
                  .filter((t) => t.status === 'released')
                  .reduce((sum, t) => sum + t.amount - t.platform_fee, 0)
              )}
            </p>
            <p className="text-surface-100 text-xs">Revenus per\u00e7us</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-info font-mono text-xl font-bold sm:text-2xl">
              {formatCurrency(
                transactions
                  .filter((t) => t.status === 'held')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
            <p className="text-surface-100 text-xs">En escrow</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-surface-100 text-sm">Aucune transaction pour le moment.</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction list */}
      <div className="space-y-3">
        {transactions.map((txn) => {
          const config = statusConfig[txn.status] || statusConfig.pending;
          const StatusIcon = config.icon;

          return (
            <Card key={txn.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    txn.status === 'released' ? 'bg-success/10' : 'bg-info/10'
                  }`}
                >
                  {txn.status === 'released' ? (
                    <ArrowDownLeft className="text-success" size={20} />
                  ) : (
                    <ArrowUpRight className="text-info" size={20} />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-100">
                    {txn.request?.item_description || 'Transaction'}
                  </p>
                  <p className="text-surface-200 truncate text-xs">
                    {formatDate(txn.created_at)}
                    {txn.request?.listing && (
                      <>
                        {' '}
                        \u00b7 {txn.request.listing.departure_city} \u2192{' '}
                        {txn.request.listing.arrival_city}
                      </>
                    )}
                  </p>
                </div>

                {/* Amount & Status */}
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-bold text-neutral-100">
                    {formatCurrency(txn.amount)}
                  </p>
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

      <p className="text-surface-200 mt-6 text-center text-xs">
        Commission plateforme : 10% par transaction
      </p>
    </div>
  );
}
