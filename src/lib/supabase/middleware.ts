// Helper de Supabase para el middleware de Next.js.
// Refresca la sesión del usuario en cada request interceptado,
// propagando los tokens actualizados tanto en el request como en la respuesta.
// Esto es necesario para que los Server Components lean siempre una sesión fresca.

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Recibe el request de Next.js y devuelve el response actualizado con la sesión
// y el objeto user de Supabase para que el middleware principal tome decisiones.
export async function updateSession(request: NextRequest) {
  // Crea una respuesta mutable que se irá enriqueciendo con las cookies de sesión
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lee todas las cookies del request entrante
        getAll() {
          return request.cookies.getAll();
        },
        // Escribe las cookies actualizadas tanto en el request como en la respuesta.
        // Es fundamental escribir en ambos lados para que los Server Components
        // posteriores lean el token ya refrescado.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Recrea la respuesta con el request actualizado antes de añadir cookies
          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE: getUser() refresca el token si está por expirar.
  // No usar getSession() aquí — getUser() valida el token contra el servidor de Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
