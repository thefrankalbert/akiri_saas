'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

interface AdminTransaction {
  id: string;
  amount: number;
  currency: string;
  platform_fee: number;
  payout_amount: number | null;
  status: string;
  created_at: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?page=${page}`);
      const json = await res.json();
      if (json.data) {
        setTransactions(json.data.transactions);
        setTotal(json.data.total);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const statusColors: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10',
    completed: 'text-emerald-400 bg-emerald-400/10',
    refunded: 'text-red-400 bg-red-400/10',
    failed: 'text-red-400 bg-red-400/10',
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Transactions</h1>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-800 text-surface-300 border-b border-white/[0.06]">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Commission</th>
              <th className="px-4 py-3 font-medium">Payout</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="bg-surface-700 h-5 w-full animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              : transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-800/50">
                    <td className="text-surface-400 px-4 py-3 font-mono text-xs">
                      {tx.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="text-primary-400 px-4 py-3">
                      {formatCurrency(tx.platform_fee)}
                    </td>
                    <td className="px-4 py-3 text-emerald-400">
                      {tx.payout_amount ? formatCurrency(tx.payout_amount) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tx.status] || 'text-surface-400 bg-surface-700'}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="text-surface-400 px-4 py-3">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-surface-400 text-sm">
            {total} transaction{total > 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-surface-800 rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-surface-300 px-2 py-1.5 text-sm">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bg-surface-800 rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
