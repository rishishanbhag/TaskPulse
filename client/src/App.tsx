import { useEffect, useRef } from 'react';
import HeroSection from './components/HeroSection';
import ProcessSection from './components/ProcessSection';
import FeatureSection from './components/FeatureSection';
import { LandingNavbar } from './components/LandingNavbar';

function App() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.setProperty('--glow-x', `${e.clientX}px`);
        glowRef.current.style.setProperty('--glow-y', `${e.clientY}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="min-h-screen relative w-full bg-white text-gray-900 font-sans"
    >
      {/* Background with Grid */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Cursor glow effect */}
      <div className="cursor-glow pointer-events-none" />

      <LandingNavbar />

      {/* Main Content Container with uniform padding */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-32 flex flex-col items-center gap-32">
        <HeroSection />
        <ProcessSection />
        <FeatureSection />
      </main>
    </div>
  );
}

export default App;
