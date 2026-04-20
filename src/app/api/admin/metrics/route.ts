// src/app/api/admin/metrics/route.ts
// Ruta GET para obtener métricas globales de la plataforma RehabStack.
// Solo accesible por administradores verificados mediante getVerifiedAdmin().

import { NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/admin/auth";

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Estructura de un evento de actividad reciente
interface ActivityEvent {
  id: string;
  type: "agent_submitted" | "agent_approved" | "user_joined";
  description: string;
  created_at: string;
}

// Respuesta completa de métricas
interface MetricsResponse {
  totalUsers: number;
  totalCreators: number;
  totalAgents: number;
  activeAgents: number;
  pendingReview: number;
  platformMrr: number;
  recentActivity: ActivityEvent[];
}

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // 1. Verificar que el solicitante es un administrador válido
    const { error, status, adminClient } = await getVerifiedAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    // 2. Ejecutar todas las consultas de conteo en paralelo para mayor eficiencia
    const [
      totalUsersResult,
      totalCreatorsResult,
      totalAgentsResult,
      activeAgentsResult,
      pendingReviewResult,
      activeSubscriptionsResult,
    ] = await Promise.all([
      // Conteo total de usuarios registrados
      adminClient
        .from("users")
        .select("count", { count: "exact", head: true }),

      // Conteo de usuarios con rol 'creator'
      adminClient
        .from("users")
        .select("count", { count: "exact", head: true })
        .eq("role", "creator"),

      // Conteo total de agentes en la plataforma
      adminClient
        .from("agents")
        .select("count", { count: "exact", head: true }),

      // Conteo de agentes con estado 'active'
      adminClient
        .from("agents")
        .select("count", { count: "exact", head: true })
        .eq("status", "active"),

      // Conteo de agentes pendientes de revisión
      adminClient
        .from("agents")
        .select("count", { count: "exact", head: true })
        .eq("status", "in_review"),

      // Conteo de suscripciones activas (para calcular MRR aproximado)
      adminClient
        .from("subscriptions")
        .select("count", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

    // 3. Extraer los valores de conteo (Supabase devuelve null si hay error; usar 0 como fallback)
    const totalUsers = totalUsersResult.count ?? 0;
    const totalCreators = totalCreatorsResult.count ?? 0;
    const totalAgents = totalAgentsResult.count ?? 0;
    const activeAgents = activeAgentsResult.count ?? 0;
    const pendingReview = pendingReviewResult.count ?? 0;
    const activeSubscriptions = activeSubscriptionsResult.count ?? 0;

    // 4. Calcular MRR aproximado: suscripciones activas × $50 (precio promedio estimado)
    const platformMrr = activeSubscriptions * 50;

    // 5. Obtener actividad reciente: últimos 10 agentes en revisión y últimos 10 usuarios
    const [recentAgentsResult, recentUsersResult] = await Promise.all([
      adminClient
        .from("agents")
        .select("id, name, created_at")
        .eq("status", "in_review")
        .order("created_at", { ascending: false })
        .limit(10),

      adminClient
        .from("users")
        .select("id, email, name, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // 6. Mapear agentes a eventos de actividad tipo 'agent_submitted'
    const agentEvents: ActivityEvent[] = (recentAgentsResult.data ?? []).map(
      (agent) => ({
        id: agent.id,
        type: "agent_submitted" as const,
        description: `Agente "${agent.name}" enviado para revisión`,
        created_at: agent.created_at,
      })
    );

    // 7. Mapear usuarios a eventos de actividad tipo 'user_joined'
    const userEvents: ActivityEvent[] = (recentUsersResult.data ?? []).map(
      (user) => ({
        id: user.id,
        type: "user_joined" as const,
        description: `Nuevo usuario registrado: ${user.name ?? user.email ?? "Sin nombre"}`,
        created_at: user.created_at,
      })
    );

    // 8. Combinar, ordenar por fecha descendente y tomar los 10 más recientes
    const recentActivity: ActivityEvent[] = [...agentEvents, ...userEvents]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);

    // 9. Construir y devolver la respuesta final
    const response: MetricsResponse = {
      totalUsers,
      totalCreators,
      totalAgents,
      activeAgents,
      pendingReview,
      platformMrr,
      recentActivity,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    // Error inesperado del servidor
    console.error("[admin/metrics] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener métricas." },
      { status: 500 }
    );
  }
}
