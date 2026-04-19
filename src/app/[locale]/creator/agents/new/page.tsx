// src/app/[locale]/creator/agents/new/page.tsx
// Página de creación de nuevo agente — /[locale]/creator/agents/new
// Server Component delgado: exporta generateMetadata y renderiza el Client Component
// NewAgentForm que maneja el formulario multi-paso completo.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NewAgentForm } from '@/components/creator/new-agent-form'

// ── Props de la página ────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

// ── Metadata dinámica ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.agentForm' })
  return {
    title: `${t('step1Title')} — New Agent | RehabStack`,
    description: 'Create and publish a new AI agent on the RehabStack marketplace.',
  }
}

// ── Página principal ──────────────────────────────────────────────────────────

// Server Component que delega toda la lógica interactiva al Client Component NewAgentForm.
// Esto permite exportar generateMetadata mientras el formulario mantiene estado React.
export default async function NewAgentPage() {
  return (
    <div className="py-8 px-4 sm:px-6">
      <NewAgentForm />
    </div>
  )
}
