// Página principal del Creator Dashboard — /[locale]/creator
// Server Component puro. El layout ya verifica auth + role=creator,
// por lo que aquí solo cargamos datos y renderizamos estadísticas.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.overview' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// ── Mapa de colores para cada estado de agente ────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft:      'bg-neutral-100 text-neutral-600',
  in_review:  'bg-yellow-100 text-yellow-700',
  active:     'bg-green-100 text-green-700',
  paused:     'bg-orange-100 text-orange-700',
  delisted:   'bg-red-100 text-red-700',
}

// ── Subcomponente: tarjeta de estadística ─────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Número grande destacado */}
        <p className="text-3xl font-bold text-neutral-900">{value}</p>
      </CardContent>
    </Card>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function CreatorOverviewPage() {
  // El layout ya garantizó que el usuario es creator — obtenemos su ID aquí
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // user es no-nulo porque el layout redirigió si era null
  const t = await getTranslations('creator.overview')

  // ── Carga de agentes con sus suscripciones activas ────────────────────────
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, status, pricing_usd, subscriptions(id, status, created_at)')
    .eq('creator_id', user!.id)

  // ── Cálculo de estadísticas en JS ──────────────────────────────────────────
  const totalAgents = agents?.length ?? 0
  const now = new Date()
  // Primer día del mes actual a medianoche UTC
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let activeSubscribers = 0
  let revenueMtd = 0
  let revenueAllTime = 0

  agents?.forEach((agent) => {
    const price = agent.pricing_usd ?? 0
    // Solo contamos suscripciones con status='active'
    const activeSubs =
      (agent.subscriptions as { id: string; status: string; created_at: string }[] | null)?.filter(
        (s) => s.status === 'active',
      ) ?? []

    activeSubscribers += activeSubs.length
    // Ingresos del mes: solo suscripciones activas creadas desde inicio del mes
    revenueMtd +=
      price * activeSubs.filter((s) => new Date(s.created_at) >= startOfMonth).length
    // Ingresos históricos: todas las suscripciones activas
    revenueAllTime += price * activeSubs.length
  })

  // Formato monetario: $1,234
  const fmt = (n: number) => `$${n.toLocaleString()}`

  return (
    <div className="space-y-8">
      {/* ── Título de la página ──────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        {t('title')}
      </h1>

      {/* ── Grid de estadísticas: 2 cols en móvil, 4 en md+ ─────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t('totalAgents')}       value={String(totalAgents)} />
        <StatCard label={t('activeSubscribers')} value={String(activeSubscribers)} />
        <StatCard label={t('revenueMtd')}        value={fmt(revenueMtd)} />
        <StatCard label={t('revenueAllTime')}    value={fmt(revenueAllTime)} />
      </div>

      {/* ── Lista de agentes o estado vacío ──────────────────────────────── */}
      {agents && agents.length > 0 ? (
        <section className="space-y-3">
          {/* Encabezado de la sección */}
          <h2 className="text-lg font-semibold text-neutral-800">{t('agentStatus')}</h2>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
            {agents.map((agent) => {
              // Clave de traducción del estado (ej: 'in_review' → 'statusInReview')
              const statusKey = `status${agent.status
                .split('_')
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join('')}` as
                | 'statusDraft'
                | 'statusInReview'
                | 'statusActive'
                | 'statusPaused'
                | 'statusDelisted'

              const badgeClass =
                STATUS_STYLES[agent.status as string] ?? 'bg-neutral-100 text-neutral-600'

              return (
                <Link
                  key={agent.id}
                  href={`/creator/agents/${agent.id}/edit`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
                >
                  {/* Nombre del agente */}
                  <span className="text-sm font-medium text-neutral-900">{agent.name}</span>

                  {/* Badge de estado con color según el estado */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                  >
                    {t(statusKey)}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ) : (
        /* ── Estado vacío: aún no tiene agentes ──────────────────────────── */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center shadow-sm">
          {/* Icono decorativo */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-7 w-7 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>

          <h2 className="mb-1 text-base font-semibold text-neutral-900">
            {t('noAgentsTitle')}
          </h2>
          <p className="mb-6 max-w-xs text-sm text-neutral-500">{t('noAgentsDesc')}</p>

          {/* CTA para crear el primer agente */}
          <Link href="/creator/agents/new">
            <Button>{t('createAgent')}</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
