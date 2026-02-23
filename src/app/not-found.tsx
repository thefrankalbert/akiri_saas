import Link from 'next/link';
import { House } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className="bg-surface-950 flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-primary-500 mb-2 text-8xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-neutral-100">Page introuvable</h2>
        <p className="text-surface-200 mb-8 max-w-md">
          La page que vous recherchez n&apos;existe pas ou a &eacute;t&eacute;
          d&eacute;plac&eacute;e.
        </p>
        <Link
          href="/"
          className="bg-primary-500 hover:bg-primary-400 inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white transition-colors"
        >
          <House size={18} weight="duotone" />
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
