// app/[locale]/blog/page.tsx
// Página de listado del blog (Server Component).
// Carga todos los posts en el servidor y pasa el array al client component BlogContent
// que gestiona el filtrado por tabs sin necesidad de peticiones adicionales.

import { getAllPosts } from "@/lib/mdx";
import { BlogContent } from "@/components/blog/BlogContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | RehabStack",
  description:
    "News, articles, media and community updates on AI for rehabilitation professionals.",
  openGraph: {
    title: "Blog | RehabStack",
    description:
      "News, articles, media and community updates on AI for rehabilitation professionals.",
  },
};

export default function BlogPage() {
  // Carga de posts en el servidor: sin fetch, sin estado de carga
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band — mismo estilo oscuro que el resto del site */}
      <div className="bg-[#0F172A] py-20 px-4 text-center">
        <p className="text-[#818CF8] text-sm font-semibold uppercase tracking-widest mb-4">
          The Blog
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Insights for rehabilitation professionals.
        </h1>
        <p className="text-[#94A3B8] text-lg max-w-xl mx-auto">
          News, articles, and resources on AI-powered practice growth.
        </p>
      </div>

      {/* Tabs + grid + email capture — gestionados en el cliente */}
      <BlogContent posts={posts} />
    </div>
  );
}
