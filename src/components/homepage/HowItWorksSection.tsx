// Sección "Cómo Funciona" — tres pasos verticales conectados por una línea punteada
// Es el destino del scroll del CTA "See How It Works" en el Hero
import Link from "next/link";

// Datos de los tres pasos del proceso
const STEPS = [
  {
    label: "Step 1",
    headline: "Choose an AI assistant for your goal.",
    body: "Browse the marketplace and pick the assistant that matches your need — content creation, course finding, or expertise monetization. Start your 48-hour free trial with no charge until it ends.",
  },
  {
    label: "Step 2",
    headline: "Talk to it like a colleague.",
    body: "Record a voice note, upload a photo, or just type. Your AI assistant understands rehabilitation. It knows your specialty, your language, and your style.",
  },
  {
    label: "Step 3",
    headline: "Get professional results, ready to use.",
    body: "Content packages ready to post. Courses found and trip plans prepared. Full course curriculums built from your expertise. Review, approve, and publish.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-white">

      {/* Cabecera centrada */}
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          How It Works
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          From signup to results in under 5 minutes.
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          No technical setup. No learning curve. Just talk to your AI assistant
          and get professional results.
        </p>
      </div>

      {/* Pasos verticales */}
      <div className="max-w-4xl mx-auto flex flex-col gap-0">
        {STEPS.map((step, index) => (
          <div key={step.label}>

            {/* Fila del paso: círculo numerado a la izquierda, texto a la derecha */}
            <div className="flex gap-6 items-start">

              {/* Círculo con número de paso */}
              <div className="w-14 h-14 rounded-full bg-[#4F46E5] text-white font-bold text-xl flex items-center justify-center flex-shrink-0">
                {index + 1}
              </div>

              {/* Contenido del paso */}
              <div className="pt-2 pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-1">
                  {step.label}
                </p>
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">
                  {step.headline}
                </h3>
                <p className="text-[#64748B] leading-relaxed">{step.body}</p>
              </div>
            </div>

            {/* Línea conectora entre pasos — no se renderiza después del último */}
            {index < STEPS.length - 1 && (
              <div className="w-px h-12 bg-[#C7D2FE] ml-[27px]" />
            )}

          </div>
        ))}
      </div>

      {/* CTA inferior centrado */}
      <div className="text-center mt-12">
        <Link
          href="/agents"
          className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-8 py-3 rounded-lg font-semibold transition-colors inline-block text-center"
        >
          Browse AI Assistants →
        </Link>
      </div>

    </section>
  );
}
