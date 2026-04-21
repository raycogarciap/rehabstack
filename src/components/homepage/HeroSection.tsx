"use client";

// Sección hero — usa useParams para el video por locale y useTranslations para el texto
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

const heroVideoByLocale: Record<string, string> = {
  en: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  es: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  pt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  fr: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  de: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ar: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};

export function HeroSection() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const videoUrl = heroVideoByLocale[locale] ?? heroVideoByLocale.en;
  const t = useTranslations("homepage");

  const TRUST_LINES = [
    t("hero.trustLine1"),
    t("hero.trustLine2"),
    t("hero.trustLine3"),
  ];

  function handleScrollToHowItWorks() {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="py-20 px-4 bg-[radial-gradient(ellipse_at_top,_#EEF2FF_0%,_white_60%)]">
      <div className="max-w-4xl mx-auto text-center">

        <h1 className="text-4xl md:text-6xl font-bold text-[#1E293B] leading-tight mb-6">
          {t("hero.headline")}
        </h1>

        <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("hero.subheadline")}
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <button
            onClick={handleScrollToHowItWorks}
            className="border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF] px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            {t("hero.ctaHowItWorks")}
          </button>
          <Link
            href="/agents"
            className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            {t("hero.ctaBrowse")}
          </Link>
        </div>

        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-100 mb-12">
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

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 justify-center items-center text-sm text-[#64748B]">
          {TRUST_LINES.map((line) => (
            <span key={line} className="flex items-center gap-1.5">
              <span className="text-[#6B9E78] font-semibold">✓</span>
              {line}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
