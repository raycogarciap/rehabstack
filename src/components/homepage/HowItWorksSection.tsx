// Sección "Cómo Funciona" — Server Component con getTranslations
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function HowItWorksSection() {
  const t = await getTranslations("homepage");

  const STEPS = [
    {
      label: t("howItWorks.step1.label"),
      headline: t("howItWorks.step1.headline"),
      body: t("howItWorks.step1.body"),
    },
    {
      label: t("howItWorks.step2.label"),
      headline: t("howItWorks.step2.headline"),
      body: t("howItWorks.step2.body"),
    },
    {
      label: t("howItWorks.step3.label"),
      headline: t("howItWorks.step3.headline"),
      body: t("howItWorks.step3.body"),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          {t("howItWorks.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          {t("howItWorks.headline")}
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          {t("howItWorks.subheadline")}
        </p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-0">
        {STEPS.map((step, index) => (
          <div key={step.label}>
            <div className="flex gap-6 items-start">
              <div className="w-14 h-14 rounded-full bg-[#4F46E5] text-white font-bold text-xl flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>
              <div className="pt-2 pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-1">
                  {step.label}
                </p>
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">{step.headline}</h3>
                <p className="text-[#64748B] leading-relaxed">{step.body}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className="w-px h-12 bg-[#C7D2FE] ml-[27px]" />
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href="/agents"
          className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-8 py-3 rounded-lg font-semibold transition-colors inline-block text-center"
        >
          {t("howItWorks.cta")}
        </Link>
      </div>
    </section>
  );
}
