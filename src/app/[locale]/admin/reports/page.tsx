// src/app/[locale]/admin/reports/page.tsx
// Página de reportes del panel admin — Server Component.
// Muestra agentes marcados (needs_changes) y métricas de salud del sistema.
// El botón de exportación CSV es un Client Component aislado.

import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ExportCsvButton } from './reports-client'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const t = await getTranslations('admin.reports')
  return { title: t('metaTitle') }
}

// ─── Tipo de agente marcado ───────────────────────────────────────────────────

interface FlaggedAgent {
  id: string
  name: string
  creator_name: string | null
  status: string
  review_notes: string | null
  created_at: string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default async function AdminReportsPage() {
  const t = await getTranslations('admin.reports')
  const adminClient = createAdminClient()

  // Obtener métricas de salud del sistema y agentes marcados en paralelo
  const [
    { count: totalUsers },
    { count: totalAgents },
    { count: activeAgents },
    { count: pendingReview },
    { count: activeSubscriptions },
    { data: flaggedAgents, error: flaggedError },
  ] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    adminClient.from('agents').select('*', { count: 'exact', head: true }),
    adminClient.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
    adminClient.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    // Agentes que necesitan cambios (tratados como "marcados" para revisión)
    adminClient
      .from('agents')
      .select('id, name, creator_name, status, review_notes, created_at')
      .eq('status', 'needs_changes')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Revenue total estimado (MRR × 12 = ARR)
  const totalRevenue = (activeSubscriptions ?? 0) * 50 * 12

  // Métricas del sistema para el card de salud
  const healthMetrics = [
    { label: t('totalUsers'), value: totalUsers ?? 0 },
    { label: t('totalAgents'), value: totalAgents ?? 0 },
    { label: t('activeAgents'), value: activeAgents ?? 0 },
    { label: t('pendingReview'), value: pendingReview ?? 0 },
    { label: t('totalRevenue'), value: `$${totalRevenue.toLocaleString()} ARR` },
  ]

  const safeAgents = (flaggedAgents as FlaggedAgent[]) ?? []

  return (
    <div className="space-y-8">
      {/* Título */}
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {/* Card de salud del sistema */}
      <Card>
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-base">{t('systemHealth')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {healthMetrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-2xl font-bold text-neutral-800">{metric.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{metric.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sección de agentes marcados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">{t('flaggedAgents')}</h2>
          {/* Botón de exportación CSV — Client Component */}
          <ExportCsvButton agents={safeAgents} />
        </div>

        {flaggedError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm text-red-600">Error al cargar los agentes marcados.</p>
          </div>
        ) : safeAgents.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-neutral-500">{t('noFlagged')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                    <th className="px-4 py-3 font-medium text-neutral-600">{t('colAgent')}</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">{t('colReason')}</th>
                    <th className="px-4 py-3 font-medium text-neutral-600">{t('colFlagged')}</th>
                  </tr>
                </thead>
                <tbody>
                  {safeAgents.map((agent) => (
                    <tr key={agent.id} className="border-b border-neutral-50 last:border-b-0">
                      {/* Nombre del agente + creador */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{agent.name}</div>
                        {agent.creator_name && (
                          <div className="text-xs text-neutral-400 mt-0.5">{agent.creator_name}</div>
                        )}
                      </td>

                      {/* Notas de revisión (razón del marcado) */}
                      <td className="px-4 py-3 text-neutral-600 max-w-xs">
                        <p className="text-xs line-clamp-2">
                          {agent.review_notes ?? '—'}
                        </p>
                      </td>

                      {/* Fecha de marcado */}
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
