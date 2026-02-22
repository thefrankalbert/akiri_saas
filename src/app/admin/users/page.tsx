'use client';

import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlass, ShieldCheck, Warning } from '@phosphor-icons/react';
import type { Profile } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.data) {
        setUsers(json.data.users);
        setTotal(json.data.total);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (userId: string, action: 'ban' | 'unban') => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action }),
    });
    fetchUsers();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Utilisateurs</h1>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass
          size={18}
          className="text-surface-300 absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-surface-800 focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-white/[0.08] py-2 pr-4 pl-10 text-sm text-white placeholder:text-neutral-500 focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-800 text-surface-300 border-b border-white/[0.06]">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Vérification</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Trajets</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
              <th className="px-4 py-3 font-medium">Actions</th>
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
              : users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-800/50">
                    <td className="px-4 py-3 font-medium text-white">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3">
                      {user.verification_level >= 3 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <ShieldCheck size={14} weight="fill" /> Niveau {user.verification_level}
                        </span>
                      ) : (
                        <span className="text-surface-400">Niveau {user.verification_level}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-amber-400">
                      {user.rating > 0 ? `${user.rating}/5` : '-'}
                    </td>
                    <td className="text-surface-300 px-4 py-3">{user.total_trips}</td>
                    <td className="text-surface-400 px-4 py-3">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAction(user.user_id, 'ban')}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        <Warning size={14} className="mr-1 inline" />
                        Suspendre
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-surface-400 text-sm">
            {total} utilisateur{total > 1 ? 's' : ''}
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
