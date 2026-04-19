// Página de configuración del creador — /[locale]/creator/settings
// Server Component: obtiene los datos del perfil del usuario desde Supabase
// y los pasa al Client Component CreatorSettingsForm para su edición.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { CreatorSettingsForm } from '@/components/creator/creator-settings-form'

// ── Props de la página ────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

// ── Metadata dinámica ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.settings' })
  return { title: t('metaTitle') }
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function CreatorSettingsPage({ params }: Props) {
  // Esperamos los parámetros de la URL (requisito de Next.js 15)
  await params

  // ── Obtener datos del usuario desde Supabase ─────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // El layout ya garantiza autenticación; verificación defensiva
  if (!user) return null

  // Consultar el perfil del creador con los campos necesarios
  // Nota: stripe_connect_id puede ser null si aún no ha conectado Stripe
  const { data: profile } = await supabase
    .from('users')
    .select('name, email, stripe_connect_id')
    .eq('id', user.id)
    .single()

  // ── Traducciones ─────────────────────────────────────────────────────────
  const t = await getTranslations('creator.settings')

  return (
    <div>
      {/* ── Encabezado de la página ─────────────────────────────────────── */}
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-neutral-900">
        {t('title')}
      </h1>

      {/* ── Formulario interactivo del cliente ──────────────────────────── */}
      {/* Pasamos los datos iniciales como props al Client Component */}
      {/* userId ya no se pasa — el server route valida la identidad desde la sesión */}
      <CreatorSettingsForm
        initialName={profile?.name ?? ''}
        initialEmail={profile?.email ?? user.email ?? ''}
        stripeConnectId={profile?.stripe_connect_id ?? null}
      />
    </div>
  )
}
