// src/lib/assistant-knowledge.ts
// SOLO SERVIDOR — construye la base de conocimiento dinámica del asistente web.
// Consulta Supabase para obtener agentes activos + información estática de la plataforma.
// Cachea el resultado en Upstash Redis (TTL 5 minutos).
// Sin Redis configurado → reconstruye la knowledge base en cada llamada (modo dev).

import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

// Columnas que se seleccionan de la tabla `agents`
interface AgentRow {
  name: string;
  short_description: string | null;
  category: string | null;
  pricing_usd: number | null;
  languages: string[] | null;
  hosting_type: string | null;
  model_provider: string | null;
  compliance_badge: boolean | null;
  slug: string | null;
}

// ---------------------------------------------------------------------------
// Singleton de Redis — retorna null si las variables de entorno no están
// configuradas o contienen valores de relleno (placeholder).
// ---------------------------------------------------------------------------

let _redis: Redis | null | undefined = undefined; // undefined = todavía no inicializado

function getRedis(): Redis | null {
  // Si ya se intentó inicializar (incluyendo resultado null), devolver el valor guardado
  if (_redis !== undefined) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Sin variables o con valores de relleno → modo sin caché
  if (!url || !token || url.includes("placeholder")) {
    _redis = null;
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// ---------------------------------------------------------------------------
// Clave de caché por locale
// ---------------------------------------------------------------------------

function cacheKey(locale: string): string {
  return `assistant_knowledge_${locale}`;
}

// ---------------------------------------------------------------------------
// Información estática de la plataforma (igual para todos los locales por ahora)
// Se añade al final de la knowledge base generada dinámicamente.
// ---------------------------------------------------------------------------

const PLATFORM_INFO = `
---

## Platform Information

**RehabStack** is an AI agent marketplace for physical therapists, occupational therapists, and rehabilitation professionals.

### Pricing Plans
- **Starter** — $19/month: 1 AI Agent, 200 sessions/month, email support, basic analytics
- **Professional** — $49/month: 3 AI Agents, 500 sessions/month, priority support, advanced analytics, team collaboration
- **Clinic** — $149/month: Unlimited AI Agents, unlimited sessions, dedicated support, full analytics suite, unlimited team seats, white-label options

### Supported Languages
English, Spanish, Portuguese, French, German, Arabic

### Agent Categories
- Grow Your Practice
- Monetize Expertise
- Find Training
- Documentation
- Treatment Planning
- Outcomes

### How It Works
1. Browse agents in the marketplace
2. Subscribe to the agents that fit your practice
3. Use the agents from your personal dashboard
4. Agents produce work items (documents, plans, etc.) you can save and share
`;

// ---------------------------------------------------------------------------
// Formatea la lista de agentes obtenida de Supabase en Markdown
// ---------------------------------------------------------------------------

function formatAgents(agents: AgentRow[]): string {
  // Si no hay agentes activos, devolver mensaje vacío
  if (!agents || agents.length === 0) {
    return "## Available AI Agents on RehabStack\n\nNo agents currently available.\n";
  }

  // Construir una sección Markdown por cada agente
  const agentSections = agents
    .map((agent) => {
      // Precio: "Free" si es 0 o nulo, de lo contrario "$X/month"
      const price =
        !agent.pricing_usd || agent.pricing_usd === 0
          ? "Free"
          : `$${agent.pricing_usd}/month`;

      // Idiomas: unir el array o mostrar "N/A"
      const languages =
        agent.languages && agent.languages.length > 0
          ? agent.languages.join(", ")
          : "N/A";

      // Verificación de cumplimiento
      const compliance = agent.compliance_badge ? "Yes" : "No";

      // Enlace a la página del agente
      const link = agent.slug ? `/agents/${agent.slug}` : "/agents";

      return [
        `### ${agent.name}`,
        `- **Category:** ${agent.category ?? "General"}`,
        `- **Price:** ${price}`,
        `- **Short description:** ${agent.short_description ?? "No description available."}`,
        `- **Languages:** ${languages}`,
        `- **Compliance verified:** ${compliance}`,
        `- **More info:** ${link}`,
      ].join("\n");
    })
    .join("\n\n");

  return `## Available AI Agents on RehabStack\n\n${agentSections}\n`;
}

// ---------------------------------------------------------------------------
// buildKnowledgeBase — función principal exportada
//
// 1. Intenta leer desde la caché de Redis.
// 2. Si no hay caché (miss), consulta Supabase para agentes activos.
// 3. Formatea la knowledge base como Markdown.
// 4. Guarda en Redis con TTL de 300 segundos (5 minutos).
// 5. Retorna el string resultante.
// ---------------------------------------------------------------------------

export async function buildKnowledgeBase(locale: string): Promise<string> {
  const redis = getRedis();
  const key = cacheKey(locale);

  // --- Paso 1: Intentar obtener desde la caché ---
  if (redis) {
    try {
      const cached = await redis.get<string>(key);
      if (cached) {
        // Cache hit — devolver directamente sin consultar Supabase
        return cached;
      }
    } catch (redisError) {
      // Si Redis falla, continuar sin caché (mejor degradarse que crashear)
      console.warn("[assistant-knowledge] Error al leer caché Redis:", redisError);
    }
  }

  // --- Paso 2: Cache miss → consultar Supabase ---
  let agentsMarkdown = "## Available AI Agents on RehabStack\n\nNo agents currently available.\n";

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("agents")
      .select(
        "name, short_description, category, pricing_usd, languages, hosting_type, model_provider, compliance_badge, slug"
      )
      .eq("status", "active")
      .order("name");

    if (error) {
      // Loggear el error pero no lanzar — el asistente sigue funcionando
      console.error("[assistant-knowledge] Error al consultar agentes en Supabase:", error.message);
    } else if (data) {
      // Formatear la lista de agentes en Markdown
      agentsMarkdown = formatAgents(data as AgentRow[]);
    }
  } catch (supabaseError) {
    // Error inesperado (p.ej. credenciales faltantes en dev) — continuar con info estática
    console.error("[assistant-knowledge] Excepción al consultar Supabase:", supabaseError);
  }

  // --- Paso 3: Construir el string final combinando agentes + info estática ---
  const knowledgeBase = `${agentsMarkdown}${PLATFORM_INFO}`;

  // --- Paso 4: Guardar en Redis con TTL de 5 minutos ---
  if (redis) {
    try {
      await redis.set(key, knowledgeBase, { ex: 300 });
    } catch (redisSetError) {
      // Si no se puede guardar, simplemente no cacheamos — no es fatal
      console.warn("[assistant-knowledge] Error al guardar en caché Redis:", redisSetError);
    }
  }

  // --- Paso 5: Retornar la knowledge base ---
  return knowledgeBase;
}

// ---------------------------------------------------------------------------
// invalidateKnowledgeCache — limpia la caché para todos los locales soportados
//
// Se llama cuando un admin aprueba un nuevo agente para forzar la reconstrucción
// de la knowledge base en la próxima petición del asistente.
// ---------------------------------------------------------------------------

export async function invalidateKnowledgeCache(): Promise<void> {
  const redis = getRedis();

  // Sin Redis en dev → no hay nada que invalidar
  if (!redis) return;

  // Todos los locales soportados por la plataforma
  const locales = ["en", "es", "pt", "fr", "de", "ar"];

  // Eliminar todas las claves en paralelo
  await Promise.all(locales.map((locale) => redis.del(cacheKey(locale))));
}
