// src/components/agents/CategoryFilter.tsx
// Dropdown de filtro de categoría — Client Component.
// Actualiza el parámetro ?category= en la URL sin recargar la página.

'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

// Categorías disponibles en el marketplace
const CATEGORIES = [
  { value: '',                    label: 'All Categories' },
  { value: 'grow-your-practice',  label: 'Grow Your Practice' },
  { value: 'find-training',       label: 'Find Training' },
  { value: 'monetize-expertise',  label: 'Monetize Expertise' },
  { value: 'documentation',       label: 'Documentation' },
  { value: 'treatment-planning',  label: 'Treatment Planning' },
  { value: 'outcomes',            label: 'Outcomes' },
]

interface CategoryFilterProps {
  activeCategory?: string
}

export function CategoryFilter({ activeCategory }: CategoryFilterProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Etiqueta visible del filtro activo
  const activeLabel =
    CATEGORIES.find((c) => c.value === (activeCategory ?? ''))?.label ?? 'All Categories'

  // Navega a la URL con el nuevo filtro de categoría
  const selectCategory = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('category', value)
      } else {
        params.delete('category')
      }
      router.replace(`${pathname}?${params.toString()}`)
      setOpen(false)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="relative">
      {/* Botón disparador del dropdown */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border border-gray-200 bg-white text-[#1E293B] text-sm px-4 py-2 rounded-lg hover:border-[#4F46E5] flex items-center gap-2 transition-colors"
      >
        {activeLabel}
        <ChevronDown className="size-4 text-[#64748B]" aria-hidden="true" />
      </button>

      {/* Panel del dropdown */}
      {open && (
        <>
          {/* Overlay invisible para cerrar al hacer clic fuera */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-2 min-w-[200px] z-50">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => selectCategory(cat.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  (activeCategory ?? '') === cat.value
                    ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                    : 'text-[#1E293B] hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
