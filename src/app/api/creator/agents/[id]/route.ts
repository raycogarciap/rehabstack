// src/app/api/creator/agents/[id]/route.ts
// GET    → devuelve un agente específico del creador autenticado
// PATCH  → actualiza parcialmente un agente del creador
// DELETE → baja suave del agente (status = 'delisted')
//
// Todos los endpoints requieren autenticación, rol 'creator', y que el agente
// pertenezca al usuario autenticado (verificación de ownership).
//
// Seguridad:
//   - GET: connection_config enmascarado (sin secretos al cliente)
//   - PATCH status: solo 'active'/'paused', y solo desde esos mismos estados
//     (impide que un creador auto-apruebe un agente en revisión o
//      re-liste uno dado de baja por el admin)
//   - PATCH compliance_declaration: si se intenta poner en false sobre un
//     agente activo, el agente es pausado automáticamente para revisión
//   - PATCH hosting_type: si cambia, se exigen todos los campos de conexión
//     del nuevo tipo (previene connection_config corrupto)

import { NextRequest, NextResponse } from "next/server";
import { maskConnectionConfig } from "@/lib/connection-secrets";
import { getVerifiedCreatorAndAgent } from "@/lib/creator/auth";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

interface TestScenario {
  user_message: string;
  expected_behavior: string;
}

// Los creadores solo pueden transicionar entre estos dos estados.
// 'in_review', 'delisted', 'active' (desde in_review) requieren acción de admin.
const CREATOR_MUTABLE_STATUSES = ["active", "paused"] as const;
type CreatorMutableStatus = typeof CREATOR_MUTABLE_STATUSES[number];

interface PatchAgentBody {
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  category?: string;
  pricing_usd?: number;
  languages?: string[];
  demo_video_url?: string | null;
  hosting_type?: "managed_anthropic" | "creator_hosted" | "self_hosted_package";
  model_provider?: string;
  min_model_capability?: string;
  staff_delegation?: boolean;
  quick_actions?: QuickAction[];
  work_item_types?: string[];
  relevant_integrations?: string[];
  knowledge_base?: string | null;
  test_scenarios?: TestScenario[];
  known_limitations?: string | null;
  compliance_declaration?: boolean;
  // Campo de estado — restricciones de transición aplicadas en el handler
  status?: CreatorMutableStatus;
  // Campos de conexión para managed_anthropic
  anthropic_agent_id?: string;
  anthropic_environment_id?: string;
  anthropic_api_key?: string;
  // Campos de conexión para creator_hosted
  api_endpoint?: string;
  api_key?: string;
  api_spec_version?: string;
  // Campos de conexión para self_hosted_package
  package_url?: string;
  deployment_guide_url?: string;
  supported_models?: string[];
}

// ── Helper: construir connection_config completo según hosting_type ────────────
// Usado cuando hosting_type cambia — requiere todos los campos del nuevo tipo.

function buildFullConnectionConfig(
  body: PatchAgentBody,
  hostingType: string,
): Record<string, string | string[]> | { missing: string } {
  if (hostingType === "managed_anthropic") {
    if (!body.anthropic_agent_id || !body.anthropic_environment_id || !body.anthropic_api_key) {
      return { missing: "anthropic_agent_id, anthropic_environment_id, anthropic_api_key" };
    }
    return {
      agent_id: body.anthropic_agent_id,
      environment_id: body.anthropic_environment_id,
      api_key: body.anthropic_api_key,
    };
  }

  if (hostingType === "creator_hosted") {
    if (!body.api_endpoint || !body.api_key || !body.api_spec_version) {
      return { missing: "api_endpoint, api_key, api_spec_version" };
    }
    return {
      endpoint: body.api_endpoint,
      api_key: body.api_key,
      spec_version: body.api_spec_version,
    };
  }

  if (hostingType === "self_hosted_package") {
    if (!body.package_url || !body.deployment_guide_url || !body.supported_models) {
      return { missing: "package_url, deployment_guide_url, supported_models" };
    }
    return {
      package_url: body.package_url,
      deployment_guide_url: body.deployment_guide_url,
      supported_models: body.supported_models,
    };
  }

  return { missing: "hosting_type desconocido" };
}

// ── Helper: construir connection_config parcial (merge) sin cambio de tipo ────
// Usado cuando hosting_type NO cambia — actualiza solo los campos provistos.

function buildPartialConnectionConfig(
  body: PatchAgentBody,
  hostingType: string,
): Record<string, string | string[]> | null {
  if (hostingType === "managed_anthropic") {
    if (!body.anthropic_agent_id && !body.anthropic_environment_id && !body.anthropic_api_key) {
      return null;
    }
    const config: Record<string, string> = {};
    if (body.anthropic_agent_id) config.agent_id = body.anthropic_agent_id;
    if (body.anthropic_environment_id) config.environment_id = body.anthropic_environment_id;
    if (body.anthropic_api_key) config.api_key = body.anthropic_api_key;
    return config;
  }

  if (hostingType === "creator_hosted") {
    if (!body.api_endpoint && !body.api_key && !body.api_spec_version) {
      return null;
    }
    const config: Record<string, string> = {};
    if (body.api_endpoint) config.endpoint = body.api_endpoint;
    if (body.api_key) config.api_key = body.api_key;
    if (body.api_spec_version) config.spec_version = body.api_spec_version;
    return config;
  }

  if (hostingType === "self_hosted_package") {
    if (!body.package_url && !body.deployment_guide_url && !body.supported_models) {
      return null;
    }
    const config: Record<string, string | string[]> = {};
    if (body.package_url) config.package_url = body.package_url;
    if (body.deployment_guide_url) config.deployment_guide_url = body.deployment_guide_url;
    if (body.supported_models) config.supported_models = body.supported_models;
    return config;
  }

  return null;
}

// ── GET /api/creator/agents/[id] ─────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status, agent } = await getVerifiedCreatorAndAgent(id);

    if (error || !agent) {
      return NextResponse.json({ error }, { status: status ?? 404 });
    }

    // Enmascarar API keys antes de enviar al cliente
    return NextResponse.json({
      ...agent,
      connection_config: maskConnectionConfig(agent.connection_config),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/agents/[id] GET] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH /api/creator/agents/[id] ───────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status, supabase, agent } = await getVerifiedCreatorAndAgent(id);

    if (error || !agent || !supabase) {
      return NextResponse.json({ error }, { status: status ?? 404 });
    }

    const body = await req.json().catch(() => null) as PatchAgentBody | null;

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud está vacío o es inválido." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    // ── Campos escalares directos ─────────────────────────────────────────────
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.short_description !== undefined) updates.short_description = body.short_description;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.pricing_usd !== undefined) updates.pricing_usd = body.pricing_usd;
    if (body.languages !== undefined) updates.languages = body.languages;
    if (body.demo_video_url !== undefined) updates.demo_video_url = body.demo_video_url;
    if (body.model_provider !== undefined) updates.model_provider = body.model_provider;
    if (body.min_model_capability !== undefined) updates.min_model_capability = body.min_model_capability;
    if (body.staff_delegation !== undefined) updates.staff_delegation = body.staff_delegation;
    if (body.quick_actions !== undefined) updates.quick_actions = body.quick_actions;
    if (body.work_item_types !== undefined) updates.work_item_types = body.work_item_types;
    if (body.relevant_integrations !== undefined) updates.relevant_integrations = body.relevant_integrations;
    if (body.knowledge_base !== undefined) updates.knowledge_base = body.knowledge_base;
    if (body.test_scenarios !== undefined) updates.test_scenarios = body.test_scenarios;
    if (body.known_limitations !== undefined) updates.known_limitations = body.known_limitations;

    // ── Status: transiciones permitidas para creadores ────────────────────────
    // Los creadores solo pueden moverse entre 'active' y 'paused'.
    // No pueden auto-aprobar agentes en 'in_review' ni re-listar agentes
    // que el admin marcó como 'delisted'.
    if (body.status !== undefined) {
      if (!CREATOR_MUTABLE_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Estado inválido: '${body.status}'. ` +
                   `Los creadores solo pueden usar: ${CREATOR_MUTABLE_STATUSES.join(", ")}.`,
          },
          { status: 400 }
        );
      }

      const currentStatus: string = agent.status;
      if (!CREATOR_MUTABLE_STATUSES.includes(currentStatus as CreatorMutableStatus)) {
        return NextResponse.json(
          {
            error: `No puedes cambiar el estado de un agente con estado '${currentStatus}'. ` +
                   "Solo los agentes activos o pausados pueden ser modificados por el creador.",
          },
          { status: 403 }
        );
      }

      updates.status = body.status;
    }

    // ── compliance_declaration: protección post-aprobación ────────────────────
    // Si un creador retira la declaración de cumplimiento en un agente activo,
    // el agente se pausa automáticamente hasta revisión del admin.
    // Esto evita que agentes no conformes operen en el marketplace.
    if (body.compliance_declaration !== undefined) {
      updates.compliance_declaration = body.compliance_declaration;

      if (body.compliance_declaration === false && agent.status === "active") {
        updates.status = "paused";
        console.warn(
          `[creator/agents/[id] PATCH] Agente ${id} pausado automáticamente: ` +
          "compliance_declaration retirada en agente activo."
        );
      }
    }

    // ── hosting_type: si cambia, exigir config completa del nuevo tipo ────────
    // Un cambio de tipo sin los nuevos campos de conexión deja connection_config
    // inconsistente (campos del tipo anterior + hosting_type del nuevo).
    if (body.hosting_type !== undefined) {
      updates.hosting_type = body.hosting_type;

      if (body.hosting_type !== agent.hosting_type) {
        // El tipo cambió — se necesita el config completo del nuevo tipo
        const newConfig = buildFullConnectionConfig(body, body.hosting_type);

        if ("missing" in newConfig) {
          return NextResponse.json(
            {
              error:
                `Al cambiar hosting_type a '${body.hosting_type}', debes proveer ` +
                `todos los campos de conexión requeridos: ${newConfig.missing}.`,
            },
            { status: 400 }
          );
        }

        // Reemplazar completamente — no hacer merge con la config del tipo anterior
        updates.connection_config = newConfig;
      } else {
        // El tipo no cambia — merge parcial de los campos provistos
        const partialConfig = buildPartialConnectionConfig(body, body.hosting_type);
        if (partialConfig) {
          updates.connection_config = {
            ...(agent.connection_config as Record<string, unknown> ?? {}),
            ...partialConfig,
          };
        }
      }
    } else if (agent.hosting_type) {
      // hosting_type no cambia pero pueden venir campos de conexión individuales
      const partialConfig = buildPartialConnectionConfig(body, agent.hosting_type);
      if (partialConfig) {
        updates.connection_config = {
          ...(agent.connection_config as Record<string, unknown> ?? {}),
          ...partialConfig,
        };
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Ningún campo válido fue provisto para actualizar." },
        { status: 400 }
      );
    }

    // ── Ejecutar actualización ────────────────────────────────────────────────
    const { data: updatedAgent, error: updateError } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[creator/agents/[id] PATCH] Error al actualizar:", updateError.message);
      return NextResponse.json(
        { error: "Error al actualizar el agente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...updatedAgent,
      connection_config: maskConnectionConfig(updatedAgent.connection_config),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/agents/[id] PATCH] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE /api/creator/agents/[id] ──────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status, supabase, agent } = await getVerifiedCreatorAndAgent(id);

    if (error || !agent || !supabase) {
      return NextResponse.json({ error }, { status: status ?? 404 });
    }

    // Baja suave: marcar como 'delisted' en lugar de eliminar físicamente.
    // El creador no puede revertir este estado — requiere acción del admin.
    const { error: updateError } = await supabase
      .from("agents")
      .update({ status: "delisted" })
      .eq("id", id);

    if (updateError) {
      console.error("[creator/agents/[id] DELETE] Error al dar de baja:", updateError.message);
      return NextResponse.json(
        { error: "Error al dar de baja el agente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/agents/[id] DELETE] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
