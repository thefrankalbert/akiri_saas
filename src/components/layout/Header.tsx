'use client';

import Link from 'next/link';
import { Menu, X, Search, Bell, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { APP_NAME } from '@/constants';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">{APP_NAME}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/annonces"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Annonces
          </Link>
          <Link
            href="/demandes"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Demandes
          </Link>
          <Link
            href="/corridors"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Corridors
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <button className="rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
            <Search className="h-5 w-5" />
          </button>
          <button className="relative rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
            <Bell className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
            <MessageCircle className="h-5 w-5" />
          </button>
          <div className="mx-2 h-6 w-px bg-neutral-200" />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Connexion
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Publier une annonce</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2.5 text-neutral-500 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href="/annonces"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Annonces
            </Link>
            <Link
              href="/demandes"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Demandes
            </Link>
            <Link
              href="/corridors"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Corridors
            </Link>
            <div className="my-2 h-px bg-neutral-200" />
            <Link href="/login">
              <Button variant="outline" size="md" className="w-full">
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="md" className="w-full">
                Publier une annonce
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
