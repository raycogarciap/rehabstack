// Middleware de Next.js — Edge Runtime.
// Combina next-intl (locale routing) con Supabase (auth).
//
// MIGRACIÓN PARCIAL — estado actual:
//   ✅ Migradas a [locale]: login, register, pricing, agents
//   ⏳ Pendientes:          dashboard, workspace, admin
//
// Las rutas pendientes utilizan el bloque UNMIGRATED para evitar 404
// hasta que sean movidas al directorio [locale] en el siguiente paso.

import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

// Rutas de página aún NO migradas a la estructura [locale].
// Mientras esté aquí, el locale routing NO se aplica a estas rutas.
// Eliminar cada entrada al migrar la ruta correspondiente.
const UNMIGRATED = ['/dashboard', '/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Rutas de API ─────────────────────────────────────────────────────────
  // Sin locale prefix — Supabase session refresh únicamente
  if (pathname.startsWith('/api/')) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── 2. Limpieza temporal: /{locale}/dashboard → /dashboard ──────────────────
  // Cuando el usuario llega a /en/dashboard (p. ej. por un Link locale-aware),
  // lo redirigimos a /dashboard hasta que esa ruta esté migrada.
  const localePrefixForUnmigrated = pathname.match(
    /^\/([a-z]{2}(?:-[A-Z]{2})?)(\/(?:dashboard|admin)(\/|$))/
  )
  if (localePrefixForUnmigrated) {
    const pathWithoutLocale = pathname.slice(localePrefixForUnmigrated[1].length + 1)
    return NextResponse.redirect(new URL(pathWithoutLocale, request.url))
  }

  // ── 3. Rutas no migradas (/dashboard, /admin) ────────────────────────────────
  // Solo auth protection + Supabase session, sin locale routing
  if (UNMIGRATED.some((p) => pathname.startsWith(p))) {
    const { supabaseResponse, user } = await updateSession(request)
    if (!user) {
      // Redirige al login de la UI en inglés (o el locale por defecto)
      const loginUrl = new URL('/en/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  // ── 4. Rutas migradas: locale routing + Supabase ─────────────────────────────
  const intlResponse = intlMiddleware(request)

  // Redirect de locale (ej. / → /en/) → devolver inmediatamente
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse
  }

  // Refrescar sesión de Supabase
  const { supabaseResponse, user } = await updateSession(request)

  // Auth protection para rutas locale-prefixed (cuando se migren dashboard/admin)
  const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/)
  const locale = localeMatch?.[1] ?? routing.defaultLocale
  const pathAfterLocale = localeMatch
    ? pathname.slice(localeMatch[1].length + 1)
    : pathname

  const isProtected =
    pathAfterLocale.startsWith('/dashboard') ||
    pathAfterLocale.startsWith('/admin')

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Propagar headers de next-intl (x-next-intl-locale, etc.) a la respuesta de Supabase
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
