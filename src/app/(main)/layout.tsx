import { Header } from '@/components/layout';
import { BottomNav } from '@/components/layout';
import { Sidebar } from '@/components/layout';
import { ServiceWorkerRegistration, InstallPrompt } from '@/components/features/pwa';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-950 flex min-h-screen flex-col">
      <Sidebar />
      <Header />
      <main className="flex-1 pb-24 md:pb-0 md:pl-16 lg:pl-60">{children}</main>
      <BottomNav />
      <ServiceWorkerRegistration />
      <InstallPrompt />
    </div>
  );
}
