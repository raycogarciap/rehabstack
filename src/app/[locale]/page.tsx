// Página principal localizada de RehabStack
// Cada sección es un componente independiente en src/components/homepage/
import { AnnouncementBar } from "@/components/homepage/AnnouncementBar";
import { Navbar } from "@/components/homepage/Navbar";
import { HeroSection } from "@/components/homepage/HeroSection";
import { ProblemSection } from "@/components/homepage/ProblemSection";
import { HowItWorksSection } from "@/components/homepage/HowItWorksSection";
import { FeaturedAgentsSection } from "@/components/homepage/FeaturedAgentsSection";
import { ShowcaseStrip } from "@/components/homepage/ShowcaseStrip";
import { SpecialtiesSection } from "@/components/homepage/SpecialtiesSection";
import { CreatorsSection } from "@/components/homepage/CreatorsSection";
import { BlogPreview } from "@/components/homepage/BlogPreview";
import { FinalCTA } from "@/components/homepage/FinalCTA";
import { Footer } from "@/components/homepage/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturedAgentsSection />
      <ShowcaseStrip />
      <SpecialtiesSection />
      <CreatorsSection />
      <BlogPreview />
      <FinalCTA />
      <Footer />
    </main>
  );
}
