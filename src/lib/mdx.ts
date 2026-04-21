// lib/mdx.ts
// Utilidades para leer y procesar archivos MDX del directorio src/content/blog.
// Solo se ejecuta en el servidor (usa módulos de Node: fs, path).

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

// Ruta base donde viven los posts del blog
const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

// Categorías válidas del blog
export type BlogCategory = "news" | "articles" | "media" | "community";

// Estructura de un post procesado
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: BlogCategory;
  tags: string[];
  author: string;
  description: string;
  featuredImage: string;
  readTime: string;
  content: string;
}

/**
 * Devuelve todos los posts de todas las categorías,
 * ordenados del más reciente al más antiguo.
 */
export function getAllPosts(): BlogPost[] {
  const categories: BlogCategory[] = ["news", "articles", "media", "community"];
  const posts: BlogPost[] = [];

  for (const category of categories) {
    const categoryDir = path.join(CONTENT_DIR, category);

    // Si el directorio no existe, lo saltamos
    if (!fs.existsSync(categoryDir)) continue;

    // Solo archivos .mdx
    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".mdx"));

    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");

      // gray-matter separa el frontmatter YAML del contenido MDX
      const { data, content } = matter(raw);

      // reading-time estima el tiempo de lectura del contenido
      const rt = readingTime(content);

      posts.push({
        slug: data.slug || file.replace(".mdx", ""),
        title: data.title || "",
        date: data.date || "",
        category: (data.category as BlogCategory) || "articles",
        tags: data.tags || [],
        author: data.author || "",
        description: data.description || "",
        featuredImage: data.featuredImage || "",
        readTime: data.readTime || rt.text,
        content,
      });
    }
  }

  // Orden descendente por fecha
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Busca un post por su slug entre todas las categorías.
 * Devuelve null si no se encuentra.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const all = getAllPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

/**
 * Filtra posts por categoría.
 * Pasa "all" para obtener todos.
 */
export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "all") return getAllPosts();
  return getAllPosts().filter((p) => p.category === category);
}
