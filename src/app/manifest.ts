import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Akiri - Transport collaboratif de colis',
    short_name: 'Akiri',
    description:
      'Plateforme de transport collaboratif de colis pour la diaspora africaine. Envoyez vos colis avec des voyageurs de confiance.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F97316',
    orientation: 'portrait',
    categories: ['travel', 'logistics', 'shopping'],
    lang: 'fr',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
