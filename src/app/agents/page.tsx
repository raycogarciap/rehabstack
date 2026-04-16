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
    // Sanitiza el término de búsqueda: solo permite alfanumérico, espacios y caracteres
    // acentuados comunes. Previene inyección de filtros PostgREST via .or() interpolado.
    const safeQ = filters.q.replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ]/g, '')
    if (safeQ) {
      query = query.or(
        `name.ilike.%${safeQ}%,short_description.ilike.%${safeQ}%`,
      )
    }
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
