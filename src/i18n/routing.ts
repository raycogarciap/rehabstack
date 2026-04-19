// Configuración de routing para next-intl.
// Define los locales soportados y la estrategia de prefijo en la URL.
// localePrefix: 'always' → /en/agents, /es/agents, /ar/agents (siempre visible)

import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './config'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
})
