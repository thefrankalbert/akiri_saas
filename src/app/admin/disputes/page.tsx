'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gavel, ArrowUUpLeft, Check } from '@phosphor-icons/react';

interface Dispute {
  id: string;
  status: string;
  weight_kg: number;
  item_description: string;
  sender_id: string;
  listing: { traveler_id: string; departure_city: string; arrival_city: string } | null;
  created_at: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      const json = await res.json();
      if (json.data) {
        setDisputes(json.data.disputes);
        setTotal(json.data.total);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (requestId: string, resolution: 'refund' | 'release') => {
    setActionLoading(requestId);
    try {
      await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, resolution }),
      });
      fetchDisputes();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Gavel size={28} weight="duotone" className="text-red-400" />
        <h1 className="text-2xl font-bold text-white">Litiges ({total})</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-800 h-24 animate-pulse rounded-xl border border-white/[0.06]"
            />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-surface-800 rounded-xl border border-white/[0.06] p-8 text-center">
          <Gavel size={40} weight="duotone" className="text-surface-400 mx-auto mb-3" />
          <p className="text-surface-300">Aucun litige en cours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-surface-800 rounded-xl border border-white/[0.06] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {dispute.listing
                      ? `${dispute.listing.departure_city} → ${dispute.listing.arrival_city}`
                      : 'Route inconnue'}
                  </p>
                  <p className="text-surface-300 mt-1 text-sm">
                    {dispute.weight_kg} kg — {dispute.item_description || 'Pas de description'}
                  </p>
                  <p className="text-surface-400 mt-1 text-xs">
                    Créé le {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(dispute.id, 'refund')}
                    disabled={actionLoading === dispute.id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <ArrowUUpLeft size={14} />
                    Rembourser
                  </button>
                  <button
                    onClick={() => handleResolve(dispute.id, 'release')}
                    disabled={actionLoading === dispute.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Check size={14} />
                    Libérer paiement
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
