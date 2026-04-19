// Página principal del marketplace — /[locale]/agents — Server Component.
// Mismo lógica que la versión original pero con strings i18n.

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AgentCard } from '@/components/agents/agent-card'
import { AgentFilterSidebar } from '@/components/agents/agent-filter-sidebar'
import { AgentSearchBar } from '@/components/agents/agent-search-bar'
import type { AgentSummary, MarketplaceFilters } from '@/types/agents'

// ── Metadata ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'agents' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: { title: t('metaTitle'), description: t('metaDescription'), type: 'website' },
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAgents(filters: MarketplaceFilters): Promise<AgentSummary[]> {
  const supabase = await createClient()
  let query = supabase
    .from('agents')
    .select('id, name, slug, short_description, tier, pricing_usd, creator_name, compliance_badge, languages, category, model_provider, reviews!agent_id(rating)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.language) query = query.contains('languages', [filters.language])
  if (filters.provider) query = query.eq('model_provider', filters.provider)
  if (filters.q) {
    const safeQ = filters.q.replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ]/g, '')
    if (safeQ) query = query.or(`name.ilike.%${safeQ}%,short_description.ilike.%${safeQ}%`)
  }
  if (filters.price === 'free')  query = query.or('pricing_usd.is.null,pricing_usd.eq.0')
  else if (filters.price === '1-29')  query = query.gte('pricing_usd', 1).lte('pricing_usd', 29)
  else if (filters.price === '30-59') query = query.gte('pricing_usd', 30).lte('pricing_usd', 59)
  else if (filters.price === '60+')   query = query.gte('pricing_usd', 60)

  const { data, error } = await query
  if (error) { console.error('[agents/page] Supabase error:', error.message); return [] }
  return (data ?? []) as AgentSummary[]
}

function buildJsonLd(agents: AgentSummary[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Agents for Rehab Professionals',
    description: 'Marketplace of AI agents for physical therapy and rehabilitation professionals.',
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

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AgentsPage({ searchParams }: Props) {
  const params = await searchParams
  const t = await getTranslations('agents')

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-neutral-600">{t('subtitle')}</p>
        </div>

        {/* Búsqueda */}
        <div className="mb-8">
          <AgentSearchBar initialValue={filters.q} />
        </div>

        {/* Sidebar + grid */}
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <AgentFilterSidebar filters={filters} />
          </aside>

          <section aria-label="Agent listings" className="min-w-0 flex-1">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <p className="text-lg font-medium text-neutral-700">{t('empty.title')}</p>
                <p className="text-sm text-neutral-500">{t('empty.subtitle')}</p>
                <Link href="/agents">
                  <button type="button" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
                    {t('empty.reset')}
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-neutral-500">
                  {t('found', { count: agents.length })}
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
