import Link from 'next/link';
import { APP_NAME } from '@/constants';
import { AuthBackButton } from '@/components/layout/AuthBackButton';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-950 relative flex min-h-screen flex-col">
      {/* Radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,92,231,0.15),transparent_50%)]" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-1 px-4 py-6 sm:px-6 lg:px-8">
        <AuthBackButton />
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="from-primary-500 to-primary-600 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-xl font-bold text-neutral-100">{APP_NAME}</span>
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="text-surface-100 relative z-10 px-4 py-6 text-center text-sm sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits r&eacute;serv&eacute;s.
      </footer>
    </div>
  );
}
