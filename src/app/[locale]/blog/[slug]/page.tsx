// app/[locale]/blog/[slug]/page.tsx
// Página individual de un post del blog (Server Component).
// Usa MDXRemote de next-mdx-remote/rsc para renderizar MDX sin configurar next.config.

import { getAllPosts, getPostBySlug } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/blog/mdx-components";
import { EmailCapture } from "@/components/blog/mdx-components";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

// Genera rutas estáticas para todos los posts en build time
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// Metadata dinámica por post para SEO y Open Graph
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | RehabStack Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

// Paleta de colores por categoría — barra superior y badge
const CATEGORY_COLORS: Record<string, string> = {
  news: "#6B9E78",
  articles: "#4F46E5",
  media: "#F59E0B",
  community: "#94A3B8",
};

const CATEGORY_BG: Record<string, string> = {
  news: "#F0F7F1",
  articles: "#EEF2FF",
  media: "#FFFBEB",
  community: "#F1F5F9",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // Si el slug no corresponde a ningún post, devuelve 404
  if (!post) notFound();

  const color = CATEGORY_COLORS[post.category] ?? "#94A3B8";
  const bg = CATEGORY_BG[post.category] ?? "#F1F5F9";
  const categoryLabel =
    post.category.charAt(0).toUpperCase() + post.category.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Cabecera del artículo */}
      <div className="bg-[#F8FAFC] border-b border-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
            <Link
              href="/blog"
              className="hover:text-[#4F46E5] transition-colors"
            >
              Blog
            </Link>
            <span>→</span>
            <span className="capitalize">{post.category}</span>
          </div>

          {/* Badge de categoría */}
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4"
            style={{ backgroundColor: bg, color }}
          >
            {categoryLabel}
          </span>

          {/* Título */}
          <h1 className="text-4xl font-bold text-[#1E293B] mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta: autor · fecha · tiempo de lectura */}
          <div className="flex items-center gap-4 text-sm text-[#64748B]">
            <span>By {post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* Cuerpo del artículo — MDX renderizado */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="
            prose prose-lg prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-[#1E293B]
            prose-p:text-[#374151] prose-p:leading-relaxed prose-p:text-lg
            prose-a:text-[#4F46E5] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#1E293B]
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-ul:text-[#374151] prose-li:marker:text-[#4F46E5]
          "
        >
          {/* MDXRemote de next-mdx-remote/rsc funciona directamente en Server Components */}
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </div>

      {/* Email capture al final del artículo */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="border-t border-gray-100 pt-12">
          <EmailCapture text="Get weekly insights on AI for rehabilitation professionals. No spam, unsubscribe anytime." />
        </div>
      </div>

      {/* Enlace de regreso al blog */}
      <div className="max-w-3xl mx-auto px-4 pb-16 text-center">
        <Link
          href="/blog"
          className="text-[#4F46E5] font-semibold hover:underline text-sm"
        >
          ← Back to all posts
        </Link>
      </div>
    </div>
  );
}
