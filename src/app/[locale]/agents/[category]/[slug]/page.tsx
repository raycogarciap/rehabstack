// Página de detalle de un agente — /[locale]/agents/[category]/[slug]
// Server Component. Fetch desde Supabase por slug + category.
// Secciones: breadcrumb, hero 2-col, vídeos, screenshots, descripción, creator, reviews, CTA.

import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_META, type AgentDetail, type AgentReview } from '@/types/agents'

// ── Helpers ───────────────────────────────────────────────────────────────────

function avgRating(reviews: AgentReview[]): number | null {
  if (!reviews.length) return null
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'size-5' : 'size-4'
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', pt: 'PT', fr: 'FR', de: 'DE', ar: 'AR',
}

// ── Data fetching (memoizado por request) ─────────────────────────────────────

const fetchAgent = cache(async (category: string, slug: string): Promise<AgentDetail | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agents')
    .select('*, reviews(rating, text, created_at, verified)')
    .eq('status', 'active')
    .eq('category', category)
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return data as AgentDetail
})

// ── Metadata ──────────────────────────────────────────────────────────────────

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
      images: agent.hero_image_url ? [agent.hero_image_url] : [],
    },
  }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AgentDetailPage({ params }: Props) {
  const { category, slug } = await params
  const agent = await fetchAgent(category, slug)
  if (!agent) notFound()

  const rating = avgRating(agent.reviews)
  const categoryMeta = CATEGORY_META[agent.category]
  const hasVideos = Array.isArray(agent.demo_videos) && agent.demo_videos.length > 0
  const hasScreenshots = Array.isArray(agent.screenshots) && agent.screenshots.length > 0
  const videos = hasVideos ? agent.demo_videos!.slice(0, 2) : []
  const screenshots = hasScreenshots ? agent.screenshots!.slice(0, 2) : []
  const showTrial = agent.free_trial_enabled ?? false

  // JSON-LD SoftwareApplication para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: agent.name,
    description: agent.short_description ?? '',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1. Breadcrumb ─────────────────────────────────────────────── */}
      <div className="bg-[#F8FAFC] border-b border-gray-100 py-3 px-4">
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto text-sm text-[#64748B] flex items-center gap-1">
          <Link href="/agents" className="hover:text-[#1E293B] transition-colors">Agents</Link>
          <span className="mx-1">→</span>
          <Link href={`/agents/${agent.category}`} className="hover:text-[#1E293B] transition-colors capitalize">
            {categoryMeta?.label ?? agent.category}
          </Link>
          <span className="mx-1">→</span>
          <span className="text-[#1E293B] font-medium">{agent.name}</span>
        </nav>
      </div>

      {/* ── 2. Hero — 2 columnas ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Columna izquierda: info del agente */}
          <div>
            {/* Badge de categoría */}
            <span className="inline-block bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {categoryMeta?.label ?? agent.category}
            </span>

            {/* Nombre */}
            <h1 className="text-4xl font-bold text-[#1E293B] mb-2">{agent.name}</h1>

            {/* Creador + badge de verificación */}
            {agent.creator_name && (
              <p className="text-sm text-[#64748B] flex items-center gap-1 mb-4">
                by <span className="font-medium text-[#1E293B]">{agent.creator_name}</span>
                {agent.creator_verified && (
                  <ShieldCheck className="size-4 text-emerald-500" aria-label="Verified creator" />
                )}
              </p>
            )}

            {/* Rating */}
            {rating !== null ? (
              <div className="flex items-center gap-2 mb-4">
                <StarRow rating={rating} />
                <span className="text-sm text-[#64748B]">
                  {rating} ({agent.reviews.length} {agent.reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8] mb-4">No reviews yet</p>
            )}

            {/* Tagline */}
            {agent.tagline && (
              <p className="text-xl text-[#6B9E78] font-semibold mb-6">{agent.tagline}</p>
            )}

            {/* Descripción corta — siempre de la BD, sin t() */}
            {agent.short_description && (
              <p className="text-[#64748B] leading-relaxed mb-8">{agent.short_description}</p>
            )}

            {/* Idiomas soportados */}
            {agent.languages && agent.languages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#64748B] mr-1">Available in:</span>
                {agent.languages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-[#F1F5F9] text-[#475569] text-xs px-2 py-0.5 rounded font-medium"
                  >
                    {LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: tarjeta de precio sticky */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">

              {/* Badge de trial */}
              {showTrial && (
                <div className="bg-[#F0F7F1] text-[#4A7A57] text-sm font-semibold px-4 py-2 rounded-lg inline-block mb-6">
                  48-Hour Free Trial
                </div>
              )}

              {/* Precio */}
              <div className="mb-2">
                {agent.pricing_usd != null && agent.pricing_usd > 0 ? (
                  <>
                    <span className="text-4xl font-bold text-[#1E293B]">${agent.pricing_usd}</span>
                    <span className="text-[#64748B]">/month</span>
                    {agent.pricing_annual_usd != null && (
                      <p className="text-sm text-[#64748B] mt-1">
                        or ${agent.pricing_annual_usd}/mo billed annually
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-4xl font-bold text-[#1E293B]">Free</span>
                )}
              </div>

              {/* CTA primario */}
              <Link
                href="/register"
                className="block w-full bg-[#4F46E5] text-white hover:bg-[#3730A3] py-4 rounded-xl font-bold text-lg transition-colors text-center mt-6 mb-3"
              >
                {showTrial
                  ? 'Start 48-Hour Free Trial'
                  : agent.pricing_usd != null && agent.pricing_usd > 0
                    ? `Subscribe for $${agent.pricing_usd}/month`
                    : 'Get Started Free'}
              </Link>

              {showTrial && (
                <p className="text-xs text-[#94A3B8] text-center">
                  Card required. You won&apos;t be charged until your trial ends.
                </p>
              )}

              {/* Divider */}
              <hr className="my-6 border-gray-100" />

              {/* What's included */}
              <p className="text-sm font-semibold text-[#1E293B] mb-3">What&apos;s included</p>
              <ul className="flex flex-col gap-2">
                {Array.isArray(agent.quick_actions) && agent.quick_actions.length > 0
                  ? agent.quick_actions.map((qa) => (
                    <li key={qa.id} className="flex items-start gap-2 text-sm text-[#1E293B]">
                      <span className="text-[#6B9E78] font-semibold flex-shrink-0">✓</span>
                      {qa.label}
                    </li>
                  ))
                  : ['AI-powered assistance', 'Works in your language', '48-hour free trial'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#1E293B]">
                      <span className="text-[#6B9E78] font-semibold flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Vídeos de demostración (condicional) ───────────────────── */}
      {hasVideos && (
        <div className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">See it in action</h2>
          <div className={videos.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : ''}>
            {videos.map((video) => (
              <div key={video.url}>
                <p className="font-semibold text-[#1E293B] mb-3">{video.title}</p>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                  <iframe
                    src={video.url}
                    title={video.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Screenshots (condicional) ──────────────────────────────── */}
      {hasScreenshots && (
        <div className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Example outputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {screenshots.map((shot) => (
              <div
                key={shot.url}
                className="relative rounded-xl overflow-hidden shadow-md border border-gray-100 aspect-video"
              >
                <Image
                  src={shot.url}
                  alt={shot.alt_text}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Descripción completa ────────────────────────────────────── */}
      {(agent.long_description ?? agent.description) && (
        <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-6">About this assistant</h2>
          <p className="text-[#64748B] leading-relaxed whitespace-pre-wrap">
            {agent.long_description ?? agent.description}
          </p>
        </div>
      )}

      {/* ── 6. Sección del creador ────────────────────────────────────── */}
      {agent.creator_name && (
        <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-100">
          <div className="bg-[#F8FAFC] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-[#1E293B] mb-4">About the creator</h2>
            <p className="font-semibold text-[#1E293B] flex items-center gap-2 mb-3">
              {agent.creator_name}
              {agent.creator_verified && (
                <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />
              )}
            </p>
            <p className="text-[#64748B] leading-relaxed">
              {agent.creator_bio ?? `Created by ${agent.creator_name} for RehabStack.`}
            </p>
          </div>
        </div>
      )}

      {/* ── 7. Reseñas ────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-[#1E293B] mb-8">Reviews</h2>

        {agent.reviews.length > 0 ? (
          <div className="flex flex-col gap-6">
            {agent.reviews.map((review, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <StarRow rating={review.rating} />
                {review.text && (
                  <p className="text-[#1E293B] leading-relaxed mt-3">{review.text}</p>
                )}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm text-[#64748B]">Verified user</span>
                  {review.created_at && (
                    <span className="text-xs text-[#94A3B8]">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#F8FAFC] rounded-xl p-8 text-center">
            <p className="text-[#64748B] font-medium mb-2">
              No reviews yet. Be the first to review this assistant.
            </p>
            <p className="text-sm text-[#94A3B8]">Start your free trial to leave a review.</p>
          </div>
        )}
      </div>

      {/* ── 8. CTA strip final ────────────────────────────────────────── */}
      <div className="bg-[#4F46E5] py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Ready to try {agent.name}?
        </h2>
        <Link
          href="/register"
          className="bg-white text-[#4F46E5] hover:bg-gray-50 px-8 py-3 rounded-xl font-bold transition-colors inline-block"
        >
          Start Your Free Trial →
        </Link>
      </div>
    </>
  )
}
