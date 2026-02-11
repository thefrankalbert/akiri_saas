'use client';

import Link from 'next/link';
import { ArrowRight, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { SUPPORTED_COUNTRIES } from '@/constants';

// Popular corridors (static for now, will be dynamic from DB)
const popularCorridors = [
  { from: 'FR', to: 'CM', count: 24, avgPrice: 8 },
  { from: 'FR', to: 'SN', count: 18, avgPrice: 9 },
  { from: 'FR', to: 'CI', count: 15, avgPrice: 10 },
  { from: 'BE', to: 'CD', count: 12, avgPrice: 11 },
  { from: 'FR', to: 'ML', count: 10, avgPrice: 9 },
  { from: 'CA', to: 'CM', count: 8, avgPrice: 15 },
  { from: 'FR', to: 'GA', count: 7, avgPrice: 12 },
  { from: 'FR', to: 'TG', count: 6, avgPrice: 10 },
];

function getCountry(code: string) {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

export function CorridorsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Corridors populaires</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Découvrez les trajets les plus fréquents de la diaspora
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {popularCorridors.map((corridor) => {
          const fromCountry = getCountry(corridor.from);
          const toCountry = getCountry(corridor.to);

          if (!fromCountry || !toCountry) return null;

          return (
            <Link
              key={`${corridor.from}-${corridor.to}`}
              href={`/annonces?from=${corridor.from}&to=${corridor.to}`}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{fromCountry.flag}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">{fromCountry.name}</p>
                    </div>
                    <ArrowRight className="text-primary-400 h-5 w-5" />
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-neutral-900">{toCountry.name}</p>
                    </div>
                    <span className="text-2xl">{toCountry.flag}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                    <div className="flex items-center gap-1 text-sm text-neutral-500">
                      <Globe className="h-4 w-4" />
                      {corridor.count} annonces actives
                    </div>
                    <div className="text-primary-600 flex items-center gap-1 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />~{corridor.avgPrice} EUR/kg
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* All countries */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Tous les pays</h2>
        <div className="flex flex-wrap gap-3">
          {SUPPORTED_COUNTRIES.map((country) => (
            <Link key={country.code} href={`/annonces?to=${country.code}`}>
              <span className="hover:border-primary-300 hover:bg-primary-50 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors">
                <span className="text-lg">{country.flag}</span>
                {country.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="from-primary-500 to-primary-600 mt-12 rounded-2xl bg-gradient-to-r p-8 text-center text-white">
        <h2 className="text-xl font-bold">Votre corridor n&apos;est pas listé ?</h2>
        <p className="text-primary-100 mt-2">
          Publiez une annonce et ouvrez un nouveau corridor pour la communauté !
        </p>
        <Link href="/annonces/new" className="mt-4 inline-block">
          <Button className="text-primary-600 hover:bg-primary-50 border-2 border-white bg-white">
            Publier une annonce
          </Button>
        </Link>
      </div>
    </div>
  );
}
