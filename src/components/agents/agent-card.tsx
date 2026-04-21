// src/components/agents/agent-card.tsx
// Tarjeta reutilizable de agente para el grid del marketplace.
// Server Component async — usa getTranslations para los labels de UI.
// La descripción corta siempre se lee de la BD (agent.short_description).

import Link from 'next/link'
import { ShieldCheck, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { type AgentSummary, CATEGORY_META } from '@/types/agents'

// Calcula el rating promedio redondeado a 1 decimal
function avgRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
}

// Renderiza estrellas (llenas/vacías) para el rating
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

// Mapa de código de idioma → etiqueta abreviada (siempre en mayúsculas, universal)
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN', es: 'ES', pt: 'PT', fr: 'FR', de: 'DE', ar: 'AR',
}

interface AgentCardProps {
  agent: AgentSummary
}

// Componente async: puede llamar getTranslations directamente
export async function AgentCard({ agent }: AgentCardProps) {
  const t = await getTranslations('agents')

  const rating = avgRating(agent.reviews)
  const categoryMeta = CATEGORY_META[agent.category]
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
              title={t('card.verified')}
              aria-label={t('card.verified')}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t('card.verified')}
            </span>
          )}
        </div>

        {/* Nombre del agente — viene de la BD, no se traduce */}
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
        {/* Descripción corta — siempre de la BD, nunca una clave i18n */}
        <p className="line-clamp-2 text-sm text-neutral-600">
          {agent.short_description ?? ''}
        </p>

        {/* Rating o mensaje sin reseñas */}
        {rating !== null ? (
          <StarRating rating={rating} />
        ) : (
          <span className="text-xs text-neutral-400">{t('card.noReviews')}</span>
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
            ? `$${agent.pricing_usd}${t('card.perMonth')}`
            : t('card.free')}
        </span>

        {/* Botón "Learn More" — Link envuelve el botón, sin asChild */}
        <Link href={href}>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('card.learnMore')}
          </button>
        </Link>
      </CardFooter>
    </Card>
  )
}
