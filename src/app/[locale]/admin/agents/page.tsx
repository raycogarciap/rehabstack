// src/app/[locale]/admin/agents/page.tsx
// Wrapper de servidor para la página de gestión de agentes.
// Exporta generateMetadata y renderiza el Client Component interactivo.

import { getTranslations } from 'next-intl/server'
import { AgentsAdminPage } from './agents-admin-client'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const t = await getTranslations('admin.agents')
  return { title: t('metaTitle') }
}

// ─── Componente servidor (thin wrapper) ──────────────────────────────────────

export default function Page() {
  return <AgentsAdminPage />
}
