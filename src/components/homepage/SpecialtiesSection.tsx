// Sección de especialidades clínicas soportadas
// Muestra el alcance de RehabStack a través de un grid de fichas con emoji
import { getTranslations } from "next-intl/server";

export async function SpecialtiesSection() {
  const t = await getTranslations("homepage");

  // Los emojis son universales — solo name y description se traducen
  const SPECIALTIES = [
    {
      emoji: "🏃",
      name: t("specialties.specialty1.name"),
      description: t("specialties.specialty1.description"),
    },
    {
      emoji: "🦴",
      name: t("specialties.specialty2.name"),
      description: t("specialties.specialty2.description"),
    },
    {
      emoji: "🫁",
      name: t("specialties.specialty3.name"),
      description: t("specialties.specialty3.description"),
    },
    {
      emoji: "🌸",
      name: t("specialties.specialty4.name"),
      description: t("specialties.specialty4.description"),
    },
    {
      emoji: "🤲",
      name: t("specialties.specialty5.name"),
      description: t("specialties.specialty5.description"),
    },
    {
      emoji: "🧠",
      name: t("specialties.specialty6.name"),
      description: t("specialties.specialty6.description"),
    },
  ];

  return (
    <section id="specialties" className="py-20 px-4 bg-[#F8FAFC]">

      {/* Cabecera centrada */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          {t("specialties.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          {t("specialties.headline")}
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          {t("specialties.subheadline")}
        </p>
      </div>

      {/* Cuadrícula de fichas de especialidad */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {SPECIALTIES.map((specialty) => (
          <div
            key={specialty.name}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:border-[#C7D2FE] hover:shadow-md transition-all duration-200"
          >
            <p className="text-3xl mb-3">{specialty.emoji}</p>
            <p className="font-semibold text-[#1E293B] mb-1 text-sm">{specialty.name}</p>
            <p className="text-xs text-[#64748B] leading-relaxed">{specialty.description}</p>
          </div>
        ))}
      </div>

    </section>
  );
}
