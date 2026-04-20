// Layout raíz para todas las rutas localizadas (/en/*, /es/*, etc.)
// Responsabilidades:
//   - Validar que el locale de la URL esté soportado (404 si no lo está)
//   - Proveer NextIntlClientProvider con los mensajes del locale activo
//   - En esta fase de migración parcial, <html> y <body> siguen en app/layout.tsx.
//     Cuando TODAS las rutas estén migradas a [locale], mover html/body aquí
//     para poder setear lang={locale} y dir={rtlLocales.includes(locale) ? 'rtl' : 'ltr'}.

import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { AssistantProvider } from '@/components/assistant/assistant-provider'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Rechaza locales no soportados (ej. /xx/... → 404)
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // getMessages() lee los mensajes del locale activo desde request.ts
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      {/* Asistente IA flotante — aparece en todas las páginas públicas.
          AssistantProvider se excluye automáticamente en /dashboard, /admin, /creator, /workspace */}
      <AssistantProvider />
    </NextIntlClientProvider>
  )
}
