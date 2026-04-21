// Sección para creadores — fondo oscuro, propuesta de valor para builders
// Diseño de dos columnas: pitch a la izquierda, estadísticas a la derecha
import Link from "next/link";

// Estadísticas del programa de creadores (grid 2x2)
const STATS = [
  { value: "75–80%", label: "Revenue share you keep" },
  { value: "24h", label: "Time to list your first agent" },
  { value: "6", label: "Languages your agent reaches" },
  { value: "0", label: "Direct competitors in this market" },
];

export function CreatorsSection() {
  return (
    <section id="for-creators" className="py-20 px-4 bg-[#1E293B]">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* Columna izquierda: pitch de texto + CTAs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9DC4A7] mb-3">
            For Builders &amp; Creators
          </p>
          <h2 className="text-3xl font-bold text-white mb-4">
            Build and list your own AI assistants for rehabilitation professionals.
          </h2>
          <p className="text-[#94A3B8] leading-relaxed mb-8">
            The rehabilitation industry has no AI assistant marketplace. Zero
            direct competitors. We drive users via Instagram, SEO, and the
            conference circuit — you keep 75–80% of every subscription.
          </p>

          {/* Botones CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/for-creators"
              className="bg-[#6B9E78] text-white hover:bg-[#4A7A57] px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            >
              Start Listing Agents
            </Link>
            <Link
              href="/docs"
              className="border border-[#475569] text-white hover:border-[#6B9E78] px-6 py-3 rounded-lg font-semibold transition-colors text-center"
            >
              Read the Docs
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
