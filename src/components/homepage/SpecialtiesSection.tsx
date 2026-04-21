// Sección de especialidades clínicas soportadas
// Muestra el alcance de RehabStack a través de un grid de fichas con emoji

const SPECIALTIES = [
  {
    name: "Sports Physiotherapy",
    emoji: "🏃",
    description: "Injury prevention, performance, return-to-sport content",
  },
  {
    name: "Musculoskeletal Rehabilitation",
    emoji: "🦴",
    description: "MSK conditions, manual therapy, exercise prescription",
  },
  {
    name: "Chiropractic",
    emoji: "🫁",
    description: "Spinal health, adjustment techniques, patient education",
  },
  {
    name: "Pelvic Floor & Women's Health",
    emoji: "🌸",
    description: "Sensitive condition content, multilingual patient education",
  },
  {
    name: "Osteopathy",
    emoji: "🤲",
    description: "Holistic approach, structural assessment, lifestyle content",
  },
  {
    name: "Pediatric & Neurological",
    emoji: "🧠",
    description: "Developmental conditions, family communication, evidence-based content",
  },
];

export function SpecialtiesSection() {
  return (
    <section id="specialties" className="py-20 px-4 bg-[#F8FAFC]">

      {/* Cabecera centrada */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          Built For Your Specialty
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          Built for your specialty.
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          RehabStack AI assistants understand your clinical context, your
          terminology, and your patients.
        </p>
      </div>

      {/* Cuadrícula de fichas de especialidad */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {SPECIALTIES.map((s) => (
          <div
            key={s.name}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:border-[#C7D2FE] hover:shadow-md transition-all duration-200"
          >
            <p className="text-3xl mb-3">{s.emoji}</p>
            <p className="font-semibold text-[#1E293B] mb-1 text-sm">{s.name}</p>
            <p className="text-xs text-[#64748B] leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>

    </section>
  );
}
