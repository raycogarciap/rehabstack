// Layout compartido para /[locale]/login y /[locale]/register.
// Centra el contenido con logo, tagline traducido y selector de idioma.

import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/locale-switcher'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations('nav')

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Selector de idioma en la esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      {/* Logo y tagline */}
      <div className="mb-8 text-center">
        <span className="text-3xl font-bold tracking-tight text-neutral-900">
          Rehab<span className="text-blue-600">Stack</span>
        </span>
        <p className="mt-1 text-sm text-neutral-500">{t('tagline')}</p>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
