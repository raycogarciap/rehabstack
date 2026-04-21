// Sección de agentes destacados — tres tarjetas con precios y CTAs
// Cada tarjeta representa un asistente IA del marketplace
import Link from "next/link";
import { Megaphone, GraduationCap, BookOpen, type LucideIcon } from "lucide-react";

// Tipado de cada tarjeta de agente
interface AgentCard {
  accentColor: string;
  iconBg: string;
  Icon: LucideIcon;
  badge: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  priceMonthly: number;
  priceAnnualNote: string;
  highlighted?: boolean;
}

// Datos de los tres agentes
const AGENTS: AgentCard[] = [
  {
    accentColor: "bg-[#4F46E5]",
    iconBg: "bg-[#EEF2FF]",
    Icon: Megaphone,
    badge: "Grow Your Practice",
    name: "Content Engine",
    tagline: "Turn voice notes into professional clinical content.",
    description:
      "Record a 2-minute voice note about a patient case and get a full week of Instagram carousels, LinkedIn posts, video scripts, and blog drafts — all in your voice.",
    features: [
      "Social media content ready to post",
      "Works in your language and tone",
      "Instagram, LinkedIn, video scripts & more",
      "VA-ready task briefs included",
    ],
    priceMonthly: 299,
    priceAnnualNote: "or $249/mo billed annually",
  },
  {
    accentColor: "bg-[#6B9E78]",
    iconBg: "bg-[#F0F7F1]",
    Icon: GraduationCap,
    badge: "Find Training",
    name: "CE Concierge",
    tagline: "Find your next course before the seats are gone.",
    description:
      "Scans global course providers, matches courses to your specialty and career goals, then plans your entire trip with cost estimates — before registrations close.",
    features: [
      "Global course database updated weekly",
      "Specialty and language matched",
      "Full trip planning with cost estimates",
      "Early seat alerts for high-demand courses",
    ],
    priceMonthly: 179,
    priceAnnualNote: "or $149/mo billed annually",
    highlighted: true,
  },
  {
    accentColor: "bg-[#F59E0B]",
    iconBg: "bg-[#FFFBEB]",
    Icon: BookOpen,
    badge: "Monetize Expertise",
    name: "Course Creator",
    tagline: "Turn your expertise into an online course.",
    description:
      "Record brain-dump sessions about your specialty and get a full curriculum with scripts, slides outlines, quizzes, a sales page, and a launch campaign — ready to publish.",
    features: [
      "Full curriculum from your voice notes",
      "Scripts, slides, quizzes included",
      "Sales page and launch campaign",
      "Works for any rehabilitation specialty",
    ],
    priceMonthly: 499,
    priceAnnualNote: "or $419/mo billed annually",
  },
];

export function FeaturedAgentsSection() {
  return (
    <section id="featured-agents" className="py-20 px-4 bg-[#F8FAFC]">

      {/* Cabecera centrada */}
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          AI Assistants
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          Three assistants. Three practice problems solved.
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          Each one built specifically for rehabilitation professionals. Start any
          with a 48-hour free trial.
        </p>
      </div>

      {/* Cuadrícula de tres tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="relative hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            {/* Insignia "Most Popular" — solo en la tarjeta destacada */}
            {agent.highlighted && (
              <div className="absolute top-4 right-4 z-10 bg-[#6B9E78] text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}

            {/* Tarjeta */}
            <div
              className={`bg-white rounded-2xl shadow-sm overflow-hidden h-full flex flex-col ${
                agent.highlighted
                  ? "border-2 border-[#6B9E78]"
                  : "border border-gray-100"
              }`}
            >
              {/* Barra de acento superior */}
              <div className={`h-1 w-full ${agent.accentColor}`} />

              {/* Cuerpo de la tarjeta */}
              <div className="p-8 flex flex-col flex-1">

                {/* Icono en círculo de color */}
                <div className={`${agent.iconBg} rounded-full w-14 h-14 flex items-center justify-center mb-5`}>
                  <agent.Icon size={28} color="#1E293B" />
                </div>

                {/* Categoría badge */}
                <div className="mb-4">
                  <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full">
                    {agent.badge}
                  </span>
                </div>

                {/* Nombre del agente */}
                <h3 className="text-2xl font-bold text-[#1E293B] mb-2">
                  {agent.name}
                </h3>

                {/* Tagline */}
                <p className="text-[#6B9E78] font-semibold mb-4">
                  {agent.tagline}
                </p>

                {/* Descripción */}
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                  {agent.description}
                </p>

                {/* Lista de características */}
                <ul className="mb-8 flex flex-col gap-2">
                  {agent.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#1E293B]">
                      <span className="text-[#6B9E78] font-semibold flex-shrink-0">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Bloque de precio — empuja los CTAs al fondo con mt-auto */}
                <div className="mt-auto">
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#1E293B]">
                      ${agent.priceMonthly}
                    </span>
                    <span className="text-[#64748B] text-sm">/month</span>
                    <p className="text-xs text-[#64748B] mt-1">
                      {agent.priceAnnualNote}
                    </p>
                  </div>

                  {/* CTAs */}
                  <Link
                    href="/register"
                    className="block w-full bg-[#4F46E5] text-white hover:bg-[#3730A3] py-3 rounded-lg font-semibold transition-colors text-center"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="/agents"
                    className="block w-full text-center text-[#4F46E5] hover:underline text-sm mt-2"
                  >
                    Learn more →
                  </Link>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
