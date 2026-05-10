import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChartBar, Users, Gavel, CurrencyDollar, ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@/lib/supabase/server';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: ChartBar },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/disputes', label: 'Litiges', icon: Gavel },
  { href: '/admin/transactions', label: 'Transactions', icon: CurrencyDollar },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  return (
    <div className="bg-surface-950 flex min-h-dvh">
      {/* Sidebar */}
      <aside className="bg-surface-900 fixed top-0 left-0 z-30 flex h-full w-56 flex-col border-r border-white/[0.06]">
        <div className="flex h-14 items-center gap-2 border-b border-white/[0.06] px-4">
          <Link
            href="/dashboard"
            className="text-surface-200 hover:text-primary-400 flex items-center gap-1.5 text-xs transition-colors"
          >
            <ArrowLeft size={14} />
            Retour
          </Link>
          <span className="text-surface-400 mx-1">|</span>
          <span className="text-sm font-bold text-white">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="text-surface-200 hover:bg-surface-700 hover:text-primary-400 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <Icon size={18} weight="duotone" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 pl-56">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
