"use client";

// components/blog/BlogContent.tsx
// Componente cliente que maneja el filtrado por tabs (All, Articles, News, Media).
// Recibe todos los posts desde el Server Component padre y filtra en el cliente.

import { useState } from "react";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/lib/mdx";

// Colores de la barra superior de cada tarjeta según categoría
const CATEGORY_BAR: Record<string, string> = {
  news: "#6B9E78",
  articles: "#4F46E5",
  media: "#F59E0B",
  community: "#94A3B8",
};

// Colores de la badge de categoría
const CATEGORY_BADGE_BG: Record<string, string> = {
  news: "#F0F7F1",
  articles: "#EEF2FF",
  media: "#FFFBEB",
  community: "#F1F5F9",
};

const CATEGORY_BADGE_TEXT: Record<string, string> = {
  news: "#4A7A57",
  articles: "#4F46E5",
  media: "#B45309",
  community: "#475569",
};

// Tabs disponibles
const TABS = [
  { label: "All", value: "all" },
  { label: "Articles", value: "articles" },
  { label: "News", value: "news" },
  { label: "Media", value: "media" },
];

interface BlogContentProps {
  posts: BlogPost[];
}

export function BlogContent({ posts }: BlogContentProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filtra posts según el tab activo
  const filtered =
    activeTab === "all"
      ? posts
      : posts.filter((p) => p.category === (activeTab as BlogCategory));

  return (
    <>
      {/* Barra de tabs — sticky bajo el nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={[
                  "px-6 py-4 text-sm font-semibold transition-colors border-b-2",
                  activeTab === tab.value
                    ? "border-[#4F46E5] text-[#4F46E5]"
                    : "border-transparent text-[#64748B] hover:text-[#1E293B]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de posts */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {filtered.length === 0 ? (
          <p className="text-center text-[#64748B] py-24">
            No posts in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  {/* Barra de color superior según categoría */}
                  <div
                    className="h-1 w-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_BAR[post.category] ?? "#94A3B8" }}
                  />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Categoría + fecha */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: CATEGORY_BADGE_BG[post.category] ?? "#F1F5F9",
                          color: CATEGORY_BADGE_TEXT[post.category] ?? "#475569",
                        }}
                      >
                        {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{post.date}</span>
                    </div>

                    {/* Título */}
                    <h2 className="font-bold text-[#1E293B] text-lg mb-2 group-hover:text-[#4F46E5] transition-colors line-clamp-2 flex-1">
                      {post.title}
                    </h2>

                    {/* Descripción */}
                    <p
                      className="text-sm text-[#64748B] mb-4"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.description}
                    </p>

                    {/* Footer: autor + tiempo de lectura */}
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] mt-auto pt-4 border-t border-gray-50">
                      <span>{post.author}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Email capture bajo el grid */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-[#EEF2FF] rounded-2xl p-8 text-center">
          <p className="text-[#1E293B] font-semibold mb-4">
            Get weekly insights on AI for rehabilitation professionals.
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
      </div>
    </>
  );
}
