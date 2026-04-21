// Sección "El Problema" — Server Component con getTranslations
import { getTranslations } from "next-intl/server";
import { Clock, Search, BookOpen } from "lucide-react";

export async function ProblemSection() {
  const t = await getTranslations("homepage");

  const PROBLEM_CARDS = [
    {
      icon: Clock,
      badge: t("problem.card1.badge"),
      headline: t("problem.card1.headline"),
      body: t("problem.card1.body"),
    },
    {
      icon: Search,
      badge: t("problem.card2.badge"),
      headline: t("problem.card2.headline"),
      body: t("problem.card2.body"),
    },
    {
      icon: BookOpen,
      badge: t("problem.card3.badge"),
      headline: t("problem.card3.headline"),
      body: t("problem.card3.body"),
    },
  ];

  return (
    <section id="problem" className="py-20 px-4 bg-[#F8FAFC]">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          {t("problem.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          {t("problem.headline")}
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          {t("problem.subheadline")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {PROBLEM_CARDS.map(({ icon: Icon, badge, headline, body }) => (
          <div
            key={badge}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#C7D2FE] transition-all duration-200"
          >
            <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
              <Icon size={32} color="#4F46E5" />
            </div>
            <div className="mb-4">
              <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full">
                {badge}
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-3 leading-snug">{headline}</h3>
            <p className="text-[#64748B] leading-relaxed text-sm">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
