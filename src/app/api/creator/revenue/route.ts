// src/app/api/creator/revenue/route.ts
// GET /api/creator/revenue
//
// Devuelve estadísticas de ingresos del creador autenticado:
// - Detalle por agente: suscriptores activos, MRR, total histórico
// - Totales globales: MRR total, ingresos históricos totales
// - Tendencia mensual: agrupación de suscripciones por mes de creación
//
// Requiere autenticación y rol 'creator'.

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedCreator } from "@/lib/creator/auth";

// ── Tipos ────────────────────────────────────────────────────────────────────

// Estadísticas de ingresos por agente individual
interface AgentRevenue {
  id: string;
  name: string;
  pricing_usd: number;
  category: string;
  active_subscribers: number;
  mrr: number;               // MRR = pricing_usd × active_subscribers
  total_subscribers: number;
}

// Totales de un mes específico (para la gráfica de tendencia)
interface MonthlyRevenue {
  month: string;             // Formato "YYYY-MM"
  mrr: number;
  new_subscribers: number;
}

// Respuesta completa del endpoint
interface RevenueResponse {
  agents: AgentRevenue[];
  totalMrr: number;
  totalAllTime: number;
  monthlyTrend: MonthlyRevenue[];
}

// Forma de una suscripción devuelta por Supabase (join inline)
interface SubscriptionRow {
  id: string;
  status: string;
  created_at: string;
}

// Forma de un agente con suscripciones anidadas devuelto por Supabase
interface AgentWithSubscriptions {
  id: string;
  name: string;
  pricing_usd: number | null;
  category: string;
  subscriptions: SubscriptionRow[];
}

// ── GET /api/creator/revenue ──────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    // ── 1 & 2. Verificar autenticación y rol de creador ─────────────────────
    const { error: authError, status: authStatus, supabase, user } =
      await getVerifiedCreator();

    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: authStatus ?? 401 });
    }

    // ── 3. Obtener TODOS los agentes del creador con sus suscripciones ──────
    // No filtramos por status del agente: los agentes pausados o dados de baja
    // pueden tener suscripciones activas que Stripe sigue cobrando.
    // Filtrar por status='active' oculta ingresos reales al creador.
    const { data: agentsRaw, error: agentsError } = await supabase
      .from("agents")
      .select(
        "id, name, pricing_usd, category, subscriptions(id, status, created_at)"
      )
      .eq("creator_id", user.id);

    if (agentsError) {
      console.error("[creator/revenue GET] Error al obtener agentes:", agentsError.message);
      return NextResponse.json(
        { error: "Error al obtener los datos de ingresos." },
        { status: 500 }
      );
    }

    const agents = (agentsRaw ?? []) as AgentWithSubscriptions[];

    // ── 4. Calcular estadísticas por agente ─────────────────────────────────
    const agentRevenue: AgentRevenue[] = agents.map((agent) => {
      const subs = agent.subscriptions ?? [];
      const pricingUsd = agent.pricing_usd ?? 0;
      const activeCount = subs.filter((s) => s.status === "active").length;

      return {
        id: agent.id,
        name: agent.name,
        pricing_usd: pricingUsd,
        category: agent.category,
        active_subscribers: activeCount,
        mrr: pricingUsd * activeCount,
        total_subscribers: subs.length,
      };
    });

    // Ordenar por MRR descendente (los más rentables primero)
    agentRevenue.sort((a, b) => b.mrr - a.mrr);

    // ── 5. Calcular totales globales ────────────────────────────────────────
    const totalMrr = agentRevenue.reduce((sum, a) => sum + a.mrr, 0);

    // Ingresos históricos totales: suma de pricing_usd de TODAS las suscripciones (activas o no)
    const totalAllTime = agents.reduce((sum, agent) => {
      const pricingUsd = agent.pricing_usd ?? 0;
      return sum + pricingUsd * (agent.subscriptions?.length ?? 0);
    }, 0);

    // ── 6. Calcular tendencia mensual ───────────────────────────────────────
    // Agrupa todas las suscripciones activas por mes de creación para mostrar
    // la evolución del MRR a lo largo del tiempo.
    const monthlyMap = new Map<string, { mrr: number; new_subscribers: number }>();

    for (const agent of agents) {
      const pricingUsd = agent.pricing_usd ?? 0;
      const activeSubs = (agent.subscriptions ?? []).filter(
        (s) => s.status === "active"
      );

      for (const sub of activeSubs) {
        // Extraer "YYYY-MM" del timestamp de created_at
        const month = sub.created_at.slice(0, 7);
        const existing = monthlyMap.get(month) ?? { mrr: 0, new_subscribers: 0 };

        monthlyMap.set(month, {
          mrr: existing.mrr + pricingUsd,
          new_subscribers: existing.new_subscribers + 1,
        });
      }
    }

    // Convertir el Map a un array ordenado cronológicamente
    const monthlyTrend: MonthlyRevenue[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ── 7. Responder con todos los datos ────────────────────────────────────
    const response: RevenueResponse = {
      agents: agentRevenue,
      totalMrr,
      totalAllTime,
      monthlyTrend,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/revenue GET] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
