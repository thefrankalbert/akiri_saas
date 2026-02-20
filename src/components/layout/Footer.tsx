import Link from 'next/link';
import { APP_NAME } from '@/constants';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">{APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              Transport collaboratif de colis pour la diaspora africaine.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Naviguer</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/annonces" className="text-sm text-neutral-500 hover:text-neutral-900">
                  Annonces
                </Link>
              </li>
              <li>
                <Link href="/corridors" className="text-sm text-neutral-500 hover:text-neutral-900">
                  Corridors
                </Link>
              </li>
              <li>
                <Link href="/demandes" className="text-sm text-neutral-500 hover:text-neutral-900">
                  Demandes
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-neutral-500 hover:text-neutral-900">
                  Devenir voyageur
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Support</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-neutral-500 hover:text-neutral-900">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-neutral-500 hover:text-neutral-900">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/securite" className="text-sm text-neutral-500 hover:text-neutral-900">
                  S&eacute;curit&eacute;
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">L&eacute;gal</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/cgu" className="text-sm text-neutral-500 hover:text-neutral-900">
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Confidentialit&eacute;
                </Link>
              </li>
              <li>
                <Link href="/mentions" className="text-sm text-neutral-500 hover:text-neutral-900">
                  Mentions l&eacute;gales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits r&eacute;serv&eacute;s.
        </div>
      </div>
    </footer>
  );
}
