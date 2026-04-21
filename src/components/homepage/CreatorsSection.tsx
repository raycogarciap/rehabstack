// Sección para creadores — fondo oscuro, propuesta de valor para builders
// Diseño de dos columnas: pitch a la izquierda, estadísticas a la derecha
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function CreatorsSection() {
  const t = await getTranslations("homepage");

  // Estadísticas del programa de creadores (grid 2x2) — valores numéricos traducibles
  const STATS = [
    { value: t("creators.stat1Value"), label: t("creators.stat1Label") },
    { value: t("creators.stat2Value"), label: t("creators.stat2Label") },
    { value: t("creators.stat3Value"), label: t("creators.stat3Label") },
    { value: t("creators.stat4Value"), label: t("creators.stat4Label") },
  ];

  return (
    <section id="for-creators" className="py-20 px-4 bg-[#1E293B]">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Columna izquierda: pitch de texto + CTAs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9DC4A7] mb-3">
            {t("creators.eyebrow")}
          </p>
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("creators.headline")}
          </h2>
          <p className="text-[#94A3B8] leading-relaxed mb-8">
            {t("creators.body")}
          </p>

          {/* Botones CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/for-creators"
              className="bg-[#6B9E78] text-white hover:bg-[#4A7A57] px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            >
              {t("creators.ctaList")}
            </Link>
            <Link
              href="/docs"
              className="border border-[#475569] text-white hover:border-[#6B9E78] px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            >
              {t("creators.ctaDocs")}
            </Link>
          </div>
        </div>

        {/* Columna derecha: 4 cajas de estadísticas en grid 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-[#334155] rounded-xl p-5">
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-[#94A3B8] text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
