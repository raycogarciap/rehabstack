// src/app/[locale]/admin/users/page.tsx
// Wrapper de servidor para la página de gestión de usuarios.
// Exporta generateMetadata y renderiza el Client Component interactivo.

import { getTranslations } from 'next-intl/server'
import { UsersAdminPage } from './users-admin-client'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const t = await getTranslations('admin.users')
  return { title: t('metaTitle') }
}

// ─── Componente servidor (thin wrapper) ──────────────────────────────────────

export default function Page() {
  return <UsersAdminPage />
}
