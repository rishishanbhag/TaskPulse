import HeroSection from './components/HeroSection';
import ProcessSection from './components/ProcessSection';
import FeatureSection from './components/FeatureSection';
import { LandingNavbar } from './components/LandingNavbar';

function App() {
  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-white text-gray-900 font-sans">
      {/* Background with Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <LandingNavbar />

      {/* Main Content Container with uniform padding */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center gap-32">
        <HeroSection />
        <ProcessSection />
        <FeatureSection />
      </main>
    </div>
  );
}

export default App;
