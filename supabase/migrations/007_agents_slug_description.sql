-- supabase/migrations/007_agents_slug_description.sql
-- Añade columnas necesarias para el marketplace público de agentes.
-- slug: identificador único en URL (/agents/category/slug)
-- short_description: resumen de una línea para la tarjeta del agente
-- stripe_price_id: ID del precio en Stripe para el botón "Subscribe Now"
-- creator_name: nombre denormalizado del creador (evita join con RLS en tabla users)

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- Índice para lookup por slug (ruta /agents/[category]/[slug])
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug ON public.agents (slug)
  WHERE slug IS NOT NULL;

-- Índice compuesto para lookup de agente por categoría + slug
CREATE INDEX IF NOT EXISTS idx_agents_category_slug ON public.agents (category, slug)
  WHERE status = 'active';
