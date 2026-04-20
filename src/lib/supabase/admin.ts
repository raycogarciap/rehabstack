// src/lib/supabase/admin.ts
// Cliente Supabase con rol de servicio — SOLO SERVIDOR.
//
// Usa SUPABASE_SERVICE_ROLE_KEY para saltarse RLS completamente.
// Exclusivo para operaciones de admin que necesitan acceso irrestricto.
//
// NUNCA importar desde componentes cliente ni rutas accesibles por el público.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Crea un cliente Supabase con la service role key (bypasa RLS).
// Llamar una vez por request — no cachear entre requests.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      // Deshabilitar persistencia de sesión — este cliente es stateless (server-only)
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
