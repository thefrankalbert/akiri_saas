import Link from 'next/link';
import { APP_NAME } from '@/constants';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-primary-50 to-secondary-50 flex min-h-screen flex-col bg-gradient-to-br via-white">
      {/* Header */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">{APP_NAME}</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-neutral-400 sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits r&eacute;serv&eacute;s.
      </footer>
    </div>
  );
}
