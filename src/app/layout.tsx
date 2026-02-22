import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://akiri.app';

export const metadata: Metadata = {
  title: {
    default: 'Akiri - Transport collaboratif de colis',
    template: '%s | Akiri',
  },
  description:
    'Plateforme de transport collaboratif de colis pour la diaspora africaine. Envoyez vos colis avec des voyageurs de confiance.',
  keywords: [
    'transport colis',
    'diaspora africaine',
    'envoi colis Afrique',
    'transport collaboratif',
    'kilos disponibles',
    'envoyer colis',
    'voyageur',
    'marketplace colis',
  ],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: 'Akiri',
    title: 'Akiri - Transport collaboratif de colis pour la diaspora',
    description:
      'Envoyez vos colis en Afrique avec des voyageurs de confiance. Moins cher, plus rapide, 100% s\u00e9curis\u00e9.',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Akiri - Transport collaboratif de colis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akiri - Transport collaboratif de colis',
    description:
      'Envoyez vos colis en Afrique avec des voyageurs de confiance. Moins cher, plus rapide.',
    images: [`${APP_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Akiri',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0F',
};

// JSON-LD structured data for the marketplace
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Akiri',
  url: APP_URL,
  description: 'Plateforme de transport collaboratif de colis pour la diaspora africaine.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
  },
  provider: {
    '@type': 'Organization',
    name: 'Akiri',
    url: APP_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>{children}</PostHogProvider>
        </NextIntlClientProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
