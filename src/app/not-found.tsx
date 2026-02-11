import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-primary mb-2 text-8xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">Page introuvable</h2>
        <p className="mb-8 max-w-md text-gray-600">
          La page que vous recherchez n&apos;existe pas ou a &eacute;t&eacute;
          d&eacute;plac&eacute;e.
        </p>
        <Link
          href="/"
          className="bg-primary hover:bg-primary/90 inline-block rounded-xl px-8 py-3 font-semibold text-white transition-colors"
        >
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
