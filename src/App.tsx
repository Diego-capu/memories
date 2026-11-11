import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Manifesto } from './components/Manifesto';
import { Chapters } from './components/Chapters';
import { BentoGrid } from './components/BentoGrid';
import { QuotesSection } from './components/QuotesSection';
import { InteractiveGallery } from './components/InteractiveGallery';
import { CinemaSection } from './components/CinemaSection';
import { AvatarsSection } from './components/AvatarsSection';
import { FooterCTA } from './components/FooterCTA';

export function App(): React.JSX.Element {
  return (
    <div className="relative min-h-screen bg-[#faf8f5] text-[#0f172a] dark:bg-[#070d18] dark:text-[#f1f5f9] font-sans selection:bg-sky-500/20 selection:text-sky-900 dark:selection:bg-sky-500/30 dark:selection:text-sky-200 transition-colors duration-300">
      {/* Floating Glass Pill Navbar */}
      <Navbar />

      {/* Main Content Sections */}
      <main>
        <Hero />
        <Manifesto />
        <Chapters />
        <BentoGrid />
        <QuotesSection />
        <InteractiveGallery />
        <CinemaSection />
        <AvatarsSection />
      </main>

      {/* Footer & Celebration CTA */}
      <FooterCTA />
    </div>
  );
}

export default App;
