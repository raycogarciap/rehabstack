// API Route: /api/auth/callback
// Maneja el callback de autenticación de Supabase para:
//   - Confirmación de email (registro)
//   - Magic link (login sin contraseña)
//   - OAuth (Google, GitHub, etc. — si se habilita en el futuro)
//
// Supabase redirige aquí con un "code" en la query string.
// Este handler intercambia el code por una sesión activa y redirige al usuario.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // El code de un solo uso que Supabase incluye en el enlace de confirmación
  const code = searchParams.get("code");

  // Ruta a la que redirigir tras el login exitoso (por defecto: /dashboard)
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Intercambia el code por tokens de sesión y los guarda en las cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Construye la URL de redirección asegurando que sea del mismo origen
      // para evitar open redirects
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Si no hay code o el intercambio falló, redirige al login con error
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set(
    "error",
    "Authentication failed. The link may have expired."
  );
  return NextResponse.redirect(errorUrl);
}
