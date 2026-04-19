'use client'

// Componente cliente para alternar el estado de un agente entre 'active' y 'paused'.
// Llama a PATCH /api/creator/agents/[id] con el nuevo estado y refresca la página.

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

// ── Props ─────────────────────────────────────────────────────────────────────

interface AgentStatusToggleProps {
  agentId: string
  currentStatus: string
  labelPause: string
  labelActivate: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AgentStatusToggle({
  agentId,
  currentStatus,
  labelPause,
  labelActivate,
}: AgentStatusToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Solo mostrar el toggle si el agente está activo o pausado
  if (currentStatus !== 'active' && currentStatus !== 'paused') {
    return null
  }

  // Determinar el nuevo estado al que se cambiará
  const nextStatus = currentStatus === 'active' ? 'paused' : 'active'
  const label = currentStatus === 'active' ? labelPause : labelActivate

  async function handleToggle() {
    setLoading(true)
    try {
      // Llamada PATCH a la API del creador para actualizar el estado
      const res = await fetch(`/api/creator/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[AgentStatusToggle] Error al actualizar estado:', data)
      } else {
        // Refrescar los datos del Server Component sin recargar la página completa
        router.refresh()
      }
    } catch (err) {
      console.error('[AgentStatusToggle] Error de red:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleToggle}
      // Color diferenciado: Pause en naranja, Activate en verde
      className={
        nextStatus === 'paused'
          ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
          : 'border-green-300 text-green-700 hover:bg-green-50'
      }
    >
      {loading ? '…' : label}
    </Button>
  )
}
