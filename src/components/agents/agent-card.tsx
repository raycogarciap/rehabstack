// src/components/agents/agent-card.tsx
// Tarjeta de agente para el grid del marketplace — diseño enriquecido.
// Muestra thumbnail de YouTube (si hay vídeo) o banda de color por categoría.
// Logo del agente con overlap visual sobre el thumbnail (-mt-8).
// Card completa es un link clickeable.

import Link from 'next/link'
import { ShieldCheck, Star, Play } from 'lucide-react'
import { CATEGORY_META, type AgentSummary } from '@/types/agents'

// ── Helpers ───────────────────────────────────────────────────────────────────

// Calcula el rating promedio redondeado a 1 decimal
function avgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
}

// Renderiza estrellas para el rating
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
      <span className="ml-1 text-xs text-[#64748B]">{rating}</span>
    </span>
  )
}

// Extrae el ID de un vídeo de YouTube desde una URL embed
// Ejemplo: "https://www.youtube.com/embed/dQw4w9WgXcQ" → "dQw4w9WgXcQ"
function extractYouTubeId(url: string): string | null {
  const match = url.match(/\/embed\/([^?&/]+)/)
  return match ? match[1] : null
}

// Gradiente de fondo por categoría — se muestra si no hay vídeo
const CATEGORY_GRADIENTS: Record<string, string> = {
  'grow-your-practice': 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED]',
  'find-training':      'bg-gradient-to-br from-[#0EA5E9] to-[#4F46E5]',
  'monetize-expertise': 'bg-gradient-to-br from-[#F59E0B] to-[#EF4444]',
}
const DEFAULT_GRADIENT = 'bg-gradient-to-br from-[#4F46E5] to-[#6B9E78]'

// ── Componente ────────────────────────────────────────────────────────────────

interface AgentCardProps {
  agent: AgentSummary
}

export function AgentCard({ agent }: AgentCardProps) {
  const rating = avgRating(agent.reviews)
  const categoryMeta = CATEGORY_META[agent.category]
  const href = `/agents/${agent.category}/${agent.slug}`

  // Primer vídeo disponible para thumbnail
  const firstVideo =
    Array.isArray(agent.demo_videos) && agent.demo_videos.length > 0
      ? agent.demo_videos[0]
      : null
  const videoId = firstVideo ? extractYouTubeId(firstVideo.url) : null

  const gradient = CATEGORY_GRADIENTS[agent.category] ?? DEFAULT_GRADIENT

  return (
    <Link href={href} className="flex flex-col h-full group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-[#C7D2FE] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">

        {/* ── 1. Thumbnail (YouTube) o banda de color ─────────────────── */}
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          {videoId ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={`${agent.name} demo`}
                className="w-full h-full object-cover"
              />
              {/* Overlay con botón de play */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="size-5 text-[#4F46E5] ml-1" aria-hidden="true" />
                </div>
              </div>
            </>
          ) : (
            // Banda de color con inicial del agente
            <div className={`w-full h-full ${gradient} flex items-center justify-center`}>
              <span className="text-6xl font-bold text-white/20" aria-hidden="true">
                {agent.name[0]}
              </span>
            </div>
          )}
        </div>

        {/* ── 2. Card body ─────────────────────────────────────────────── */}
        <div className="p-6 flex-1 flex flex-col">

          {/* Logo + nombre + creador */}
          <div className="flex items-start gap-3 mb-3">
            {/* Logo con overlap sobre el thumbnail (-mt-8) */}
            {agent.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.hero_image_url}
                alt={agent.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0 -mt-8 relative z-10 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#4F46E5] font-bold text-lg flex-shrink-0 -mt-8 relative z-10 shadow-md">
                {agent.name[0]}
              </div>
            )}

            {/* Nombre + creador */}
            <div className="min-w-0 pt-1">
              <p className="font-bold text-[#1E293B] text-lg leading-tight">{agent.name}</p>
              {agent.creator_name && (
                <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                  by {agent.creator_name}
                  {agent.creator_verified && (
                    <ShieldCheck className="size-3 text-emerald-500 flex-shrink-0" aria-label="Verified creator" />
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Badge de categoría */}
          <span className="inline-block bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full mb-3 self-start">
            {categoryMeta?.label ?? agent.category}
          </span>

          {/* Descripción corta — clamped a 3 líneas */}
          <p
            className="text-sm text-[#64748B] leading-relaxed mb-4 flex-1"
            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {agent.short_description ?? ''}
          </p>

          {/* Fila inferior: rating + "Learn More →" */}
          <div className="flex items-center justify-between mt-auto">
            {rating !== null ? (
              <StarRating rating={rating} />
            ) : (
              <span className="text-xs text-[#94A3B8]">No reviews yet</span>
            )}
            <span className="text-sm font-semibold text-[#4F46E5] group-hover:text-[#3730A3] transition-colors">
              Learn More →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
