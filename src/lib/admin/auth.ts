// src/lib/admin/auth.ts
// SOLO SERVIDOR — nunca importar desde componentes con 'use client'.
//
// Helper de autenticación compartido entre todas las API routes del panel de admin.
// Verifica que el usuario esté autenticado Y tenga role='admin'.
//
// Usa el cliente estándar (con sesión de usuario) para verificar la identidad,
// y devuelve también un adminClient (service role) para las operaciones
// que necesitan saltarse RLS.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

// Tipo de retorno del helper
export interface VerifiedAdmin {
  error: string | null;
  status: 401 | 403 | null;
  // Cliente de usuario — para verificar sesión e identidad
  supabase: SupabaseClient;
  // Cliente service role — para operaciones admin sin restricciones de RLS
  adminClient: ReturnType<typeof createAdminClient>;
  user: { id: string; email?: string } | null;
}

/**
 * Verifica que la request tiene una sesión activa y que el usuario
 * tiene role='admin' en la tabla users.
 *
 * Uso:
 *   const { error, status, adminClient, user } = await getVerifiedAdmin()
 *   if (error) return NextResponse.json({ error }, { status: status ?? 401 })
 */
export async function getVerifiedAdmin(): Promise<VerifiedAdmin> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Verificar autenticación via sesión de Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado.", status: 401, supabase, adminClient, user: null };
  }

  // 2. Verificar role='admin' en la tabla users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: "Perfil de usuario no encontrado.",
      status: 403,
      supabase,
      adminClient,
      user: null,
    };
  }

  if (profile.role !== "admin") {
    return {
      error: "Acceso denegado. Se requiere rol de administrador.",
      status: 403,
      supabase,
      adminClient,
      user: null,
    };
  }

  return { error: null, status: null, supabase, adminClient, user };
}
