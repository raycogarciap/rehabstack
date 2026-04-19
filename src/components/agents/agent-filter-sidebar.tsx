// src/components/agents/agent-filter-sidebar.tsx
// Sidebar de filtros del marketplace — Client Component.
// Lee filtros activos desde props (pasados por el Server Component padre).
// Al cambiar un filtro, actualiza la URL con useRouter sin recargar la página.
// Usa useTranslations para todos los labels de UI.

'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { MarketplaceFilters } from '@/types/agents'

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
  filters: MarketplaceFilters
}

export function AgentFilterSidebar({ filters }: AgentFilterSidebarProps) {
  const t = useTranslations('agents')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Categorías con labels traducidos — valores en inglés (BD) + labels i18n
  const CATEGORIES = [
    { value: 'grow-your-practice',  label: t('categories.growYourPractice') },
    { value: 'monetize-expertise',  label: t('categories.monetizeExpertise') },
    { value: 'find-training',       label: t('categories.findTraining') },
    { value: 'documentation',       label: t('categories.documentation') },
    { value: 'treatment-planning',  label: t('categories.treatmentPlanning') },
    { value: 'outcomes',            label: t('categories.outcomes') },
  ]

  // Idiomas de soporte del agente — etiquetas en el idioma de la UI
  const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ar', label: 'Arabic' },
  ]

  // Proveedores de modelo — nombres propios, sin traducción
  const PROVIDERS = [
    { value: 'Anthropic', label: 'Anthropic' },
    { value: 'OpenAI',    label: 'OpenAI' },
    { value: 'Multi',     label: 'Multi-Provider' },
  ]

  // Rangos de precio — "Free" traducido, rangos numéricos universales
  const PRICE_RANGES = [
    { value: 'free',  label: t('card.free') },
    { value: '1-29',  label: '$1 – $29' },
    { value: '30-59', label: '$30 – $59' },
    { value: '60+',   label: '$60+' },
  ]

  // Actualiza un único parámetro de filtro en la URL (null = eliminar)
  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  // Limpia todos los filtros excepto la búsqueda de texto
  const clearAll = () => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const hasActiveFilters =
    filters.category || filters.language || filters.provider || filters.price

  return (
    <nav aria-label="Filter agents" className="space-y-6">
      {/* Cabecera + botón limpiar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">{t('filters.title')}</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-blue-600 hover:underline"
          >
            {t('filters.clearAll')}
          </button>
        )}
      </div>

      <FilterGroup
        title={t('filters.category')}
        options={CATEGORIES}
        filterKey="category"
        activeValue={filters.category}
        onSelect={updateFilter}
      />

      <FilterGroup
        title={t('filters.language')}
        options={LANGUAGES}
        filterKey="language"
        activeValue={filters.language}
        onSelect={updateFilter}
      />

      <FilterGroup
        title={t('filters.modelProvider')}
        options={PROVIDERS}
        filterKey="provider"
        activeValue={filters.provider}
        onSelect={updateFilter}
      />

      <FilterGroup
        title={t('filters.price')}
        options={PRICE_RANGES}
        filterKey="price"
        activeValue={filters.price}
        onSelect={updateFilter}
      />
    </nav>
  )
}
