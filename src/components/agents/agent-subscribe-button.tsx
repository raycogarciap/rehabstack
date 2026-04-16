// src/components/agents/agent-subscribe-button.tsx
// Botón "Subscribe Now" de la página de detalle de agente — Client Component.
// Llama a POST /api/stripe/checkout con agentId y priceId,
// luego redirige al Checkout de Stripe con window.location.href (URL externa).

'use client'

import { useState } from 'react'

interface AgentSubscribeButtonProps {
  agentId: string
  // priceId es null si el agente no tiene Stripe price configurado todavía
  priceId: string | null
  className?: string
}

export function AgentSubscribeButton({
  agentId,
  priceId,
  className,
}: AgentSubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubscribe() {
    if (!priceId) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, priceId }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        // Error de servidor — muestra mensaje al usuario
        setErrorMsg(data.error ?? 'Could not start checkout. Please try again.')
        return
      }
      if (data.url) {
        // URL externa de Stripe — usar window.location.href en lugar de router.push
        window.location.href = data.url
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading || !priceId}
        className={`inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
      >
        {loading ? 'Redirecting…' : 'Subscribe Now'}
      </button>
      {/* Mensaje de error accesible */}
      {errorMsg && (
        <p role="alert" className="text-xs text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
