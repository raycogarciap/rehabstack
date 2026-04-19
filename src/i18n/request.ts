// Configuración server-side de next-intl.
// Se ejecuta en cada request del servidor para determinar el locale activo
// y cargar los mensajes correspondientes desde src/messages/[locale].json.
// La ruta a este archivo se registra en next.config.ts con createNextIntlPlugin.

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale viene del segmento [locale] de la URL (via middleware)
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    // Carga dinámica del JSON del locale — solo se importa el archivo necesario
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
