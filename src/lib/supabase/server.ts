// Cliente de Supabase para Server Components, Server Actions y API Routes.
// Usa createServerClient de @supabase/ssr con acceso a las cookies del request
// a través de next/headers, que solo está disponible en el servidor.
// Nunca importar este archivo en componentes con "use client".

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Crea y exporta una función async que devuelve el cliente del servidor.
// Debe ser async porque cookies() de next/headers es una función asíncrona
// a partir de Next.js 15.
export async function createClient() {
  // Obtiene el almacén de cookies del request actual
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lee todas las cookies del request
        getAll() {
          return cookieStore.getAll();
        },
        // Escribe cookies en la respuesta (p.ej. al refrescar el token)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll puede fallar en Server Components de solo lectura.
            // Si el middleware está configurado correctamente, la sesión
            // ya fue refrescada antes de llegar aquí, así que es seguro ignorar.
          }
        },
      },
    }
  );
}
