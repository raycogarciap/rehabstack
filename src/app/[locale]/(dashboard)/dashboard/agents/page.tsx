// Lista de agentes suscritos — /[locale]/dashboard/agents — Server Component.
// Estado vacío: card con link al marketplace.
// Shortcut de desarrollo para abrir el mock agent.

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ── Metadata ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard.agents' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// ── Icono robot para estado vacío ─────────────────────────────────────────────

function IconRobot() {
  return (
    <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3a.75.75 0 0 0-1.5 0v.75H6A2.25 2.25 0 0 0 3.75 6v10.5A2.25 2.25 0 0 0 6 18.75h12A2.25 2.25 0 0 0 20.25 16.5V6A2.25 2.25 0 0 0 18 3.75h-2.25V3a.75.75 0 0 0-1.5 0v.75h-4.5V3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H9Zm5.25 0a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5h-.008Z" />
    </svg>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function MyAgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const locale = await getLocale()
    redirect(`/${locale}/login`)
  }

  // Suscripciones activas del usuario con datos del agente
  const { data: rows } = await supabase
    .from('subscriptions')
    .select('agent_id, agents(id, name, category, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  type AgentRow = { id: string; name: string; category: string; status: string }

  const agents: AgentRow[] = (rows ?? [])
    .map((r) => r.agents as unknown as AgentRow | null)
    .filter((a): a is AgentRow => a !== null)

  const t = await getTranslations('dashboard.agents')

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>
      </div>

      {agents.length === 0 ? (
        /* Estado vacío */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <IconRobot />
            <h2 className="mt-4 text-lg font-semibold text-neutral-700">{t('empty')}</h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">{t('emptyDesc')}</p>
            <div className="mt-6">
              <Link href="/agents">
                <Button>{t('browseMarketplace')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grid de tarjetas de agentes */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{agent.name}</CardTitle>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      agent.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <CardDescription className="capitalize">
                  {agent.category?.replace(/-/g, ' ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href={`/dashboard/agents/${agent.id}`}>
                  <Button className="w-full">{t('openDashboard')}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shortcut de desarrollo: mock agent */}
      <div className="border-t border-dashed border-neutral-200 pt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
          {t('dev')}
        </p>
        <Link href="/dashboard/agents/mock">
          <Button variant="outline" size="sm">{t('openMock')}</Button>
        </Link>
      </div>
    </div>
  )
}
