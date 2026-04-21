"use client";

// Sección hero de la homepage de RehabStack
// - Titular grande + subtítulo + dos CTAs
// - Video embed de YouTube adaptado al locale actual
// - Tres indicadores de confianza debajo del video
import { useParams } from "next/navigation";
import Link from "next/link";

// URLs del video hero por locale — los IDs reales se reemplazan en producción
const heroVideoByLocale: Record<string, string> = {
  en: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  es: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  pt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  fr: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  de: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ar: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};

// Indicadores de confianza que aparecen debajo del video
const TRUST_LINES = [
  "Built exclusively for rehabilitation professionals",
  "Works in English, Spanish, Portuguese + 3 more languages",
  "Trusted by physiotherapists, chiropractors & osteopaths worldwide",
];

export function HeroSection() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const videoUrl = heroVideoByLocale[locale] ?? heroVideoByLocale.en;

  // Desplaza suavemente a la sección #how-it-works al hacer clic en "See How It Works"
  function handleScrollToHowItWorks() {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="py-20 px-4 bg-[radial-gradient(ellipse_at_top,_#EEF2FF_0%,_white_60%)]">
      <div className="max-w-4xl mx-auto text-center">

        {/* Titular principal */}
        <h1 className="text-4xl md:text-6xl font-bold text-[#1E293B] leading-tight mb-6">
          Grow your practice while you focus on patients.
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
          RehabStack gives you specialized AI assistants that create your social
          media content, find your next training course, and build online courses
          from your expertise — so you can grow without working more hours.
        </p>

        {/* Botones CTA */}
        <div className="flex gap-4 justify-center flex-wrap mb-16">
          {/* CTA outline — desplaza a la sección "How It Works" */}
          <button
            onClick={handleScrollToHowItWorks}
            className="border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF] px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            See How It Works
          </button>

          {/* CTA principal — lleva al listado de agentes */}
          <Link
            href="/agents"
            className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse AI Assistants
          </Link>
        </div>

        {/* Contenedor del video embed */}
        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-100 mb-12">
          {/* El truco de padding-bottom al 56.25% (= 9/16 * 100) mantiene el aspect ratio 16:9 */}
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={videoUrl}
              title="RehabStack demo video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        {/* Indicadores de confianza */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 justify-center items-center text-sm text-[#64748B]">
          {TRUST_LINES.map((line) => (
            <span key={line} className="flex items-center gap-1.5">
              {/* Checkmark en color sage (verde) */}
              <span className="text-[#6B9E78] font-semibold">✓</span>
              {line}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
