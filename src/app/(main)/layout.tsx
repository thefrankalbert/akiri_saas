import { Header } from '@/components/layout';
import { BottomNav } from '@/components/layout';
import { Sidebar } from '@/components/layout';
import { ServiceWorkerRegistration, InstallPrompt } from '@/components/features/pwa';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-950 flex min-h-dvh flex-col">
      <Sidebar />
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-[var(--content-bottom)] md:pb-0 md:pl-[var(--sidebar-collapsed)] lg:pl-[var(--sidebar-width)]">
        <div className="mx-auto max-w-[1800px]">{children}</div>
      </main>
      <BottomNav />
      <ServiceWorkerRegistration />
      <InstallPrompt />
    </div>
  );
}
