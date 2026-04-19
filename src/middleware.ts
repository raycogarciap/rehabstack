// Middleware de Next.js — Edge Runtime.
// Combina next-intl (locale routing) con Supabase (auth).
//
// Todas las páginas públicas y privadas están migradas a [locale].
// El middleware aplica locale routing a todas las rutas no-API.

import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Rutas de API ─────────────────────────────────────────────────────────
  // Sin locale prefix — solo Supabase session refresh
  if (pathname.startsWith('/api/')) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── 2. Todas las demás rutas — locale routing + Supabase ────────────────────
  const intlResponse = intlMiddleware(request)

  // Redirect de locale (ej. / → /en/) → devolver inmediatamente
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse
  }

  // Refrescar sesión de Supabase
  const { supabaseResponse, user } = await updateSession(request)

  // Auth protection para rutas protegidas (/dashboard, /admin)
  const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/)
  const locale = localeMatch?.[1] ?? routing.defaultLocale
  const pathAfterLocale = localeMatch
    ? pathname.slice(localeMatch[1].length + 1)
    : pathname

  const isProtected =
    pathAfterLocale.startsWith('dashboard') ||
    pathAfterLocale.startsWith('admin') ||
    pathAfterLocale.startsWith('creator')

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Exponer el pathname a los Server Components vía header.
  // Usado por el creator layout para detectar /creator/onboarding y evitar
  // el redirect de role en esa ruta específica (el onboarding es donde el
  // usuario OBTIENE el role de creator, por lo que no puede exigírselo antes).
  supabaseResponse.headers.set('x-pathname', pathname)

  // Propagar headers de next-intl a la respuesta de Supabase
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value)
  })

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
