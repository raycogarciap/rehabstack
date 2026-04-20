'use client'

// Proveedor del asistente IA para páginas públicas.
// Renderiza el ChatWidget solo en rutas públicas — excluye:
//   /dashboard/*, /admin/*, /creator/*, /workspace/*
// Usa usePathname de @/i18n/navigation para obtener la ruta sin prefijo de locale.
// El locale se obtiene de useLocale() de next-intl.

import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import ChatWidget from './chat-widget'

// Rutas donde el asistente NO debe aparecer (segmentos sin locale prefix)
const EXCLUDED_PREFIXES = ['/dashboard', '/admin', '/creator', '/workspace']

export function AssistantProvider() {
  const locale = useLocale()
  const pathname = usePathname()

  // usePathname de @/i18n/navigation devuelve la ruta SIN prefijo de locale.
  // Verificar si la ruta actual empieza con alguno de los prefijos excluidos.
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // No renderizar el widget en rutas de dashboard, admin, creator o workspace
  if (isExcluded) return null

  return <ChatWidget locale={locale} />
}
