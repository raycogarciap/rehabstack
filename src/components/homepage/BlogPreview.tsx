// Vista previa del blog — tres artículos recientes con barra de color y enlace a /blog
// Los posts son placeholder hasta que la infraestructura MDX esté construida
import Link from "next/link";

const BLOG_POSTS = [
  {
    category: "Articles",
    categoryColor: "#4F46E5",
    categoryBg: "#EEF2FF",
    title: "How AI Assistants Are Transforming Clinical Content Creation",
    excerpt:
      "Physiotherapists are using AI assistants to create professional clinical content from quick voice notes. Here's what's working.",
    date: "April 15, 2026",
    readTime: "5 min read",
    slug: "ai-assistants-clinical-content",
  },
  {
    category: "News",
    categoryColor: "#6B9E78",
    categoryBg: "#F0F7F1",
    title: "RehabStack Now Available in 6 Languages",
    excerpt:
      "French, German, and Arabic join English, Spanish, and Portuguese. AI assistants for rehabilitation professionals, worldwide.",
    date: "April 8, 2026",
    readTime: "2 min read",
    slug: "six-languages-launch",
  },
  {
    category: "Media",
    categoryColor: "#F59E0B",
    categoryBg: "#FFFBEB",
    title: "Watch: Content Engine Creates a Week of Posts in 4 Minutes",
    excerpt:
      "A sports physiotherapist records a voice note about ACL rehabilitation. Watch what the Content Engine produces.",
    date: "April 1, 2026",
    readTime: "4 min watch",
    slug: "content-engine-demo-video",
  },
];

export function BlogPreview() {
  return (
    <section id="blog-preview" className="py-20 px-4 bg-white">

      {/* Cabecera centrada */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B9E78] mb-3">
          From the Blog
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">
          Latest from RehabStack.
        </h2>
      </div>

      {/* Cuadrícula de tarjetas de artículo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
          >
            {/* Barra de color superior — usa el color de categoría */}
            <div
              className="h-1 w-full flex-shrink-0"
              style={{ backgroundColor: post.categoryColor }}
            />

            {/* Cuerpo de la tarjeta */}
            <div className="p-6 flex flex-col flex-1">
              {/* Badge de categoría */}
              <span
                className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-4"
                style={{
                  backgroundColor: post.categoryBg,
                  color: post.categoryColor,
                }}
              >
                {post.category}
              </span>

              {/* Título del artículo */}
              <h3 className="font-bold text-[#1E293B] mb-3 leading-snug hover:text-[#4F46E5] transition-colors">
                {post.title}
              </h3>

              {/* Extracto */}
              <p className="text-sm text-[#64748B] leading-relaxed mb-4 flex-1">
                {post.excerpt}
              </p>

              {/* Pie: fecha y tiempo de lectura */}
              <div className="flex justify-between items-center text-xs text-[#94A3B8] mt-auto">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Enlace al blog completo */}
      <div className="text-center mt-10">
        <Link
          href="/blog"
          className="border border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF] px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm inline-block"
        >
          View all posts →
        </Link>
      </div>

    </section>
  );
}
