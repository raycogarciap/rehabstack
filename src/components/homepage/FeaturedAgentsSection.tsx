// Sección de agentes destacados — Server Component con getTranslations
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Megaphone, GraduationCap, BookOpen, type LucideIcon } from "lucide-react";

interface AgentData {
  accentColor: string;
  iconBg: string;
  Icon: LucideIcon;
  badge: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  price: string;
  pricePeriod: string;
  priceAnnual: string;
  highlighted?: boolean;
}

export async function FeaturedAgentsSection() {
  const t = await getTranslations("homepage");

  const AGENTS: AgentData[] = [
    {
      accentColor: "bg-[#4F46E5]",
      iconBg: "bg-[#EEF2FF]",
      Icon: Megaphone,
      badge: t("featuredAgents.agent1.badge"),
      name: t("featuredAgents.agent1.name"),
      tagline: t("featuredAgents.agent1.tagline"),
      description: t("featuredAgents.agent1.description"),
      features: [
        t("featuredAgents.agent1.feature1"),
        t("featuredAgents.agent1.feature2"),
        t("featuredAgents.agent1.feature3"),
        t("featuredAgents.agent1.feature4"),
      ],
      price: t("featuredAgents.agent1.price"),
      pricePeriod: t("featuredAgents.agent1.pricePeriod"),
      priceAnnual: t("featuredAgents.agent1.priceAnnual"),
    },
    {
      accentColor: "bg-[#6B9E78]",
      iconBg: "bg-[#F0F7F1]",
      Icon: GraduationCap,
      badge: t("featuredAgents.agent2.badge"),
      name: t("featuredAgents.agent2.name"),
      tagline: t("featuredAgents.agent2.tagline"),
      description: t("featuredAgents.agent2.description"),
      features: [
        t("featuredAgents.agent2.feature1"),
        t("featuredAgents.agent2.feature2"),
        t("featuredAgents.agent2.feature3"),
        t("featuredAgents.agent2.feature4"),
      ],
      price: t("featuredAgents.agent2.price"),
      pricePeriod: t("featuredAgents.agent2.pricePeriod"),
      priceAnnual: t("featuredAgents.agent2.priceAnnual"),
      highlighted: true,
    },
    {
      accentColor: "bg-[#F59E0B]",
      iconBg: "bg-[#FFFBEB]",
      Icon: BookOpen,
      badge: t("featuredAgents.agent3.badge"),
      name: t("featuredAgents.agent3.name"),
      tagline: t("featuredAgents.agent3.tagline"),
      description: t("featuredAgents.agent3.description"),
      features: [
        t("featuredAgents.agent3.feature1"),
        t("featuredAgents.agent3.feature2"),
        t("featuredAgents.agent3.feature3"),
        t("featuredAgents.agent3.feature4"),
      ],
      price: t("featuredAgents.agent3.price"),
      pricePeriod: t("featuredAgents.agent3.pricePeriod"),
      priceAnnual: t("featuredAgents.agent3.priceAnnual"),
    },
  ];

  return (
    <section id="featured-agents" className="py-20 px-4 bg-[#F8FAFC]">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          {t("featuredAgents.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
          {t("featuredAgents.headline")}
        </h2>
        <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
          {t("featuredAgents.subheadline")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="relative hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            {agent.highlighted && (
              <div className="absolute top-4 right-4 z-10 bg-[#6B9E78] text-white text-xs font-bold px-3 py-1 rounded-full">
                {t("featuredAgents.mostPopular")}
              </div>
            )}
            <div
              className={`bg-white rounded-2xl shadow-sm overflow-hidden h-full flex flex-col ${
                agent.highlighted ? "border-2 border-[#6B9E78]" : "border border-gray-100"
              }`}
            >
              <div className={`h-1 w-full ${agent.accentColor}`} />
              <div className="p-8 flex flex-col flex-1">
                <div className={`${agent.iconBg} rounded-full w-14 h-14 flex items-center justify-center mb-5`}>
                  <agent.Icon size={28} color="#1E293B" />
                </div>
                <div className="mb-4">
                  <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full">
                    {agent.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#1E293B] mb-2">{agent.name}</h3>
                <p className="text-[#6B9E78] font-semibold mb-4">{agent.tagline}</p>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">{agent.description}</p>
                <ul className="mb-8 flex flex-col gap-2">
                  {agent.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#1E293B]">
                      <span className="text-[#6B9E78] font-semibold flex-shrink-0">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#1E293B]">{agent.price}</span>
                    <span className="text-[#64748B] text-sm">{agent.pricePeriod}</span>
                    <p className="text-xs text-[#64748B] mt-1">{agent.priceAnnual}</p>
                  </div>
                  <Link
                    href="/register"
                    className="block w-full bg-[#4F46E5] text-white hover:bg-[#3730A3] py-3 rounded-lg font-semibold transition-colors text-center"
                  >
                    {t("featuredAgents.startTrial")}
                  </Link>
                  <Link
                    href="/agents"
                    className="block w-full text-center text-[#4F46E5] hover:underline text-sm mt-2"
                  >
                    {t("featuredAgents.learnMore")}
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
