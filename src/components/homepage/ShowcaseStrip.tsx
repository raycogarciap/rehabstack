// Sección de testimonios de profesionales que usan RehabStack
// Datos de placeholder — se reemplazarán con datos reales del showcase
import Link from "next/link";

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    specialty: "Sports Physiotherapist",
    location: "London, UK",
    agent: "Content Engine",
    result: "3x more patient inquiries in 6 weeks",
    quote:
      "I went from posting once a month to every day. My Instagram following doubled and I get 3x more new patient inquiries than before.",
    initials: "SM",
    avatarColor: "#4F46E5",
  },
  {
    name: "Carlos Mendoza",
    specialty: "Musculoskeletal Chiropractor",
    location: "Barcelona, Spain",
    agent: "CE Concierge",
    result: "Found 4 relevant courses in first week",
    quote:
      "It found a dry needling masterclass in Berlin I had no idea existed. Registration closed the next day — I would have missed it completely.",
    initials: "CM",
    avatarColor: "#6B9E78",
  },
  {
    name: "Priya Sharma",
    specialty: "Pelvic Floor Physiotherapist",
    location: "Melbourne, Australia",
    agent: "Course Creator",
    result: "First course launched in 8 weeks",
    quote:
      "I recorded 6 voice notes during my lunch breaks. Eight weeks later I had a full pelvic floor rehab course ready to sell.",
    initials: "PS",
    avatarColor: "#F59E0B",
  },
];

export function ShowcaseStrip() {
  return (
    <section id="showcase" className="py-20 px-4 bg-white">

      {/* Cabecera centrada */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          Real Results
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
          Practitioners seeing real results.
        </h2>
      </div>

      {/* Cuadrícula de tarjetas de testimonio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
          >
            {/* Cabecera de la tarjeta: avatar + nombre + especialidad */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: t.avatarColor }}
              >
                {t.initials}
              </div>
              <div>
                <p className="font-semibold text-[#1E293B] text-sm">{t.name}</p>
                <p className="text-xs text-[#64748B]">{t.specialty}</p>
                <p className="text-xs text-[#64748B]">{t.location}</p>
              </div>
            </div>

            {/* Badge del agente usado */}
            <span className="inline-block bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-2 py-0.5 rounded-full mt-3 mb-2">
              {t.agent}
            </span>

            {/* Resultado destacado */}
            <p className="text-[#6B9E78] font-bold text-sm mb-3">{t.result}</p>

            {/* Cita del profesional */}
            <p className="text-[#1E293B] text-sm leading-relaxed italic before:content-['\u201C'] after:content-['\u201D']">
              {t.quote}
            </p>
          </div>
        ))}
      </div>

      {/* Invitación a aparecer en el showcase */}
      <div className="text-center mt-10">
        <span className="text-[#4F46E5] hover:underline text-sm cursor-pointer">
          Want to be featured? Share your results.
        </span>
      </div>

    </section>
  );
}
