// Página de detalle de un agente — /[locale]/agents/[category]/[slug] — Server Component.
// Layout: hero arriba, columna principal (descripción, quick actions, reseñas)
// con tarjeta de precio sticky a la derecha en escritorio.
// Incluye JSON-LD SoftwareApplication para SEO.

import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Star, Globe, Cpu } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
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

// Calcula el promedio de calificaciones redondeado a 1 decimal
function avgRating(reviews: AgentReview[]): number | null {
  if (!reviews.length) return null
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
}

// Etiquetas de idioma para mostrar en la UI
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', es: 'Spanish', pt: 'Portuguese',
  fr: 'French',  de: 'German',  ar: 'Arabic',
}

// ── Data fetching ─────────────────────────────────────────────────────────────

// cache() memoiza durante el mismo request — evita dos queries entre
// generateMetadata y el componente de página.
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
  params: Promise<{ locale: string; category: string; slug: string }>
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

function ReviewsSection({
  reviews,
  t,
}: {
  reviews: AgentReview[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const rating = avgRating(reviews)

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-lg font-semibold text-neutral-900">
        {t('detail.reviews')}
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">{t('detail.noReviews')}</p>
      ) : (
        <>
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
                  {t('detail.reviewsCount', { count: reviews.length })}
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

  const [agent, t] = await Promise.all([
    fetchAgent(category, slug),
    getTranslations('agents'),
  ])

  if (!agent) notFound()

  const rating = avgRating(agent.reviews)
  const categoryMeta = CATEGORY_META[agent.category]

  // JSON-LD SoftwareApplication para SEO
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
            {t('allAgents')}
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
            {/* Badge de categoría */}
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
              {categoryMeta?.label ?? agent.category}
            </span>

            {/* Badge de cumplimiento */}
            {agent.compliance_badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {t('detail.complianceVerified')}
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
                {rating} ({t('detail.reviewsCount', { count: agent.reviews.length })})
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
                <h2 id="description-heading" className="text-lg font-semibold text-neutral-900">
                  {t('detail.about')}
                </h2>
                <p className="mt-3 text-neutral-600 leading-relaxed">{agent.description}</p>
              </section>
            )}

            {/* Quick Actions preview */}
            {Array.isArray(agent.quick_actions) && agent.quick_actions.length > 0 && (
              <section aria-labelledby="quick-actions-heading">
                <h2 id="quick-actions-heading" className="text-lg font-semibold text-neutral-900">
                  {t('detail.quickActions')}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{t('detail.quickActionsSubtitle')}</p>
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
                  {t('detail.languages')}
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

            {/* Model provider */}
            {agent.model_provider && (
              <section aria-labelledby="model-heading">
                <h2
                  id="model-heading"
                  className="flex items-center gap-2 text-lg font-semibold text-neutral-900"
                >
                  <Cpu className="size-5" aria-hidden="true" />
                  {t('detail.modelProvider')}
                </h2>
                <p className="mt-3 text-neutral-600">
                  {t('detail.poweredBy', { provider: agent.model_provider })}
                  {agent.supported_models && agent.supported_models.length > 0 && (
                    <> {t('detail.supportedModels', { models: agent.supported_models.join(', ') })}</>
                  )}
                </p>
              </section>
            )}

            {/* Reseñas */}
            <ReviewsSection reviews={agent.reviews} t={t} />
          </div>

          {/* ── Pricing card sticky ── */}
          <aside className="shrink-0 lg:w-80">
            <div className="lg:sticky lg:top-20">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {agent.pricing_usd != null && agent.pricing_usd > 0 ? (
                      <span className="text-3xl font-extrabold text-neutral-900">
                        ${agent.pricing_usd}
                        <span className="text-base font-normal text-neutral-500">
                          {t('detail.perMonth')}
                        </span>
                      </span>
                    ) : (
                      <span className="text-3xl font-extrabold text-neutral-900">
                        {t('detail.free')}
                      </span>
                    )}
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
                      {t('detail.tryDemo')}
                    </button>
                  </Link>

                  {agent.staff_delegation && (
                    <p className="text-center text-xs text-neutral-500">
                      {t('detail.supportsTeam')}
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
