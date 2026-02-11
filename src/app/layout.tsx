import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F97316',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
