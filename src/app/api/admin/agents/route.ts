// src/app/api/admin/agents/route.ts
// Ruta GET para listar y paginar agentes con filtros opcionales.
// Solo accesible por administradores verificados mediante getVerifiedAdmin().

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAdmin } from "@/lib/admin/auth";

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Estructura de un agente en la respuesta (incluye conteo de suscriptores activos)
interface AgentWithSubscribers {
  id: string;
  name: string;
  short_description: string | null;
  category: string | null;
  status: string;
  creator_id: string | null;
  creator_name: string | null;
  pricing_usd: number | null;
  hosting_type: string | null;
  review_notes: string | null;
  created_at: string;
  subscriberCount: number;
}

// Respuesta paginada
interface AgentsResponse {
  agents: AgentWithSubscribers[];
  total: number;
  page: number;
  limit: number;
}

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar que el solicitante es un administrador válido
    const { error, status, adminClient } = await getVerifiedAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    // 2. Leer y parsear los parámetros de consulta de la URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const statusFilter = searchParams.get("status") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10)));

    // 3. Calcular el rango de paginación (Supabase usa índice 0)
    const offset = (page - 1) * limit;

    // 4. Construir la consulta base de agentes
    let query = adminClient
      .from("agents")
      .select(
        "id, name, short_description, category, status, creator_id, creator_name, pricing_usd, hosting_type, review_notes, created_at",
        { count: "exact" }
      );

    // 5. Aplicar filtro de búsqueda por nombre si se proporcionó
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // 6. Aplicar filtro de estado exacto si se proporcionó
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    // 7. Aplicar ordenamiento y paginación
    const { data: agents, count, error: agentsError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentsError) {
      console.error("[admin/agents] Error al consultar agentes:", agentsError);
      return NextResponse.json(
        { error: "Error al obtener la lista de agentes." },
        { status: 500 }
      );
    }

    const agentList = agents ?? [];
    const total = count ?? 0;

    // 8. Obtener conteo de suscriptores activos para los agentes de esta página
    //    Se realiza una consulta separada para evitar JOINs complejos con Supabase JS
    let subscriptionCounts: Record<string, number> = {};

    if (agentList.length > 0) {
      const agentIds = agentList.map((a) => a.id);

      const { data: subscriptions, error: subsError } = await adminClient
        .from("subscriptions")
        .select("agent_id")
        .in("agent_id", agentIds)
        .eq("status", "active");

      if (!subsError && subscriptions) {
        // 9. Contar suscripciones activas por agent_id en JavaScript
        subscriptionCounts = subscriptions.reduce<Record<string, number>>(
          (acc, sub) => {
            acc[sub.agent_id] = (acc[sub.agent_id] ?? 0) + 1;
            return acc;
          },
          {}
        );
      }
    }

    // 10. Combinar datos de agentes con sus conteos de suscriptores
    const agentsWithSubscribers: AgentWithSubscribers[] = agentList.map(
      (agent) => ({
        id: agent.id,
        name: agent.name,
        short_description: agent.short_description,
        category: agent.category,
        status: agent.status,
        creator_id: agent.creator_id,
        creator_name: agent.creator_name,
        pricing_usd: agent.pricing_usd,
        hosting_type: agent.hosting_type,
        review_notes: agent.review_notes,
        created_at: agent.created_at,
        subscriberCount: subscriptionCounts[agent.id] ?? 0,
      })
    );

    // 11. Devolver respuesta paginada
    const response: AgentsResponse = {
      agents: agentsWithSubscribers,
      total,
      page,
      limit,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    // Error inesperado del servidor
    console.error("[admin/agents] Error inesperado:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener agentes." },
      { status: 500 }
    );
  }
}
