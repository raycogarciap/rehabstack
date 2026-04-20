// src/app/[locale]/admin/review-queue/page.tsx
// Wrapper de servidor para la página de cola de revisión.
// Obtiene los agentes pendientes y los pasa al Client Component para interactividad.

import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReviewQueueClient } from './review-queue-client'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const t = await getTranslations('admin.reviewQueue')
  return { title: t('metaTitle') }
}

// ─── Tipo de agente en revisión ───────────────────────────────────────────────

export interface ReviewAgent {
  id: string
  name: string
  category: string | null
  creator_name: string | null
  created_at: string
}

// ─── Componente servidor ──────────────────────────────────────────────────────

export default async function ReviewQueuePage() {
  const adminClient = createAdminClient()

  // Obtener agentes con estado 'in_review', ordenados por fecha de envío (más antiguos primero)
  const { data, error } = await adminClient
    .from('agents')
    .select('id, name, category, creator_name, created_at')
    .eq('status', 'in_review')
    .order('created_at', { ascending: true })

  // Si hay error, mostrar estado de error sin crashear la página
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm text-red-600">Error al cargar la cola de revisión. Inténtalo de nuevo.</p>
      </div>
    )
  }

  return <ReviewQueueClient initialAgents={(data as ReviewAgent[]) ?? []} />
}
