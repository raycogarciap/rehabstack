// src/lib/creator/auth.ts
// SOLO SERVIDOR — nunca importar desde componentes con 'use client'.
//
// Helpers de autenticación y autorización compartidos entre las API routes
// del Creator Dashboard. Centralizar aquí evita duplicar la misma lógica
// en cada route y garantiza que cualquier cambio en la política de acceso
// se propague a todos los endpoints automáticamente.

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Tipo de retorno base para helpers de verificación
interface VerifiedCreator {
  error: string | null;
  status: 401 | 403 | null;
  supabase: SupabaseClient;
  user: { id: string; email?: string } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface VerifiedCreatorAndAgent extends Omit<VerifiedCreator, "status"> {
  status: 401 | 403 | 404 | null;
  // any preserva la tipificación implícita de Supabase para queries sin tipo DB explícito
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent: any | null;
}

/**
 * Verifica que la request tiene una sesión activa y que el usuario
 * tiene rol 'creator' en la tabla users.
 *
 * Uso:
 *   const { error, status, supabase, user } = await getVerifiedCreator()
 *   if (error || !user) return NextResponse.json({ error }, { status: status ?? 401 })
 */
export async function getVerifiedCreator(): Promise<VerifiedCreator> {
  const supabase = await createClient();

  // 1. Verificar autenticación via sesión de Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado.", status: 401, supabase, user: null };
  }

  // 2. Verificar rol en la tabla users
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
      user: null,
    };
  }

  if (profile.role !== "creator") {
    return {
      error: "Acceso denegado. Se requiere rol de creador.",
      status: 403,
      supabase,
      user: null,
    };
  }

  return { error: null, status: null, supabase, user };
}

/**
 * Verifica autenticación, rol de creador, y que el agente `agentId`
 * pertenece al usuario autenticado (ownership check).
 *
 * Uso:
 *   const { error, status, supabase, user, agent } = await getVerifiedCreatorAndAgent(id)
 *   if (error || !agent) return NextResponse.json({ error }, { status: status ?? 404 })
 */
export async function getVerifiedCreatorAndAgent(
  agentId: string
): Promise<VerifiedCreatorAndAgent> {
  const base = await getVerifiedCreator();

  if (base.error || !base.user) {
    return { ...base, agent: null };
  }

  const { supabase, user } = base;

  // 3. Verificar que el agente existe y pertenece al creador autenticado
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("creator_id", user.id)
    .single();

  if (agentError || !agent) {
    return {
      error: "Agente no encontrado.",
      status: 404,
      supabase,
      user,
      agent: null,
    };
  }

  return { error: null, status: null, supabase, user, agent };
}
