// Middleware de Next.js — se ejecuta en el Edge Runtime antes de cada request.
// Responsabilidades:
//   1. Detectar el locale del usuario desde Accept-Language y redirigir a /[locale]/...
//   2. Refrescar la sesión de Supabase en cada request (mantiene el token vivo)
//   3. Proteger rutas /[locale]/dashboard/* y /[locale]/admin/* (requieren auth)
//   4. Excluir rutas /api/* del locale routing (sin prefijo de locale en la API)

import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

// Middleware de next-intl: maneja detección de locale y redirecciones de URL
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rutas de API: solo refrescar sesión de Supabase, sin locale routing ──────
  // Las rutas /api/* no deben tener prefijo de locale
  if (pathname.startsWith('/api/')) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // ── Paso 1: next-intl detecta el locale y redirige si es necesario ───────────
  // Ejemplo: / → /en/, /agents → /en/agents, /es/agents → /es/agents (sin cambio)
  const intlResponse = intlMiddleware(request)

  // Si next-intl emite un redirect (normalización de locale), lo retornamos inmediatamente.
  // No tiene sentido verificar auth en un redirect de locale.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse
  }

  // ── Paso 2: Supabase refresca la sesión del usuario ──────────────────────────
  const { supabaseResponse, user } = await updateSession(request)

  // ── Paso 3: Proteger rutas que requieren autenticación ───────────────────────
  // Detecta el locale actual del pathname: /en/dashboard → locale='en', path='/dashboard'
  const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(\/|$)/)
  const locale = localeMatch?.[1] ?? routing.defaultLocale
  const pathAfterLocale = localeMatch
    ? pathname.slice(localeMatch[1].length + 1) // quita '/{locale}'
    : pathname

  const isProtectedRoute =
    pathAfterLocale.startsWith('/dashboard') ||
    pathAfterLocale.startsWith('/admin')

  // Si la ruta está protegida y no hay usuario autenticado → redirigir al login del locale
  if (isProtectedRoute && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    // Guarda la ruta original para redirigir de vuelta tras el login exitoso
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Paso 4: Propagar headers de next-intl a la respuesta de Supabase ─────────
  // next-intl setea headers internos (x-next-intl-locale) que los Server Components necesitan.
  // Deben estar presentes en la respuesta final (supabaseResponse).
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value)
  })

  return supabaseResponse
}

// Matcher: el middleware se ejecuta en todas las rutas EXCEPTO
// assets estáticos de Next.js y archivos de imagen/fuente/icono.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
