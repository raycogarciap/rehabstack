// src/components/agents/agent-search-bar.tsx
// Barra de búsqueda de agentes — Client Component.
// Actualiza el parámetro `q` en la URL con debounce de 300ms.
// Usa useTranslations para el placeholder.

'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AgentSearchBarProps {
  initialValue?: string
}

export function AgentSearchBar({ initialValue }: AgentSearchBarProps) {
  const t = useTranslations('agents')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

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
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)
  }

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={value}
        onChange={handleChange}
        className="pl-9"
        aria-label={t('searchPlaceholder')}
      />
    </div>
  )
}
