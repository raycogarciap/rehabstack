// Sección "El Problema" — muestra los tres desafíos principales de los profesionales de rehab
// Tres tarjetas que describen puntos de dolor reales: contenido, cursos y monetización
import { Clock, Search, BookOpen } from "lucide-react";

// Datos de las tres tarjetas de problemas
const PROBLEM_CARDS = [
  {
    icon: Clock,
    badge: "Content Creation",
    headline: "You know you should post on social media... but when?",
    body: "You finish work exhausted. Your competitor posts every day. You know content drives new patients, but you don't have 5 hours a week to create it.",
  },
  {
    icon: Search,
    badge: "Finding Courses",
    headline: "You want to keep learning... but finding the right course is a job in itself.",
    body: "The best in-person trainings fill up in days. You hear about them too late. You don't know what's being offered in Barcelona or São Paulo next quarter.",
  },
  {
    icon: BookOpen,
    badge: "Monetizing Expertise",
    headline: "You could teach a course... but where do you start?",
    body: "You've been treating shoulders for 15 years. Other clinicians ask you for advice. You could monetize that expertise, but building a course feels like a second job.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 px-4 bg-[#F8FAFC]">

      {/* Cabecera centrada */}
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          Sound familiar?
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          The challenges every rehabilitation professional knows
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          You didn&apos;t spend years studying to become a content creator, course hunter,
          or curriculum designer.
        </p>
      </div>

      {/* Cuadrícula de tres tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {PROBLEM_CARDS.map(({ icon: Icon, badge, headline, body }) => (
          <div
            key={badge}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#C7D2FE] transition-all duration-200"
          >
            {/* Contenedor del icono */}
            <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
              <Icon size={32} color="#4F46E5" />
            </div>

            {/* Etiqueta de categoría */}
            <div className="mb-4">
              <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full">
                {badge}
              </span>
            </div>

            {/* Titular de la tarjeta */}
            <h3 className="text-xl font-bold text-[#1E293B] mb-3 leading-snug">
              {headline}
            </h3>

            {/* Cuerpo de la tarjeta */}
            <p className="text-[#64748B] leading-relaxed text-sm">{body}</p>
          </div>
        ))}
      </div>

    </section>
  );
}
