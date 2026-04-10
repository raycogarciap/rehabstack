// Cliente de Supabase para Client Components (se ejecuta en el navegador).
// Usa createBrowserClient de @supabase/ssr, que gestiona automáticamente
// las cookies de sesión en el lado del cliente.
// Solo importar este archivo en componentes con "use client".

import { createBrowserClient } from "@supabase/ssr";

// Crea y exporta una función que devuelve el cliente del navegador.
// Se usa como función (no instancia global) para que cada componente
// obtenga un cliente fresco y evitar problemas con SSR.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
