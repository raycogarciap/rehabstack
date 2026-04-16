// src/components/agents/agent-filter-sidebar.tsx
// Sidebar de filtros del marketplace — Client Component.
// Lee los filtros activos desde props (pasados por el Server Component padre).
// Al cambiar un filtro, actualiza la URL con useRouter sin recargar la página.

'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { MarketplaceFilters } from '@/types/agents'

// ── Opciones de filtro ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'grow-your-practice',  label: 'Grow Your Practice' },
  { value: 'monetize-expertise',  label: 'Monetize Expertise' },
  { value: 'find-training',       label: 'Find Training' },
  { value: 'documentation',       label: 'Documentation' },
  { value: 'treatment-planning',  label: 'Treatment Planning' },
  { value: 'outcomes',            label: 'Outcomes' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' },
]

const PROVIDERS = [
  { value: 'Anthropic', label: 'Anthropic' },
  { value: 'OpenAI',    label: 'OpenAI' },
  { value: 'Multi',     label: 'Multi-Provider' },
]

const PRICE_RANGES = [
  { value: 'free',  label: 'Free' },
  { value: '1-29',  label: '$1 – $29' },
  { value: '30-59', label: '$30 – $59' },
  { value: '60+',   label: '$60+' },
]

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
  // Filtros activos pasados desde el Server Component (basados en searchParams)
  filters: MarketplaceFilters
}

export function AgentFilterSidebar({ filters }: AgentFilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Actualiza un único parámetro de filtro en la URL.
  // value = null → elimina el filtro.
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
        <span className="text-sm font-semibold text-neutral-900">Filters</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup
        title="Category"
        options={CATEGORIES}
        filterKey="category"
        activeValue={filters.category}
        onSelect={updateFilter}
      />

      <FilterGroup
        title="Language"
        options={LANGUAGES}
        filterKey="language"
        activeValue={filters.language}
        onSelect={updateFilter}
      />

      <FilterGroup
        title="Model Provider"
        options={PROVIDERS}
        filterKey="provider"
        activeValue={filters.provider}
        onSelect={updateFilter}
      />

      <FilterGroup
        title="Price Range"
        options={PRICE_RANGES}
        filterKey="price"
        activeValue={filters.price}
        onSelect={updateFilter}
      />
    </nav>
  )
}
