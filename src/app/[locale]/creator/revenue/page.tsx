// Página de ingresos del Creator Dashboard — /[locale]/creator/revenue
// Server Component: obtiene datos de Supabase directamente y los pasa al gráfico cliente.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { RevenueChart } from '@/components/creator/revenue-chart'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

// Tipo de suscripción devuelta por Supabase
interface Subscription {
  id: string
  status: string
  created_at: string
}

// Tipo de agente con sus suscripciones
interface AgentWithSubs {
  id: string
  name: string
  pricing_usd: number | null
  subscriptions: Subscription[]
}

// Dato procesado por agente para la tabla de ingresos
interface AgentRevenue {
  id: string
  name: string
  active_subscribers: number
  mrr: number
  total_earned: number
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.revenue' })
  return {
    title: t('metaTitle'),
  }
}

// ── Función: últimos 6 meses de ingresos para el gráfico ──────────────────────

function getLast6Months(agents: AgentWithSubs[]): { month: string; revenue: number }[] {
  const months: { month: string; revenue: number }[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    // Primer día del mes correspondiente
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })

    let revenue = 0

    agents.forEach((agent) => {
      const price = agent.pricing_usd ?? 0
      // Suscripciones activas creadas en este mes específico
      const activeThatMonth = (agent.subscriptions ?? []).filter((s) => {
        const created = new Date(s.created_at)
        return (
          s.status === 'active' &&
          created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth()
        )
      })
      revenue += price * activeThatMonth.length
    })

    months.push({ month: label, revenue })
  }

  return months
}

// ── Página principal ───────────────────────────────────────────────────────────

export default async function CreatorRevenuePage({ params: _params }: Props) {
  // El layout ya garantizó autenticación y role='creator'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const t = await getTranslations('creator.revenue')

  // ── Carga de agentes activos con sus suscripciones ────────────────────────
  const { data: rawAgents } = await supabase
    .from('agents')
    .select('id, name, pricing_usd, subscriptions(id, status, created_at)')
    .eq('creator_id', user!.id)
    .eq('status', 'active')

  const agents: AgentWithSubs[] = (rawAgents ?? []).map((a) => ({
    id: a.id as string,
    name: a.name as string,
    pricing_usd: a.pricing_usd as number | null,
    // Supabase devuelve las relaciones como array o null
    subscriptions: (a.subscriptions as Subscription[] | null) ?? [],
  }))

  // ── Cálculo de ingresos por agente ────────────────────────────────────────
  const agentRevenue: AgentRevenue[] = agents.map((agent) => {
    const price = agent.pricing_usd ?? 0
    const activeSubs = agent.subscriptions.filter((s) => s.status === 'active')
    const allSubs = agent.subscriptions

    return {
      id: agent.id,
      name: agent.name,
      active_subscribers: activeSubs.length,
      mrr: price * activeSubs.length,
      // Total simplificado: todas las suscripciones × precio
      total_earned: price * allSubs.length,
    }
  })

  // ── Datos mensuales para el gráfico (últimos 6 meses) ─────────────────────
  const monthlyData = getLast6Months(agents)

  // Formato monetario: $1,234
  const fmt = (n: number) => `$${n.toLocaleString()}`

  return (
    <div className="space-y-8">
      {/* ── Título de la página ────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        {t('title')}
      </h1>

      {/* ── Sección: Gráfico de ingresos mensuales ────────────────────────── */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-800">
            {t('chart')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* RevenueChart es Client Component — recibe los datos serializados */}
          <RevenueChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* ── Sección: Tabla de ingresos por agente ─────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-800">{t('table')}</h2>

        {agentRevenue.length === 0 ? (
          /* Estado vacío */
          <p className="text-sm text-neutral-500">{t('noData')}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  {/* Columnas de la tabla */}
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t('colAgent')}
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t('colSubscribers')}
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t('colMrr')}
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {t('colTotal')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {agentRevenue.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-neutral-900">
                      {row.name}
                    </td>
                    <td className="px-5 py-4 text-right text-neutral-600">
                      {row.active_subscribers}
                    </td>
                    <td className="px-5 py-4 text-right text-neutral-600">
                      {fmt(row.mrr)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-neutral-900">
                      {fmt(row.total_earned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Sección: Historial de pagos ───────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-800">
          {t('payoutHistory')}
        </h2>

        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6 space-y-4">
            {/* Mensaje de estado vacío — no tenemos datos reales de payouts aún */}
            <p className="text-sm text-neutral-500">{t('noPayouts')}</p>

            {/* Acceso al dashboard de payouts de Stripe Connect Express.
                Usa /api/stripe/connect/login-link, no /api/stripe/portal
                (que es para suscriptores, no para creadores). */}
            <form action="/api/stripe/connect/login-link" method="POST">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {t('managePayouts')}
              </button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
