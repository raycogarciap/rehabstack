// Layout del workspace del agente — /[locale]/dashboard/agents/[id] — Server Component.
// No hereda el layout del dashboard (route group separado).
// Fetchea datos del agente y los provee vía AgentWorkspaceShell.
// Si id === "mock", usa un agente hardcodeado para testing sin BD.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AgentWorkspaceShell, type AgentData } from '@/lib/agent-context'

// Agente de prueba — no requiere BD ni suscripción
const MOCK_AGENT: AgentData = {
  id: 'mock',
  name: 'Content Engine (Demo)',
  category: 'grow-your-practice',
  hosting_type: 'creator_hosted',
  quick_actions: [
    { label: 'Record Voice Note',  prompt: 'I want to create content from a voice note. Please guide me.' },
    { label: 'Upload Photo/Video', prompt: 'I have a photo or video I want to build content around.' },
    { label: 'Request Testimonial', prompt: 'Help me craft a testimonial request to send to a patient.' },
    { label: 'Create VA Brief',    prompt: 'Create a virtual assistant brief for social media content creation.' },
  ],
  platform_agent_id: null,
}

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard.workspace' })
  return { title: t('metaTitle') }
}

export default async function AgentWorkspaceLayout({ children, params }: Props) {
  const { id } = await params

  let agent: AgentData

  if (id === 'mock') {
    // Modo demo: sin auth ni BD
    agent = MOCK_AGENT
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const locale = await getLocale()
      redirect(`/${locale}/login`)
    }

    const { data } = await supabase
      .from('agents')
      .select('id, name, category, hosting_type, quick_actions, platform_agent_id')
      .eq('id', id)
      .single()

    if (!data) {
      const locale = await getLocale()
      redirect(`/${locale}/dashboard/agents`)
    }

    agent = data as AgentData
  }

  return <AgentWorkspaceShell agent={agent}>{children}</AgentWorkspaceShell>
}
