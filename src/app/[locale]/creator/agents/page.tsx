// Página de listado de agentes del creador — /[locale]/creator/agents
// Server Component protegido por el layout del creator (auth + rol verificados).
// Muestra una tabla con todos los agentes del creador, incluyendo estado,
// suscriptores activos, MRR calculado y calificación promedio.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { AgentStatusToggle } from '@/components/creator/agent-status-toggle'

// ── Tipos internos ────────────────────────────────────────────────────────────

// Fila de suscripción asociada a un agente
interface SubscriptionRow {
  id: string
  status: string
}

// Reseña asociada a un agente (solo el campo rating)
interface ReviewRow {
  rating: number
}

// Agente tal como lo devuelve Supabase con las relaciones anidadas
interface AgentRow {
  id: string
  name: string
  slug: string | null
  status: string
  pricing_usd: number | null
  category: string | null
  subscriptions: SubscriptionRow[]
  reviews: ReviewRow[]
}

// ── Props de la página ────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

// ── Metadata dinámica ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.agents' })
  return { title: t('metaTitle') }
}

// ── Colores del badge según estado del agente ─────────────────────────────────

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  paused:    'bg-orange-100 text-orange-700',
  delisted:  'bg-red-100 text-red-700',
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────

// Cuenta sólo las suscripciones con estado 'active'
function countActiveSubscribers(subscriptions: SubscriptionRow[]): number {
  return subscriptions.filter((s) => s.status === 'active').length
}

// Calcula el MRR: precio mensual × suscriptores activos
function calcMRR(pricingUsd: number | null, activeSubscribers: number): string {
  const price = pricingUsd ?? 0
  return `$${(price * activeSubscribers).toFixed(0)}`
}

// Calcula el rating promedio de las reseñas, o "—" si no hay reseñas
function calcAvgRating(reviews: ReviewRow[]): string {
  if (!reviews || reviews.length === 0) return '—'
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return (sum / reviews.length).toFixed(1)
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function CreatorAgentsPage({ params }: Props) {
  // Esperar los parámetros de la URL (requisito de Next.js 15)
  await params

  // ── Obtener datos de Supabase ────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // El layout ya garantiza que el usuario está autenticado y tiene rol 'creator',
  // pero hacemos la verificación defensiva igual
  if (!user) return null

  // Consultar los agentes del creador con suscripciones y reseñas relacionadas
  const { data: agents } = await supabase
    .from('agents')
    .select(`
      id, name, slug, status, pricing_usd, category,
      subscriptions(id, status),
      reviews(rating)
    `)
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  // ── Traducciones ─────────────────────────────────────────────────────────
  const t = await getTranslations('creator.agents')

  const agentList = (agents as AgentRow[] | null) ?? []

  return (
    <div>
      {/* ── Encabezado de la página ─────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {t('title')}
        </h1>
        {/* Botón para crear un nuevo agente */}
        <Link href="/creator/agents/new">
          <Button size="sm">
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {/* ── Tabla de agentes (si existen) ──────────────────────────────── */}
      {agentList.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200">
            {/* Cabecera de la tabla */}
            <thead className="bg-neutral-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('colName')}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('colStatus')}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('colSubscribers')}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('colRevenue')}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('colRating')}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {t('colActions')}
                </th>
              </tr>
            </thead>

            {/* Filas de agentes */}
            <tbody className="bg-white divide-y divide-neutral-200">
              {agentList.map((agent) => {
                const activeSubscribers = countActiveSubscribers(agent.subscriptions)
                const mrr             = calcMRR(agent.pricing_usd, activeSubscribers)
                const avgRating       = calcAvgRating(agent.reviews)
                const badgeClass      = STATUS_BADGE_CLASSES[agent.status] ?? 'bg-gray-100 text-gray-700'

                return (
                  <tr key={agent.id} className="hover:bg-neutral-50 transition-colors">
                    {/* Nombre del agente */}
                    <td className="py-4 px-4 text-sm font-medium text-neutral-900">
                      {agent.name}
                    </td>

                    {/* Badge de estado con color según el valor */}
                    <td className="py-4 px-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                        {agent.status}
                      </span>
                    </td>

                    {/* Cantidad de suscriptores activos */}
                    <td className="py-4 px-4 text-sm text-neutral-700">
                      {activeSubscribers}
                    </td>

                    {/* Ingreso mensual recurrente (MRR) */}
                    <td className="py-4 px-4 text-sm text-neutral-700">
                      {mrr}
                    </td>

                    {/* Calificación promedio o guión si no hay reseñas */}
                    <td className="py-4 px-4 text-sm text-neutral-700">
                      {avgRating}
                    </td>

                    {/* Acciones por fila */}
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Editar agente */}
                        <Link href={`/creator/agents/${agent.id}/edit`}>
                          <Button variant="outline" size="sm">
                            {t('actionEdit')}
                          </Button>
                        </Link>

                        {/* Pausar / Activar — componente cliente con estado de carga */}
                        <AgentStatusToggle
                          agentId={agent.id}
                          currentStatus={agent.status}
                          labelPause={t('actionPause')}
                          labelActivate={t('actionActivate')}
                        />

                        {/* Ver listado público del agente en el marketplace */}
                        {agent.slug && agent.category && (
                          <Link href={`/agents/${agent.category}/${agent.slug}`}>
                            <Button variant="ghost" size="sm">
                              {t('actionView')}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Estado vacío ─────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white py-20 text-center">
          {/* Icono decorativo */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <svg
              className="h-7 w-7 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="mb-1 text-lg font-semibold text-neutral-900">
            {t('empty')}
          </h2>
          <p className="mb-6 text-sm text-neutral-500 max-w-xs">
            {t('emptyDesc')}
          </p>

          {/* Enlace para crear el primer agente */}
          <Link href="/creator/agents/new">
            <Button>{t('addNew')}</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
