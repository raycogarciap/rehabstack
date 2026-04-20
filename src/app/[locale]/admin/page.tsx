// src/app/[locale]/admin/page.tsx
// Página de resumen del panel de administración — Server Component.
// Obtiene métricas clave directamente desde Supabase usando el cliente admin.

import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const t = await getTranslations('admin.overview')
  return { title: t('metaTitle') }
}

// ─── Tipos de actividad reciente ─────────────────────────────────────────────

interface ActivityItem {
  type: 'agent' | 'user'
  description: string
  date: string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default async function AdminOverviewPage() {
  const t = await getTranslations('admin.overview')
  const adminClient = createAdminClient()

  // Obtener todas las métricas en paralelo para mejor rendimiento
  const [
    { count: totalUsers },
    { count: totalCreators },
    { count: totalAgents },
    { count: activeAgents },
    { count: pendingReview },
    { count: activeSubscriptions },
    { data: recentAgents },
    { data: recentUsers },
  ] = await Promise.all([
    // Conteo total de usuarios
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    // Conteo de creadores
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
    // Conteo total de agentes
    adminClient.from('agents').select('*', { count: 'exact', head: true }),
    // Conteo de agentes activos
    adminClient.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    // Agentes pendientes de revisión
    adminClient.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
    // Suscripciones activas (para calcular MRR estimado)
    adminClient.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    // Últimos 5 agentes enviados para revisión
    adminClient
      .from('agents')
      .select('id, name, created_at')
      .eq('status', 'in_review')
      .order('created_at', { ascending: false })
      .limit(5),
    // Últimos 5 usuarios registrados
    adminClient
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // MRR estimado: suscripciones activas × $50 USD (valor placeholder)
  const platformMrr = (activeSubscriptions ?? 0) * 50

  // Combinar y ordenar actividad reciente (agentes + usuarios)
  const activityItems: ActivityItem[] = [
    ...(recentAgents ?? []).map((a: { id: string; name: string; created_at: string }) => ({
      type: 'agent' as const,
      description: `Nuevo agente en revisión: ${a.name}`,
      date: a.created_at,
    })),
    ...(recentUsers ?? []).map((u: { id: string; email: string; name: string | null; created_at: string }) => ({
      type: 'user' as const,
      description: `Nuevo usuario: ${u.name ?? u.email}`,
      date: u.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  // Tarjetas de métricas con sus valores
  const metrics = [
    { label: t('totalUsers'), value: totalUsers ?? 0 },
    { label: t('totalCreators'), value: totalCreators ?? 0 },
    { label: t('totalAgents'), value: totalAgents ?? 0 },
    { label: t('activeAgents'), value: activeAgents ?? 0 },
    { label: t('pendingReview'), value: pendingReview ?? 0 },
    { label: t('platformMrr'), value: `$${platformMrr.toLocaleString()}` },
  ]

  return (
    <div className="space-y-8">
      {/* Título de la página */}
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {/* Cuadrícula de tarjetas de métricas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Sección de actividad reciente */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">{t('recentActivity')}</h2>
        {activityItems.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('noActivity')}</p>
        ) : (
          <div className="space-y-2 rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {activityItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-b-0"
              >
                {/* Icono de tipo + descripción */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
                      item.type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                  />
                  <span className="text-sm text-neutral-700">{item.description}</span>
                </div>
                {/* Fecha relativa */}
                <span className="text-xs text-neutral-400 whitespace-nowrap ml-4">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
