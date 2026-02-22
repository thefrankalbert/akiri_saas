'use client';

import { useState, useEffect } from 'react';
import { Users, Package, CurrencyDollar, Gavel, ShieldCheck, TrendUp } from '@phosphor-icons/react';

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalRequests: number;
  totalTransactions: number;
  activeDisputes: number;
  pendingVerifications: number;
  revenue: number;
}

const mockStats: AdminStats = {
  totalUsers: 1247,
  totalListings: 389,
  totalRequests: 856,
  totalTransactions: 623,
  activeDisputes: 4,
  pendingVerifications: 12,
  revenue: 15420,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();
        if (json.data) {
          setStats(json.data);
        } else {
          setStats(mockStats);
        }
      } catch {
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = stats
    ? [
        { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
        { label: 'Annonces', value: stats.totalListings, icon: Package, color: 'text-emerald-400' },
        {
          label: 'Transactions',
          value: stats.totalTransactions,
          icon: CurrencyDollar,
          color: 'text-amber-400',
        },
        {
          label: 'Litiges actifs',
          value: stats.activeDisputes,
          icon: Gavel,
          color: 'text-red-400',
        },
        {
          label: 'Vérifications en attente',
          value: stats.pendingVerifications,
          icon: ShieldCheck,
          color: 'text-purple-400',
        },
        {
          label: 'Revenus (€)',
          value: `${stats.revenue.toLocaleString('fr-FR')} €`,
          icon: TrendUp,
          color: 'text-primary-400',
        },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard Admin</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-800 h-28 animate-pulse rounded-xl border border-white/[0.06]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-surface-800 flex items-center gap-4 rounded-xl border border-white/[0.06] p-5"
            >
              <div className={`${color} bg-surface-700 rounded-lg p-3`}>
                <Icon size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-surface-300 text-sm">{label}</p>
                <p className="text-xl font-bold text-white">
                  {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
