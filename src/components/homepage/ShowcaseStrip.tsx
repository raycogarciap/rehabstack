// Sección de testimonios de profesionales que usan RehabStack
// Nombres, ubicaciones y citas hardcodeadas — solo eyebrow/headline/result/quote se traducen
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function ShowcaseStrip() {
  const t = await getTranslations("homepage");

  // Datos estáticos del showcarse — nombres y ubicaciones permanecen en inglés
  const TESTIMONIALS = [
    {
      name: "Sarah Mitchell",
      specialty: "Sports Physiotherapist",
      location: "London, UK",
      agent: "Content Engine",
      result: t("showcase.testimonial1.result"),
      quote: t("showcase.testimonial1.quote"),
      initials: "SM",
      avatarColor: "#4F46E5",
    },
    {
      name: "Carlos Mendoza",
      specialty: "Musculoskeletal Chiropractor",
      location: "Barcelona, Spain",
      agent: "CE Concierge",
      result: t("showcase.testimonial2.result"),
      quote: t("showcase.testimonial2.quote"),
      initials: "CM",
      avatarColor: "#6B9E78",
    },
    {
      name: "Priya Sharma",
      specialty: "Pelvic Floor Physiotherapist",
      location: "Melbourne, Australia",
      agent: "Course Creator",
      result: t("showcase.testimonial3.result"),
      quote: t("showcase.testimonial3.quote"),
      initials: "PS",
      avatarColor: "#F59E0B",
    },
  ];

  return (
    <section id="showcase" className="py-20 px-4 bg-white">

      {/* Cabecera centrada */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          {t("showcase.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
          {t("showcase.headline")}
        </h2>
      </div>

      {/* Cuadrícula de tarjetas de testimonio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.name}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
          >
            {/* Cabecera de la tarjeta: avatar + nombre + especialidad */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: testimonial.avatarColor }}
              >
                {testimonial.initials}
              </div>
              <div>
                <p className="font-semibold text-[#1E293B] text-sm">{testimonial.name}</p>
                <p className="text-xs text-[#64748B]">{testimonial.specialty}</p>
                <p className="text-xs text-[#64748B]">{testimonial.location}</p>
              </div>
            </div>

            {/* Badge del agente usado */}
            <span className="inline-block bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-2 py-0.5 rounded-full mt-3 mb-2">
              {testimonial.agent}
            </span>

            {/* Resultado destacado */}
            <p className="text-[#6B9E78] font-bold text-sm mb-3">{testimonial.result}</p>

            {/* Cita del profesional */}
            <p className="text-[#1E293B] text-sm leading-relaxed italic before:content-['\u201C'] after:content-['\u201D']">
              {testimonial.quote}
            </p>
          </div>
        ))}
      </div>

      {/* Invitación a aparecer en el showcase */}
      <div className="text-center mt-10">
        <Link href="/showcase" className="text-[#4F46E5] hover:underline text-sm">
          {t("showcase.wantToBeFeature")}
        </Link>
      </div>

    </section>
  );
}
