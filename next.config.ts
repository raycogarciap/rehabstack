// next.config.ts
// El plugin createNextIntlPlugin conecta next-intl con el compilador de Next.js.
// Le indica a Next.js dónde encontrar la configuración server-side de i18n (request.ts).

import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Apunta al archivo que exporta getRequestConfig (carga de mensajes + resolución de locale)
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  /* config options here */
}

export default withNextIntl(nextConfig)
