// Página principal del marketplace — /[locale]/agents — Server Component.
// Diseño: hero oscuro full-width → barra de filtros sticky → grid de cards → CTA inferior.

import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Code, Mail, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AgentCard } from '@/components/agents/agent-card'
import { AgentSearchBar } from '@/components/agents/agent-search-bar'
import { CategoryFilter } from '@/components/agents/CategoryFilter'
import { NewsletterForm } from '@/components/agents/NewsletterForm'
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
    .select(`
      id, name, slug, short_description, tier, pricing_usd,
      creator_name, creator_verified, compliance_badge,
      languages, category, model_provider,
      hero_image_url, demo_videos,
      reviews!agent_id(rating)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.language) query = query.contains('languages', [filters.language])
  if (filters.provider) query = query.eq('model_provider', filters.provider)
  if (filters.q) {
    const safeQ = filters.q.replace(/[^a-zA-Z0-9\s\-áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ]/g, '')
    if (safeQ) query = query.or(`name.ilike.%${safeQ}%,short_description.ilike.%${safeQ}%`)
  }
  if (filters.price === 'free')   query = query.or('pricing_usd.is.null,pricing_usd.eq.0')
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

      {/* ── 1. Hero oscuro full-width ────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#312E81] py-16 px-4 text-center">
        <p className="text-[#818CF8] uppercase tracking-widest text-xs font-semibold mb-4">
          The Marketplace
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-3xl mx-auto leading-tight">
          AI Agents for Physiotherapists, Chiropractors and Osteopaths
        </h1>
        <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
          Browse specialized AI assistants built to grow your practice, find your next course, and monetize your expertise.
        </p>
      </div>

      {/* ── 2. Barra de filtros sticky ───────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-[105px] z-40 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center justify-between">
          {/* Dropdown de categoría */}
          <CategoryFilter activeCategory={filters.category} />

          {/* Contador de resultados */}
          <span className="text-sm text-[#64748B]">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'} found
          </span>

          {/* Barra de búsqueda */}
          <div className="w-full max-w-xs">
            <AgentSearchBar initialValue={filters.q} />
          </div>
        </div>
      </div>

      {/* ── 3. Grid de agentes ──────────────────────────────────────── */}
      <div className="bg-white">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-4">
            <p className="text-lg font-medium text-[#1E293B]">No agents found</p>
            <p className="text-sm text-[#64748B]">Try adjusting your filters or search terms.</p>
            <Link href="/agents">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#1E293B] transition-colors hover:bg-gray-50"
              >
                Clear all filters
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 py-12">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Sección CTA inferior — 3 columnas ────────────────────── */}
      <div className="bg-[#F8FAFC] py-16 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* CTA 1: Para desarrolladores */}
          <div className="bg-[#0F172A] rounded-2xl p-8 text-white">
            <div className="bg-[#1E293B] rounded-xl p-3 inline-flex mb-4">
              <Code className="size-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xl mb-3">Build and list your own AI agent</h3>
            <p className="text-[#94A3B8] text-sm mb-6">
              Join the marketplace. Keep 75–80% of every subscription. List in 24 hours.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/for-creators"
                className="text-[#818CF8] font-semibold text-sm hover:text-white transition-colors"
              >
                Start listing →
              </Link>
              <Link
                href="/docs"
                className="text-[#64748B] text-sm hover:text-white transition-colors"
              >
                Read the docs →
              </Link>
            </div>
          </div>

          {/* CTA 2: Newsletter */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100">
            <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-4">
              <Mail className="size-6 text-[#4F46E5]" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xl text-[#1E293B] mb-3">Stay ahead of the curve</h3>
            <p className="text-[#64748B] text-sm mb-6">
              Get weekly updates on new AI agents, practitioner results, and marketplace news.
            </p>
            <NewsletterForm />
          </div>

          {/* CTA 3: Comunidad */}
          <div className="bg-gradient-to-br from-[#6B9E78] to-[#4A7A57] rounded-2xl p-8 text-white">
            <div className="bg-white/20 rounded-xl p-3 inline-flex mb-4">
              <Users className="size-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xl mb-3">Join our community</h3>
            <p className="text-white/80 text-sm mb-6">
              500+ rehabilitation professionals exploring AI-powered practice growth. Free to join.
            </p>
            <Link
              href="/about"
              className="bg-white text-[#4A7A57] hover:bg-gray-50 px-6 py-2.5 rounded-lg font-semibold text-sm inline-block transition-colors"
            >
              Join on Skool →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
