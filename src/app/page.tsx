'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/features/home/HeroSection';
import { LiveTicker } from '@/components/features/home/LiveTicker';
import { AnimatedStats } from '@/components/features/home/AnimatedStats';
import { HowItWorks } from '@/components/features/home/HowItWorks';
import { FeaturesSection } from '@/components/features/home/FeaturesSection';
import { TestimonialsSection } from '@/components/features/home/TestimonialsSection';
import { CorridorsSection } from '@/components/features/home/CorridorsSection';
import { FinalCTA } from '@/components/features/home/FinalCTA';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        <HeroSection />
        <LiveTicker />
        <AnimatedStats />
        <HowItWorks />
        <FeaturesSection />
        <TestimonialsSection />
        <CorridorsSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
