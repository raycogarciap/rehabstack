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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
