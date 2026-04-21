// components/blog/mdx-components.tsx
// Componentes personalizados que pueden usarse dentro de los archivos MDX.
// Se pasan como prop "components" a <MDXRemote>.

import Link from "next/link";

// --- YouTubeEmbed ---
// Inserta un iframe responsivo de YouTube dentro del contenido del post.
export function YouTubeEmbed({ url }: { url: string }) {
  return (
    <div className="relative w-full my-8" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full rounded-xl"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

// --- CTAButton ---
// Botón de llamada a la acción centrado para posts del blog.
export function CTAButton({ text, href }: { text: string; href: string }) {
  return (
    <div className="my-8 text-center">
      <Link
        href={href}
        className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
      >
        {text}
      </Link>
    </div>
  );
}

// --- EmailCapture ---
// Bloque de suscripción por email para insertar en posts.
export function EmailCapture({ text }: { text?: string }) {
  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-8 my-8 text-center">
      <p className="text-[#1E293B] font-semibold mb-4">
        {text || "Get weekly insights on AI for rehabilitation professionals."}
      </p>
      <div className="flex gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
        />
        <button className="bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#3730A3] transition-colors">
          Subscribe
        </button>
      </div>
    </div>
  );
}

// --- AgentCard ---
// Tarjeta de referencia a un agente de RehabStack, insertable en posts.
export function AgentCard({ slug }: { slug: string }) {
  const agents: Record<
    string,
    { name: string; category: string; tagline: string }
  > = {
    "content-engine": {
      name: "Content Engine",
      category: "grow-your-practice",
      tagline: "Turn voice notes into professional clinical content.",
    },
    "ce-matcher": {
      name: "CE Matcher",
      category: "find-training",
      tagline: "Find your next course before the seats are gone.",
    },
    "course-creator": {
      name: "Course Creator",
      category: "monetize-expertise",
      tagline: "Turn your expertise into an online course.",
    },
  };

  const agent = agents[slug];
  if (!agent) return null;

  return (
    <div className="bg-[#EEF2FF] rounded-2xl p-6 my-8 flex items-center justify-between gap-6">
      <div>
        <p className="font-bold text-[#1E293B] text-lg">{agent.name}</p>
        <p className="text-[#64748B] text-sm">{agent.tagline}</p>
      </div>
      <Link
        href={`/agents/${agent.category}/${slug}`}
        className="bg-[#4F46E5] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3730A3] transition-colors whitespace-nowrap flex-shrink-0"
      >
        Learn More →
      </Link>
    </div>
  );
}

// Mapa de componentes para pasar a MDXRemote
export const mdxComponents = {
  YouTubeEmbed,
  CTAButton,
  EmailCapture,
  AgentCard,
};
