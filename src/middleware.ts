// Middleware de Next.js — se ejecuta en el Edge Runtime antes de cada request.
// Responsabilidades:
//   1. Refrescar la sesión de Supabase en cada request (mantiene el token vivo)
//   2. Proteger rutas /dashboard/* — redirige a /login si no hay sesión
//   3. Proteger rutas /admin/*    — redirige a /login si no hay sesión
//   4. Permitir acceso público al resto de rutas

import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Refresca la sesión y obtiene el usuario actual (null si no está autenticado)
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Rutas protegidas: /dashboard/* y /admin/*
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  // Si la ruta está protegida y no hay usuario autenticado, redirige a /login
  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";

    // Guarda la ruta original para redirigir de vuelta tras el login
    loginUrl.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Para todas las demás rutas, devuelve la respuesta con la sesión actualizada
  return supabaseResponse;
}

// Configuración del matcher: el middleware se ejecuta en todas las rutas
// EXCEPTO los assets estáticos de Next.js y el favicon, que no necesitan sesión.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
