// Captura todas las rutas no implementadas del workspace (Work, Channels, etc.)
// Muestra un placeholder "Coming soon" con el nombre de la sección.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ locale: string; id: string; section: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  return { title: `${t('comingSoon')} | RehabStack` }
}

export default async function SectionPlaceholderPage({ params }: Props) {
  const { section } = await params
  const t = await getTranslations('common')

  // Obtiene el nombre de la sección de la URL (ej. ["work"] → "Work")
  const sectionName = (section[0] ?? '').replace(/-/g, ' ')
  const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('comingSoon')}</p>
      </div>
    </div>
  )
}
