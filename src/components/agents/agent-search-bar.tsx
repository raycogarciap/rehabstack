// src/components/agents/agent-search-bar.tsx
// Barra de búsqueda de agentes — Client Component.
// Actualiza el parámetro `q` en la URL con debounce de 300ms usando router.replace
// para no contaminar el historial del navegador.

'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AgentSearchBarProps {
  // Valor inicial leído desde searchParams en el Server Component padre
  initialValue?: string
}

export function AgentSearchBar({ initialValue }: AgentSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue ?? '')
  // Ref para limpiar el timer anterior antes de crear uno nuevo
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limpiar el timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

    // Cancelar navegación pendiente
    if (timerRef.current) clearTimeout(timerRef.current)

    // Esperar 300ms antes de navegar (debounce)
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (newValue.trim()) {
          params.set('q', newValue.trim())
        } else {
          params.delete('q')
        }
        // router.replace en lugar de push: no contamina el historial
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)
  }

  return (
    <div className="relative">
      {/* Ícono de búsqueda alineado a la izquierda del input */}
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Search agents by name or description…"
        value={value}
        onChange={handleChange}
        className="pl-9"
        aria-label="Search agents"
      />
    </div>
  )
}
