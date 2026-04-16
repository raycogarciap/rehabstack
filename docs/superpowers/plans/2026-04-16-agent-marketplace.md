# Agent Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public agent marketplace for RehabStack — listing page, category pages, agent detail page, reusable card component, shared layout, and seeded platform agents.

**Architecture:** URL-based filters (searchParams → Server Component → Supabase query), Client Components only for interactive elements (search bar, filter sidebar, subscribe button). New migration adds `slug`, `short_description`, `stripe_price_id`, `creator_name` to the agents table. Platform agents seeded directly via Supabase MCP (creator_id = NULL).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui Card, Supabase SSR (`@supabase/ssr`), Lucide React icons, Stripe checkout API.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/007_agents_slug_description.sql` | CREATE | Add slug, short_description, stripe_price_id, creator_name columns |
| `src/types/agents.ts` | CREATE | Shared TypeScript types for agent data |
| `src/components/agents/agent-card.tsx` | CREATE | Reusable card — pure display, no state |
| `src/components/agents/agent-search-bar.tsx` | CREATE | Client Component — search input updates `q` URL param |
| `src/components/agents/agent-filter-sidebar.tsx` | CREATE | Client Component — filter controls update URL params |
| `src/components/agents/agent-subscribe-button.tsx` | CREATE | Client Component — POST /api/stripe/checkout |
| `src/app/agents/layout.tsx` | CREATE | Public layout with nav + footer (reused on all /agents/* routes) |
| `src/app/agents/page.tsx` | CREATE | Server Component — main marketplace with search + filters + grid |
| `src/app/agents/[category]/page.tsx` | CREATE | Server Component — category landing page |
| `src/app/agents/[category]/[slug]/page.tsx` | CREATE | Server Component — agent detail with sticky pricing card + reviews |
| `scripts/seed-agents.ts` | CREATE | Seed script for 3 platform agents (Content Engine, CE Matcher, Course Creator) |

---

## Task 1: Migration 007 — Add missing columns to agents table

**Files:**
- Create: `supabase/migrations/007_agents_slug_description.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Run the migration via Supabase MCP**

Use `mcp__supabase__apply_migration` with:
- project_id: `gspbimlphifgmijrxmwk`
- name: `007_agents_slug_description`
- query: the SQL above

- [ ] **Step 3: Verify columns exist**

Use `mcp__supabase__execute_sql`:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agents'
  AND column_name IN ('slug', 'short_description', 'stripe_price_id', 'creator_name')
ORDER BY column_name;
```
Expected: 4 rows returned.

---

## Task 2: TypeScript types

**Files:**
- Create: `src/types/agents.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/agents.ts
// Tipos TypeScript compartidos para agentes del marketplace.
// Reflejan el esquema de la tabla agents + columnas nuevas de migración 007.

// Acción rápida tal como se almacena en el campo JSONB quick_actions
export interface QuickAction {
  id: string
  label: string
  icon: string
}

// Tipo de item de trabajo tal como se almacena en work_item_types JSONB
export interface WorkItemType {
  type: string
  description: string
}

// Reseña verificada (solo las verificadas son públicas por RLS)
export interface AgentReview {
  rating: number
}

// Agente completo con joins resueltos — usado en la página de detalle
export interface AgentDetail {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  tier: string
  pricing_usd: number | null
  stripe_price_id: string | null
  creator_id: string | null
  creator_name: string | null
  compliance_badge: boolean
  languages: string[]
  category: string
  model_provider: string | null
  supported_models: string[] | null
  hosting_type: string
  staff_delegation: boolean
  quick_actions: QuickAction[]
  work_item_types: WorkItemType[]
  reviews: AgentReview[]
}

// Agente resumido — usado en AgentCard (sin quick_actions ni reviews completas)
export interface AgentSummary {
  id: string
  name: string
  slug: string
  short_description: string | null
  tier: string
  pricing_usd: number | null
  creator_name: string | null
  compliance_badge: boolean
  languages: string[]
  category: string
  model_provider: string | null
  reviews: AgentReview[]
}

// Categorías válidas del marketplace
export type AgentCategory =
  | 'grow-your-practice'
  | 'monetize-expertise'
  | 'find-training'
  | 'documentation'
  | 'treatment-planning'
  | 'outcomes'

// Filtros del marketplace leídos desde searchParams de la URL
export interface MarketplaceFilters {
  q?: string
  category?: string
  language?: string
  provider?: string
  price?: 'free' | '1-29' | '30-59' | '60+'
}

// Mapa de categoría → etiqueta legible + descripción
export const CATEGORY_META: Record<string, { label: string; description: string }> = {
  'grow-your-practice': {
    label: 'Grow Your Practice',
    description: 'Agents that help you attract more patients and grow your referral network.',
  },
  'monetize-expertise': {
    label: 'Monetize Expertise',
    description: 'Turn your clinical knowledge into online courses and digital products.',
  },
  'find-training': {
    label: 'Find Training',
    description: 'Discover continuing education courses, conferences, and certifications.',
  },
  documentation: {
    label: 'Documentation',
    description: 'Streamline clinical documentation and patient record management.',
  },
  'treatment-planning': {
    label: 'Treatment Planning',
    description: 'AI-powered treatment planning and evidence-based protocol recommendations.',
  },
  outcomes: {
    label: 'Outcomes',
    description: 'Track, measure, and demonstrate patient outcomes and clinical results.',
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/agents.ts
git commit -m "feat: add TypeScript types for agent marketplace"
```

---

## Task 3: AgentCard component

**Files:**
- Create: `src/components/agents/agent-card.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/agents/agent-card.tsx
// Tarjeta reutilizable de agente para el grid del marketplace.
// Server Component — solo display, sin estado.
// Muestra: nombre, creador, categoría, descripción corta, precio,
// rating promedio, primeros 3 idiomas y badge de cumplimiento.

import Link from 'next/link'
import { ShieldCheck, Star } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { type AgentSummary, CATEGORY_META } from '@/types/agents'

// Calcula el rating promedio a partir del array de reseñas verificadas
function avgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
}

// Renderiza estrellitas (llenas/vacías) para el rating
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs text-neutral-500">{rating}</span>
    </span>
  )
}

// Mapa de código de idioma → etiqueta
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  pt: 'PT',
  fr: 'FR',
  de: 'DE',
  ar: 'AR',
}

interface AgentCardProps {
  agent: AgentSummary
}

export function AgentCard({ agent }: AgentCardProps) {
  const rating = avgRating(agent.reviews)
  const categoryMeta = CATEGORY_META[agent.category]
  // Muestra solo los primeros 3 idiomas en la tarjeta
  const displayLanguages = (agent.languages ?? []).slice(0, 3)
  const href = `/agents/${agent.category}/${agent.slug}`

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md hover:ring-blue-200">
      <CardHeader>
        {/* Fila superior: badge de categoría + badge de cumplimiento */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
            {categoryMeta?.label ?? agent.category}
          </span>
          {agent.compliance_badge && (
            <span
              title="Compliance verified"
              aria-label="Compliance verified"
              className="flex items-center gap-1 text-xs font-medium text-emerald-600"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>

        {/* Nombre del agente */}
        <CardTitle className="mt-2 text-base font-semibold text-neutral-900">
          {agent.name}
        </CardTitle>

        {/* Creador */}
        {agent.creator_name && (
          <CardDescription className="text-xs text-neutral-500">
            by {agent.creator_name}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Descripción corta */}
        <p className="line-clamp-2 text-sm text-neutral-600">
          {agent.short_description ?? ''}
        </p>

        {/* Rating */}
        {rating !== null ? (
          <StarRating rating={rating} />
        ) : (
          <span className="text-xs text-neutral-400">No reviews yet</span>
        )}

        {/* Idiomas soportados */}
        {displayLanguages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayLanguages.map((lang) => (
              <span
                key={lang}
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600"
              >
                {LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between">
        {/* Precio */}
        <span className="text-sm font-semibold text-neutral-900">
          {agent.pricing_usd != null && agent.pricing_usd > 0
            ? `$${agent.pricing_usd}/mo`
            : 'Free'}
        </span>

        {/* Botón "Learn More" — Link envuelve el botón, sin asChild */}
        <Link href={href}>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Learn More
          </button>
        </Link>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/agent-card.tsx
git commit -m "feat: add AgentCard component"
```

---

## Task 4: AgentSearchBar component

**Files:**
- Create: `src/components/agents/agent-search-bar.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/agents/agent-search-bar.tsx
// Barra de búsqueda de agentes — Client Component.
// Al escribir, actualiza el parámetro `q` en la URL usando useTransition
// para no bloquear el render durante la navegación.

'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AgentSearchBarProps {
  // Valor inicial leído desde searchParams en el Server Component padre
  initialValue?: string
}

export function AgentSearchBar({ initialValue }: AgentSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue ?? '')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue.trim()) {
        params.set('q', newValue.trim())
      } else {
        params.delete('q')
      }
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      {/* Ícono de búsqueda alineado a la izquierda del input */}
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Search agents by name or description…"
        value={value}
        onChange={handleChange}
        className="pl-9"
        aria-label="Search agents"
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/agent-search-bar.tsx
git commit -m "feat: add AgentSearchBar component"
```

---

## Task 5: AgentFilterSidebar component

**Files:**
- Create: `src/components/agents/agent-filter-sidebar.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/agents/agent-filter-sidebar.tsx
// Sidebar de filtros del marketplace — Client Component.
// Lee los filtros activos desde props (pasados por el Server Component padre).
// Al cambiar un filtro, actualiza la URL con useRouter sin recargar la página.

'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { MarketplaceFilters } from '@/types/agents'

// ── Opciones de filtro ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'grow-your-practice',  label: 'Grow Your Practice' },
  { value: 'monetize-expertise',  label: 'Monetize Expertise' },
  { value: 'find-training',       label: 'Find Training' },
  { value: 'documentation',       label: 'Documentation' },
  { value: 'treatment-planning',  label: 'Treatment Planning' },
  { value: 'outcomes',            label: 'Outcomes' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' },
]

const PROVIDERS = [
  { value: 'Anthropic', label: 'Anthropic' },
  { value: 'OpenAI',    label: 'OpenAI' },
  { value: 'Multi',     label: 'Multi-Provider' },
]

const PRICE_RANGES = [
  { value: 'free',  label: 'Free' },
  { value: '1-29',  label: '$1 – $29' },
  { value: '30-59', label: '$30 – $59' },
  { value: '60+',   label: '$60+' },
]

// ── Componente de grupo de filtros ────────────────────────────────────────────

interface FilterGroupProps {
  title: string
  options: { value: string; label: string }[]
  filterKey: string
  activeValue: string | undefined
  onSelect: (key: string, value: string | null) => void
}

function FilterGroup({ title, options, filterKey, activeValue, onSelect }: FilterGroupProps) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </h3>
      <ul className="space-y-1">
        {options.map((opt) => {
          const isActive = activeValue === opt.value
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => onSelect(filterKey, isActive ? null : opt.value)}
                className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 font-medium text-blue-700'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
                aria-pressed={isActive}
              >
                {opt.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Sidebar principal ─────────────────────────────────────────────────────────

interface AgentFilterSidebarProps {
  // Filtros activos pasados desde el Server Component (basados en searchParams)
  filters: MarketplaceFilters
}

export function AgentFilterSidebar({ filters }: AgentFilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Actualiza un único parámetro de filtro en la URL.
  // value = null → elimina el filtro.
  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  // Limpia todos los filtros excepto la búsqueda de texto
  const clearAll = () => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasActiveFilters =
    filters.category || filters.language || filters.provider || filters.price

  return (
    <nav aria-label="Filter agents" className="space-y-6">
      {/* Cabecera + botón limpiar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">Filters</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup
        title="Category"
        options={CATEGORIES}
        filterKey="category"
        activeValue={filters.category}
        onSelect={updateFilter}
      />

      <FilterGroup
        title="Language"
        options={LANGUAGES}
        filterKey="language"
        activeValue={filters.language}
        onSelect={updateFilter}
      />

      <FilterGroup
        title="Model Provider"
        options={PROVIDERS}
        filterKey="provider"
        activeValue={filters.provider}
        onSelect={updateFilter}
      />

      <FilterGroup
        title="Price Range"
        options={PRICE_RANGES}
        filterKey="price"
        activeValue={filters.price}
        onSelect={updateFilter}
      />
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/agent-filter-sidebar.tsx
git commit -m "feat: add AgentFilterSidebar component"
```

---

## Task 6: AgentSubscribeButton component

**Files:**
- Create: `src/components/agents/agent-subscribe-button.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/agents/agent-subscribe-button.tsx
// Botón "Subscribe Now" de la página de detalle de agente — Client Component.
// Llama a POST /api/stripe/checkout con agentId y priceId,
// luego redirige al Checkout de Stripe con la URL devuelta.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AgentSubscribeButtonProps {
  agentId: string
  // priceId es null si el agente no tiene Stripe price configurado todavía
  priceId: string | null
  className?: string
}

export function AgentSubscribeButton({
  agentId,
  priceId,
  className,
}: AgentSubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubscribe() {
    if (!priceId) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, priceId }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        router.push(data.url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={loading || !priceId}
      className={`inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
    >
      {loading ? 'Redirecting…' : 'Subscribe Now'}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/agent-subscribe-button.tsx
git commit -m "feat: add AgentSubscribeButton component"
```

---

## Task 7: agents/layout.tsx

**Files:**
- Create: `src/app/agents/layout.tsx`

> Note: The PublicNav and PublicFooter are duplicated from `src/app/pricing/layout.tsx`. A future refactor can extract them to `src/components/public-layout.tsx`. For now, keep them co-located to avoid changing existing code.

- [ ] **Step 1: Create the layout**

```typescript
// src/app/agents/layout.tsx
// Layout público compartido por todas las rutas /agents/*.
// Incluye navbar sticky con logo + navegación + footer.
// Server Component — sin interactividad.

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Agents for Rehab Professionals | RehabStack',
  description:
    'Browse AI agents built for physical therapists, occupational therapists, and rehabilitation professionals.',
}

// ── Navbar pública ────────────────────────────────────────────────────────────
function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-neutral-900">
          Rehab<span className="text-blue-600">Stack</span>
        </Link>

        {/* Navegación central */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 sm:flex">
          <Link href="/agents"       className="text-blue-600">Agents</Link>
          <Link href="/pricing"      className="hover:text-neutral-900 transition-colors">Pricing</Link>
          <Link href="/for-creators" className="hover:text-neutral-900 transition-colors">For Creators</Link>
          <Link href="/showcase"     className="hover:text-neutral-900 transition-colors">Showcase</Link>
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/login"
            className="hidden text-neutral-600 hover:text-neutral-900 transition-colors sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-white hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── Footer público ────────────────────────────────────────────────────────────
function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-base font-bold text-neutral-900">
            Rehab<span className="text-blue-600">Stack</span>
          </span>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <Link href="/about"   className="hover:text-neutral-900 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-neutral-900 transition-colors">Contact</Link>
            <Link href="/docs"    className="hover:text-neutral-900 transition-colors">Docs</Link>
            <Link href="/blog"    className="hover:text-neutral-900 transition-colors">Blog</Link>
          </nav>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Soulistica LLC · DBA RehabStack
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/agents/layout.tsx
git commit -m "feat: add agents public layout"
```

---

## Task 8: agents/page.tsx — Main marketplace

**Files:**
- Create: `src/app/agents/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/agents/page.tsx
// Página principal del marketplace de agentes — Server Component.
// Lee searchParams para filtrar agentes en Supabase.
// Renderiza AgentFilterSidebar (Client) + AgentSearchBar (Client) + grid de AgentCard.

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AgentCard } from '@/components/agents/agent-card'
import { AgentFilterSidebar } from '@/components/agents/agent-filter-sidebar'
import { AgentSearchBar } from '@/components/agents/agent-search-bar'
import type { AgentSummary, MarketplaceFilters } from '@/types/agents'
import Link from 'next/link'

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'AI Agents for Rehab Professionals | RehabStack',
  description:
    'Browse AI agents built for physical therapists, occupational therapists, and rehabilitation professionals. Filter by specialty, language, and price.',
  openGraph: {
    title: 'AI Agents for Rehab Professionals | RehabStack',
    description: 'Marketplace of AI agents for physical therapy and rehabilitation.',
    type: 'website',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Construye la query de Supabase aplicando los filtros de la URL
async function fetchAgents(filters: MarketplaceFilters): Promise<AgentSummary[]> {
  const supabase = await createClient()

  let query = supabase
    .from('agents')
    .select(
      'id, name, slug, short_description, tier, pricing_usd, creator_name, compliance_badge, languages, category, model_provider, reviews!agent_id(rating)',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  if (filters.language) {
    query = query.contains('languages', [filters.language])
  }
  if (filters.provider) {
    query = query.eq('model_provider', filters.provider)
  }
  if (filters.q) {
    query = query.or(
      `name.ilike.%${filters.q}%,short_description.ilike.%${filters.q}%`,
    )
  }
  if (filters.price === 'free') {
    query = query.or('pricing_usd.is.null,pricing_usd.eq.0')
  } else if (filters.price === '1-29') {
    query = query.gte('pricing_usd', 1).lte('pricing_usd', 29)
  } else if (filters.price === '30-59') {
    query = query.gte('pricing_usd', 30).lte('pricing_usd', 59)
  } else if (filters.price === '60+') {
    query = query.gte('pricing_usd', 60)
  }

  const { data, error } = await query
  if (error) {
    console.error('[agents/page] Supabase error:', error.message)
    return []
  }
  return (data ?? []) as AgentSummary[]
}

// ── JSON-LD structured data ───────────────────────────────────────────────────

function buildJsonLd(agents: AgentSummary[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Agents for Rehab Professionals',
    description:
      'Marketplace of AI agents for physical therapy and rehabilitation professionals.',
    itemListElement: agents.map((agent, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: agent.name,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rehabstack.vercel.app'}/agents/${agent.category}/${agent.slug}`,
        description: agent.short_description ?? '',
      },
    })),
  }
}

// ── Componente de estado vacío ────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-lg font-medium text-neutral-700">No agents found</p>
      <p className="text-sm text-neutral-500">
        Try adjusting your filters or search query.
      </p>
      <Link href="/agents">
        <button
          type="button"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Reset filters
        </button>
      </Link>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgentsPage({ searchParams }: PageProps) {
  // searchParams es Promise en Next.js 16
  const params = await searchParams

  // Normaliza searchParams a string (ignora arrays)
  const filters: MarketplaceFilters = {
    q:        typeof params.q        === 'string' ? params.q        : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    language: typeof params.language === 'string' ? params.language : undefined,
    provider: typeof params.provider === 'string' ? params.provider : undefined,
    price:    typeof params.price    === 'string' ? params.price as MarketplaceFilters['price'] : undefined,
  }

  const agents = await fetchAgents(filters)
  const jsonLd = buildJsonLd(agents)

  return (
    <>
      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            AI Agents for Rehab Professionals
          </h1>
          <p className="mt-2 text-neutral-600">
            Discover AI agents built specifically for physical therapy and rehabilitation.
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-8">
          <AgentSearchBar initialValue={filters.q} />
        </div>

        {/* Layout: sidebar + grid */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar de filtros */}
          <aside className="w-full shrink-0 lg:w-56">
            <AgentFilterSidebar filters={filters} />
          </aside>

          {/* Grid de agentes */}
          <section aria-label="Agent listings" className="min-w-0 flex-1">
            {agents.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <p className="mb-4 text-sm text-neutral-500">
                  {agents.length} agent{agents.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/agents/page.tsx
git commit -m "feat: add agents marketplace main page"
```

---

## Task 9: agents/[category]/page.tsx — Category landing

**Files:**
- Create: `src/app/agents/[category]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/agents/[category]/page.tsx
// Página de categoría del marketplace — Server Component.
// Muestra título y descripción de la categoría seguidos del grid de agentes.
// Ruta: /agents/grow-your-practice, /agents/find-training, etc.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentCard } from '@/components/agents/agent-card'
import { CATEGORY_META, type AgentSummary } from '@/types/agents'
import Link from 'next/link'

// ── generateMetadata ──────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const meta = CATEGORY_META[category]
  if (!meta) return { title: 'Agents | RehabStack' }

  return {
    title: `${meta.label} Agents | RehabStack`,
    description: meta.description,
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAgentsByCategory(category: string): Promise<AgentSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agents')
    .select(
      'id, name, slug, short_description, tier, pricing_usd, creator_name, compliance_badge, languages, category, model_provider, reviews!agent_id(rating)',
    )
    .eq('status', 'active')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[agents/category] Supabase error:', error.message)
    return []
  }
  return (data ?? []) as AgentSummary[]
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const meta = CATEGORY_META[category]

  // 404 si la categoría no es válida
  if (!meta) notFound()

  const agents = await fetchAgentsByCategory(category)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <Link href="/agents" className="hover:text-neutral-900 transition-colors">
          All Agents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{meta.label}</span>
      </nav>

      {/* Encabezado de categoría */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {meta.label}
        </h1>
        <p className="mt-2 text-lg text-neutral-600">{meta.description}</p>
      </div>

      {/* Grid */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-lg font-medium text-neutral-700">No agents in this category yet</p>
          <Link href="/agents">
            <button
              type="button"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Browse all agents
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/agents/[category]/page.tsx
git commit -m "feat: add agents category page"
```

---

## Task 10: agents/[category]/[slug]/page.tsx — Agent detail

**Files:**
- Create: `src/app/agents/[category]/[slug]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/agents/[category]/[slug]/page.tsx
// Página de detalle de un agente — Server Component.
// Layout: hero arriba, luego columna principal (descripción, quick actions,
// reseñas) con tarjeta de precio sticky a la derecha en escritorio.
// Incluye JSON-LD SoftwareApplication para SEO.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Star, Globe, Cpu } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AgentSubscribeButton } from '@/components/agents/agent-subscribe-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CATEGORY_META,
  type AgentDetail,
  type AgentReview,
} from '@/types/agents'

// ── Helpers ───────────────────────────────────────────────────────────────────

function avgRating(reviews: AgentReview[]): number | null {
  if (!reviews.length) return null
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', es: 'Spanish', pt: 'Portuguese',
  fr: 'French',  de: 'German',  ar: 'Arabic',
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAgent(
  category: string,
  slug: string,
): Promise<AgentDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agents')
    .select(
      `id, name, slug, short_description, description, tier, pricing_usd,
       stripe_price_id, creator_id, creator_name, compliance_badge,
       languages, category, model_provider, supported_models,
       hosting_type, staff_delegation, quick_actions, work_item_types,
       reviews!agent_id(rating)`,
    )
    .eq('status', 'active')
    .eq('category', category)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as AgentDetail
}

// ── generateMetadata ──────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params
  const agent = await fetchAgent(category, slug)
  if (!agent) return { title: 'Agent Not Found | RehabStack' }

  return {
    title: `${agent.name} | RehabStack`,
    description: agent.short_description ?? undefined,
    openGraph: {
      title: `${agent.name} | RehabStack`,
      description: agent.short_description ?? undefined,
      type: 'website',
    },
  }
}

// ── Sección de reseñas ────────────────────────────────────────────────────────

function ReviewsSection({ reviews }: { reviews: AgentReview[] }) {
  const rating = avgRating(reviews)

  return (
    <section aria-labelledby="reviews-heading">
      <h2
        id="reviews-heading"
        className="text-lg font-semibold text-neutral-900"
      >
        Reviews
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          No verified reviews yet. Be the first to leave a review.
        </p>
      ) : (
        <>
          {/* Rating global */}
          {rating !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-3xl font-bold text-neutral-900">{rating}</span>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`size-5 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-500">
                  Based on {reviews.length} verified review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AgentDetailPage({ params }: Props) {
  const { category, slug } = await params
  const agent = await fetchAgent(category, slug)

  if (!agent) notFound()

  const rating = avgRating(agent.reviews)
  const categoryMeta = CATEGORY_META[agent.category]

  // JSON-LD SoftwareApplication
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: agent.name,
    description: agent.short_description ?? agent.description ?? '',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: agent.pricing_usd?.toString() ?? '0',
      priceCurrency: 'USD',
    },
    ...(rating !== null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: agent.reviews.length,
      },
    }),
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
          <Link href="/agents" className="hover:text-neutral-900 transition-colors">
            All Agents
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/agents/${agent.category}`}
            className="hover:text-neutral-900 transition-colors"
          >
            {categoryMeta?.label ?? agent.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{agent.name}</span>
        </nav>

        {/* ── Hero ── */}
        <div className="mb-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Badge categoría */}
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
              {categoryMeta?.label ?? agent.category}
            </span>

            {/* Badge cumplimiento */}
            {agent.compliance_badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Compliance Verified
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {agent.name}
          </h1>

          {/* Creador */}
          {agent.creator_name && (
            <p className="text-neutral-500">
              by <span className="font-medium text-neutral-700">{agent.creator_name}</span>
            </p>
          )}

          {/* Rating en hero */}
          {rating !== null && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`size-4 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-600">
                {rating} ({agent.reviews.length} review{agent.reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>

        {/* ── Contenido principal + pricing card ── */}
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Columna principal */}
          <div className="min-w-0 flex-1 space-y-10">
            {/* Descripción larga */}
            {agent.description && (
              <section aria-labelledby="description-heading">
                <h2
                  id="description-heading"
                  className="text-lg font-semibold text-neutral-900"
                >
                  About this agent
                </h2>
                <p className="mt-3 text-neutral-600 leading-relaxed">
                  {agent.description}
                </p>
              </section>
            )}

            {/* Quick Actions preview */}
            {Array.isArray(agent.quick_actions) && agent.quick_actions.length > 0 && (
              <section aria-labelledby="quick-actions-heading">
                <h2
                  id="quick-actions-heading"
                  className="text-lg font-semibold text-neutral-900"
                >
                  Quick Actions
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Launch these actions directly from your dashboard.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.quick_actions.map((qa) => (
                    <span
                      key={qa.id}
                      className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700"
                    >
                      {qa.label}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Idiomas soportados */}
            {agent.languages && agent.languages.length > 0 && (
              <section aria-labelledby="languages-heading">
                <h2
                  id="languages-heading"
                  className="flex items-center gap-2 text-lg font-semibold text-neutral-900"
                >
                  <Globe className="size-5" aria-hidden="true" />
                  Supported Languages
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-md bg-neutral-100 px-2.5 py-1 text-sm font-medium text-neutral-700"
                    >
                      {LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Model provider info */}
            {agent.model_provider && (
              <section aria-labelledby="model-heading">
                <h2
                  id="model-heading"
                  className="flex items-center gap-2 text-lg font-semibold text-neutral-900"
                >
                  <Cpu className="size-5" aria-hidden="true" />
                  Model Provider
                </h2>
                <p className="mt-3 text-neutral-600">
                  Powered by <strong>{agent.model_provider}</strong>.
                  {agent.supported_models && agent.supported_models.length > 0 && (
                    <> Supported models: {agent.supported_models.join(', ')}.</>
                  )}
                </p>
              </section>
            )}

            {/* Reseñas */}
            <ReviewsSection reviews={agent.reviews} />
          </div>

          {/* ── Pricing card sticky ── */}
          <aside className="shrink-0 lg:w-80">
            <div className="lg:sticky lg:top-20">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {agent.pricing_usd != null && agent.pricing_usd > 0
                      ? (
                        <span className="text-3xl font-extrabold text-neutral-900">
                          ${agent.pricing_usd}
                          <span className="text-base font-normal text-neutral-500">/month</span>
                        </span>
                      )
                      : <span className="text-3xl font-extrabold text-neutral-900">Free</span>
                    }
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                  {/* Botón Subscribe Now (Client Component) */}
                  <AgentSubscribeButton
                    agentId={agent.id}
                    priceId={agent.stripe_price_id}
                    className="w-full"
                  />

                  {/* Botón Try Demo */}
                  <Link href="/dashboard/agents/mock">
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      Try Demo
                    </button>
                  </Link>

                  {agent.staff_delegation && (
                    <p className="text-center text-xs text-neutral-500">
                      ✓ Supports team delegation
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/agents/[category]/[slug]/page.tsx
git commit -m "feat: add agent detail page"
```

---

## Task 11: scripts/seed-agents.ts — Platform agents seed

**Files:**
- Create: `scripts/seed-agents.ts`

- [ ] **Step 1: Create the seed script**

```typescript
// scripts/seed-agents.ts
// Script de semilla para insertar los 3 agentes de plataforma de RehabStack.
// Usa la clave service_role de Supabase para saltarse las políticas RLS.
// Ejecutar con: npx tsx scripts/seed-agents.ts
//
// NOTA: Este script es para desarrollo/staging.
// En producción, los agentes se gestionan desde el panel de admin.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const platformAgents = [
  {
    name: 'Content Engine',
    slug: 'content-engine',
    short_description:
      'Create Instagram posts, VA briefs, and testimonial requests from voice notes or photos in minutes.',
    description:
      'Content Engine helps physical therapists and rehabilitation professionals build a consistent social media presence without spending hours on content creation. Upload a voice note describing a patient win (anonymized), a before/after photo, or a clinical tip — and Content Engine produces a complete Instagram content package with captions, hashtags, and posting schedule. It also generates VA briefs so your virtual assistant can execute the plan, and sends personalized testimonial requests to patients on your behalf.',
    tier: 'professional',
    pricing_usd: 49,
    creator_id: null,
    creator_name: 'RehabStack',
    compliance_badge: true,
    languages: ['en', 'es', 'pt'],
    category: 'grow-your-practice',
    model_provider: 'Anthropic',
    supported_models: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    min_model_capability: 'sonnet',
    status: 'active',
    hosting_type: 'managed_anthropic',
    staff_delegation: true,
    stripe_price_id: null, // Configurar en Stripe Dashboard antes del lanzamiento
    quick_actions: [
      { id: 'voice-note',  label: 'Record Voice Note',   icon: 'mic' },
      { id: 'photo-video', label: 'Upload Photo/Video',  icon: 'camera' },
      { id: 'testimonial', label: 'Request Testimonial', icon: 'star' },
      { id: 'va-brief',    label: 'Create VA Brief',     icon: 'clipboard' },
    ],
    work_item_types: [
      {
        type: 'Content Package',
        description: 'A complete social media content package with captions and hashtags',
      },
      {
        type: 'VA Brief',
        description: 'Detailed instructions for your virtual assistant to execute content tasks',
      },
      {
        type: 'Testimonial Request',
        description: 'Personalized testimonial request messages for your patients',
      },
    ],
    relevant_integrations: [
      { name: 'Instagram', type: 'social' },
      { name: 'Google Drive', type: 'storage' },
    ],
    connection_config: {},
  },
  {
    name: 'CE Matcher',
    slug: 'ce-matcher',
    short_description:
      'Find continuing education courses, plan conference trips, and stay on top of your CE calendar.',
    description:
      'CE Matcher is your AI-powered continuing education advisor. It searches a curated database of PT, OT, and rehab CE courses and conferences, matches them to your specialty, license renewal requirements, and learning goals, and builds a recommended calendar. Planning to attend a conference? CE Matcher creates a full trip proposal including flight windows, hotel options, and a session-by-session schedule. It also tracks your CE hours and sends reminders before license renewal deadlines.',
    tier: 'starter',
    pricing_usd: 29,
    creator_id: null,
    creator_name: 'RehabStack',
    compliance_badge: true,
    languages: ['en', 'es', 'pt'],
    category: 'find-training',
    model_provider: 'Anthropic',
    supported_models: ['claude-sonnet-4-6'],
    min_model_capability: 'sonnet',
    status: 'active',
    hosting_type: 'managed_anthropic',
    staff_delegation: false,
    stripe_price_id: null,
    quick_actions: [
      { id: 'find-courses', label: 'Find Courses',  icon: 'search' },
      { id: 'check-radar',  label: 'Check Radar',   icon: 'radar' },
      { id: 'plan-trip',    label: 'Plan Trip',      icon: 'map-pin' },
      { id: 'ce-calendar',  label: 'CE Calendar',    icon: 'calendar' },
    ],
    work_item_types: [
      {
        type: 'Course Recommendation',
        description: 'Personalized CE course recommendations based on your specialty and license state',
      },
      {
        type: 'Trip Proposal',
        description: 'Complete conference trip plan with flights, hotels, and conference schedule',
      },
      {
        type: 'CE Calendar',
        description: 'Organized calendar of upcoming CE requirements and renewal deadlines',
      },
    ],
    relevant_integrations: [
      { name: 'Google Calendar', type: 'calendar' },
    ],
    connection_config: {},
  },
  {
    name: 'Course Creator',
    slug: 'course-creator',
    short_description:
      'Transform your clinical expertise into an online course with curriculum, sales page, and launch emails.',
    description:
      'Course Creator turns your years of clinical experience into a sellable online course — without requiring you to know anything about instructional design. Start with a Brain Dump: talk or type out everything you know about a topic. Course Creator organizes it into a structured curriculum with modules, lessons, and learning objectives. It then writes a high-converting sales page and a complete pre-launch email sequence. Built for rehabilitation professionals who want to create a revenue stream beyond patient care hours.',
    tier: 'professional',
    pricing_usd: 59,
    creator_id: null,
    creator_name: 'RehabStack',
    compliance_badge: false,
    languages: ['en', 'es', 'pt'],
    category: 'monetize-expertise',
    model_provider: 'Anthropic',
    supported_models: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    min_model_capability: 'sonnet',
    status: 'active',
    hosting_type: 'managed_anthropic',
    staff_delegation: true,
    stripe_price_id: null,
    quick_actions: [
      { id: 'brain-dump',         label: 'Brain Dump',         icon: 'brain' },
      { id: 'review-curriculum',  label: 'Review Curriculum',  icon: 'book-open' },
      { id: 'sales-page',         label: 'Sales Page',         icon: 'megaphone' },
      { id: 'launch-emails',      label: 'Launch Emails',      icon: 'mail' },
    ],
    work_item_types: [
      {
        type: 'Curriculum Draft',
        description: 'Complete course curriculum with modules, lessons, and learning objectives',
      },
      {
        type: 'Sales Page',
        description: 'High-converting sales page copy for your online course',
      },
      {
        type: 'Launch Email Sequence',
        description: 'Pre-launch and launch email sequence to sell your course',
      },
    ],
    relevant_integrations: [
      { name: 'Teachable', type: 'lms' },
      { name: 'Kajabi', type: 'lms' },
      { name: 'Mailchimp', type: 'email' },
    ],
    connection_config: {},
  },
]

async function seed() {
  console.log('Seeding platform agents…')

  const { data, error } = await supabase
    .from('agents')
    .upsert(platformAgents, { onConflict: 'slug' })
    .select('id, name, slug')

  if (error) {
    console.error('Error seeding agents:', error.message)
    process.exit(1)
  }

  console.log('Seeded agents:')
  data?.forEach((a) => console.log(`  ✓ ${a.name} (${a.id}) — /agents/${a.slug}`))
  console.log('Done.')
}

seed()
```

- [ ] **Step 2: Run seed via Supabase MCP**

Use `mcp__supabase__execute_sql` on project `gspbimlphifgmijrxmwk` with the INSERT statement:

```sql
INSERT INTO public.agents (
  name, slug, short_description, description, tier, pricing_usd,
  creator_id, creator_name, compliance_badge, languages, category,
  model_provider, supported_models, min_model_capability, status,
  hosting_type, staff_delegation, stripe_price_id,
  quick_actions, work_item_types, relevant_integrations, connection_config
)
VALUES
  (
    'Content Engine',
    'content-engine',
    'Create Instagram posts, VA briefs, and testimonial requests from voice notes or photos in minutes.',
    'Content Engine helps physical therapists and rehabilitation professionals build a consistent social media presence without spending hours on content creation. Upload a voice note describing a patient win (anonymized), a before/after photo, or a clinical tip — and Content Engine produces a complete Instagram content package with captions, hashtags, and posting schedule. It also generates VA briefs so your virtual assistant can execute the plan, and sends personalized testimonial requests to patients on your behalf.',
    'professional',
    49,
    NULL,
    'RehabStack',
    true,
    ARRAY['en','es','pt'],
    'grow-your-practice',
    'Anthropic',
    ARRAY['claude-sonnet-4-6','claude-opus-4-6'],
    'sonnet',
    'active',
    'managed_anthropic',
    true,
    NULL,
    '[{"id":"voice-note","label":"Record Voice Note","icon":"mic"},{"id":"photo-video","label":"Upload Photo/Video","icon":"camera"},{"id":"testimonial","label":"Request Testimonial","icon":"star"},{"id":"va-brief","label":"Create VA Brief","icon":"clipboard"}]'::jsonb,
    '[{"type":"Content Package","description":"A complete social media content package with captions and hashtags"},{"type":"VA Brief","description":"Detailed instructions for your virtual assistant to execute content tasks"},{"type":"Testimonial Request","description":"Personalized testimonial request messages for your patients"}]'::jsonb,
    '[{"name":"Instagram","type":"social"},{"name":"Google Drive","type":"storage"}]'::jsonb,
    '{}'::jsonb
  ),
  (
    'CE Matcher',
    'ce-matcher',
    'Find continuing education courses, plan conference trips, and stay on top of your CE calendar.',
    'CE Matcher is your AI-powered continuing education advisor. It searches a curated database of PT, OT, and rehab CE courses and conferences, matches them to your specialty, license renewal requirements, and learning goals, and builds a recommended calendar. Planning to attend a conference? CE Matcher creates a full trip proposal including flight windows, hotel options, and a session-by-session schedule. It also tracks your CE hours and sends reminders before license renewal deadlines.',
    'starter',
    29,
    NULL,
    'RehabStack',
    true,
    ARRAY['en','es','pt'],
    'find-training',
    'Anthropic',
    ARRAY['claude-sonnet-4-6'],
    'sonnet',
    'active',
    'managed_anthropic',
    false,
    NULL,
    '[{"id":"find-courses","label":"Find Courses","icon":"search"},{"id":"check-radar","label":"Check Radar","icon":"radar"},{"id":"plan-trip","label":"Plan Trip","icon":"map-pin"},{"id":"ce-calendar","label":"CE Calendar","icon":"calendar"}]'::jsonb,
    '[{"type":"Course Recommendation","description":"Personalized CE course recommendations based on your specialty and license state"},{"type":"Trip Proposal","description":"Complete conference trip plan with flights, hotels, and conference schedule"},{"type":"CE Calendar","description":"Organized calendar of upcoming CE requirements and renewal deadlines"}]'::jsonb,
    '[{"name":"Google Calendar","type":"calendar"}]'::jsonb,
    '{}'::jsonb
  ),
  (
    'Course Creator',
    'course-creator',
    'Transform your clinical expertise into an online course with curriculum, sales page, and launch emails.',
    'Course Creator turns your years of clinical experience into a sellable online course — without requiring you to know anything about instructional design. Start with a Brain Dump: talk or type out everything you know about a topic. Course Creator organizes it into a structured curriculum with modules, lessons, and learning objectives. It then writes a high-converting sales page and a complete pre-launch email sequence. Built for rehabilitation professionals who want to create a revenue stream beyond patient care hours.',
    'professional',
    59,
    NULL,
    'RehabStack',
    false,
    ARRAY['en','es','pt'],
    'monetize-expertise',
    'Anthropic',
    ARRAY['claude-sonnet-4-6','claude-opus-4-6'],
    'sonnet',
    'active',
    'managed_anthropic',
    true,
    NULL,
    '[{"id":"brain-dump","label":"Brain Dump","icon":"brain"},{"id":"review-curriculum","label":"Review Curriculum","icon":"book-open"},{"id":"sales-page","label":"Sales Page","icon":"megaphone"},{"id":"launch-emails","label":"Launch Emails","icon":"mail"}]'::jsonb,
    '[{"type":"Curriculum Draft","description":"Complete course curriculum with modules, lessons, and learning objectives"},{"type":"Sales Page","description":"High-converting sales page copy for your online course"},{"type":"Launch Email Sequence","description":"Pre-launch and launch email sequence to sell your course"}]'::jsonb,
    '[{"name":"Teachable","type":"lms"},{"name":"Kajabi","type":"lms"},{"name":"Mailchimp","type":"email"}]'::jsonb,
    '{}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  pricing_usd = EXCLUDED.pricing_usd,
  quick_actions = EXCLUDED.quick_actions,
  work_item_types = EXCLUDED.work_item_types;
```

- [ ] **Step 3: Verify seed**

Use `mcp__supabase__execute_sql`:
```sql
SELECT id, name, slug, category, pricing_usd, status
FROM public.agents
WHERE slug IN ('content-engine', 'ce-matcher', 'course-creator');
```
Expected: 3 rows with status = 'active'.

- [ ] **Step 4: Commit seed script**

```bash
git add scripts/seed-agents.ts
git commit -m "feat: add platform agents seed script"
```

---

## Self-Review Checklist

### Spec coverage
| Requirement | Task |
|-------------|------|
| `agents/page.tsx` with filter sidebar + search + grid + empty state | Task 8 |
| `agents/[category]/page.tsx` with title + description + grid | Task 9 |
| `agents/[category]/[slug]/page.tsx` with hero + pricing card + reviews + JSON-LD | Task 10 |
| `agent-card.tsx` with name, creator, category badge, description, price, rating, languages, compliance | Task 3 |
| `agents/layout.tsx` with navbar + footer | Task 7 |
| `scripts/seed-agents.ts` with 3 platform agents | Task 11 |
| Migration for slug + short_description | Task 1 |
| Run migration via Supabase MCP | Task 1 Step 2 |
| Run seed via Supabase MCP | Task 11 Step 2 |
| generateMetadata on every page | Tasks 8, 9, 10 |
| JSON-LD structured data | Tasks 8, 10 |
| Mobile-responsive (1 col mobile, 2 tablet, 3 desktop) | Tasks 3, 8 |
| Empty state with reset filters button | Task 8 |
| Subscribe Now → /api/stripe/checkout | Task 6, 10 |
| Try Demo → /dashboard/agents/mock | Task 10 |

### Notes for implementer
- `stripe_price_id` is NULL for all 3 platform agents. The Subscribe Now button will be disabled until real Stripe Price IDs are configured in the admin panel.
- `reviews!agent_id(rating)` join works because the RLS policy `reviews_select_verified_public` only exposes `verified = true` rows, so the client only sees verified reviews automatically.
- The `creator_id` for platform agents is NULL — this is intentional. The `creator_name` column stores 'RehabStack' directly to avoid a join that RLS would block for anonymous visitors.
- `searchParams` is a `Promise<...>` in Next.js 16 — always `await` it.
- No `asChild` prop on `Button` — always use `Link > button` pattern (per CLAUDE.md).
