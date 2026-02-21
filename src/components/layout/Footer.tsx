import Link from 'next/link';
import { APP_NAME } from '@/constants';

export function Footer() {
  return (
    <footer className="bg-surface-900 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-7 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="from-primary-500 to-primary-600 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold text-neutral-100">{APP_NAME}</span>
            </div>
            <p className="text-surface-100 mt-3 text-sm">
              Transport collaboratif de colis pour la diaspora africaine.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-100">Naviguer</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/annonces"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Annonces
                </Link>
              </li>
              <li>
                <Link
                  href="/corridors"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Corridors
                </Link>
              </li>
              <li>
                <Link
                  href="/demandes"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Demandes
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Devenir voyageur
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-100">Support</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/faq"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/securite"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  S&eacute;curit&eacute;
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-100">L&eacute;gal</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/cgu"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Confidentialit&eacute;
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions"
                  className="text-surface-100 text-sm transition-colors hover:text-neutral-100"
                >
                  Mentions l&eacute;gales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-surface-200 mt-8 border-t border-white/[0.06] pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits r&eacute;serv&eacute;s.
        </div>
      </div>
    </footer>
  );
}
