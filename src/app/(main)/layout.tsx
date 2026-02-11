import { Header } from '@/components/layout';
import { Footer } from '@/components/layout';
import { BottomNav } from '@/components/layout';
import { ServiceWorkerRegistration, InstallPrompt } from '@/components/features/pwa';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
      <ServiceWorkerRegistration />
      <InstallPrompt />
    </div>
  );
}
