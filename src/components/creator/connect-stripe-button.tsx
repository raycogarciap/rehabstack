'use client'

// Botón de cliente que inicia el flujo de Stripe Connect Express.
// Hace POST a /api/stripe/connect, obtiene la URL de onboarding
// y redirige al usuario directamente a Stripe.

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function ConnectStripeButton() {
  // Traducciones del espacio de nombres creator.onboarding
  const t = useTranslations('creator.onboarding')

  // Estado de carga mientras se espera la respuesta de la API
  const [loading, setLoading] = useState(false)

  // Maneja el clic: llama a la API y redirige a Stripe
  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        console.error('[ConnectStripeButton] Error:', data.error ?? 'Sin URL de onboarding')
        setLoading(false)
        return
      }

      // Redirigir al usuario al formulario de onboarding de Stripe
      window.location.href = data.url
    } catch (err) {
      console.error('[ConnectStripeButton] Error de red:', err)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      size="lg"
      className="w-full sm:w-auto"
    >
      {loading ? t('connectingStripe') : t('connectStripe')}
    </Button>
  )
}
