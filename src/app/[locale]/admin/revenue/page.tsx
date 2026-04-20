// src/app/[locale]/admin/revenue/page.tsx
// Página de ingresos del panel admin — Server Component.
// Obtiene datos de suscripciones y agentes para calcular MRR/ARR de la plataforma.

import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const t = await getTranslations('admin.revenue')
  return { title: t('metaTitle') }
}

// ─── Tipo para los datos de agente con métricas de ingresos ──────────────────

interface AgentRevenue {
  id: string
  name: string
  creator_name: string | null
  pricing_usd: number
  subscriberCount: number
  mrr: number
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default async function AdminRevenuePage() {
  const t = await getTranslations('admin.revenue')
  const adminClient = createAdminClient()

  // Obtener conteo de suscripciones activas y todas las suscripciones activas en paralelo
  const [{ count: activeSubscriptions }, { data: allActiveSubs }] = await Promise.all([
    adminClient.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('subscriptions').select('agent_id').eq('status', 'active'),
  ])

  // Agrupar suscripciones por agent_id en JavaScript
  const subCountByAgent: Record<string, number> = {}
  for (const sub of allActiveSubs ?? []) {
    if (sub.agent_id) {
      subCountByAgent[sub.agent_id] = (subCountByAgent[sub.agent_id] ?? 0) + 1
    }
  }

  // Obtener los top 10 IDs de agentes por número de suscriptores
  const top10AgentIds = Object.entries(subCountByAgent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id)

  // Obtener los detalles de los agentes top
  let topAgents: AgentRevenue[] = []

  if (top10AgentIds.length > 0) {
    const { data: agentData } = await adminClient
      .from('agents')
      .select('id, name, creator_name, pricing_usd')
      .in('id', top10AgentIds)

    topAgents = (agentData ?? []).map((agent: {
      id: string
      name: string
      creator_name: string | null
      pricing_usd: number
    }) => {
      const subscriberCount = subCountByAgent[agent.id] ?? 0
      return {
        ...agent,
        subscriberCount,
        mrr: subscriberCount * (agent.pricing_usd ?? 0),
      }
    }).sort((a, b) => b.mrr - a.mrr)
  }

  // Calcular MRR total de la plataforma
  const platformMrr = topAgents.reduce((sum, a) => sum + a.mrr, 0)
  const platformArr = platformMrr * 12

  return (
    <div className="space-y-8">
      {/* Título de la página */}
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('platformMrr')}</CardDescription>
            <CardTitle className="text-3xl">${platformMrr.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('platformArr')}</CardDescription>
            <CardTitle className="text-3xl">${platformArr.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('activeSubscriptions')}</CardDescription>
            <CardTitle className="text-3xl">{activeSubscriptions ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabla de agentes por ingresos */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-800">{t('topAgents')}</h2>
        </div>

        <CardContent className="p-0">
          {topAgents.length === 0 ? (
            <p className="px-4 py-8 text-sm text-center text-neutral-500">{t('noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                    <th className="px-4 py-3 font-medium text-neutral-600">{t('colAgent')}</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">{t('colCreator')}</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 text-right">{t('colSubscribers')}</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 text-right">{t('colMrr')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent, idx) => (
                    <tr
                      key={agent.id}
                      className={`border-b border-neutral-50 ${idx % 2 === 1 ? 'bg-neutral-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-neutral-800">{agent.name}</td>
                      <td className="px-4 py-3 text-neutral-600">{agent.creator_name ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-neutral-800">{agent.subscriberCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        ${agent.mrr.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )
}
