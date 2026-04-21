// Sección de llamada a la acción final — Server Component
// El formulario de email se delega a EmailCaptureForm (Client Component)
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmailCaptureForm } from "./EmailCaptureForm";

export async function FinalCTA() {
  const t = await getTranslations("homepage");

  return (
    <section
      id="final-cta"
      className="py-24 px-4 bg-gradient-to-br from-[#4F46E5] to-[#3730A3]"
    >
      <div className="max-w-3xl mx-auto text-center">

        {/* Badge eyebrow */}
        <span className="inline-block bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
          {t("finalCta.badge")}
        </span>

        {/* Titular principal */}
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          {t("finalCta.headline")}
        </h2>

        {/* Subtítulo */}
        <p className="text-lg text-indigo-200 max-w-xl mx-auto mb-10 leading-relaxed">
          {t("finalCta.subheadline")}
        </p>

        {/* CTA principal */}
        <Link
          href="/register"
          className="bg-white text-[#4F46E5] hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg transition-colors inline-block shadow-lg"
        >
          {t("finalCta.cta")}
        </Link>

        {/* Client Component para el formulario interactivo — recibe cadenas traducidas como props */}
        <EmailCaptureForm
          emailTeaser={t("finalCta.emailTeaser")}
          emailSubtext={t("finalCta.emailSubtext")}
          emailPlaceholder={t("finalCta.emailPlaceholder")}
          emailButton={t("finalCta.emailButton")}
        />

      </div>
    </section>
  );
}
