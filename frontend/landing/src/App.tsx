import { Nav } from './sections/Nav';
import { Hero } from './sections/Hero';
import { Statement } from './sections/Statement';
import { CapabilityBento } from './sections/CapabilityBento';
import { GarmentJourney } from './sections/GarmentJourney';
import { PlatformBand } from './sections/PlatformBand';
import { ProofBand } from './sections/ProofBand';
import { SecurityGrid } from './sections/SecurityGrid';
import { CtaBand } from './sections/CtaBand';
import { Footer } from './sections/Footer';

export default function App() {
  return (
    <>
      <a
        href="#capabilities"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        اتخطى إلى المحتوى
      </a>

      <Nav />

      <main>
        <Hero />
        <Statement />
        <CapabilityBento />
        <GarmentJourney />
        <PlatformBand />
        <ProofBand />
        <SecurityGrid />
        <CtaBand />
      </main>

      <Footer />
    </>
  );
}
