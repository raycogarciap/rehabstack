// src/app/agents/[category]/[slug]/page.tsx
// Página de detalle de un agente — Server Component.
// Layout: hero arriba, luego columna principal (descripción, quick actions,
// reseñas) con tarjeta de precio sticky a la derecha en escritorio.
// Incluye JSON-LD SoftwareApplication para SEO.

import { cache } from 'react'
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

// cache() memoiza el resultado durante el mismo request de Next.js,
// evitando dos queries idénticas entre generateMetadata y el componente de página.
const fetchAgent = cache(async (
  category: string,
  slug: string,
): Promise<AgentDetail | null> => {
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
})

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
