// src/app/api/creator/agents/route.ts
// GET  → devuelve todos los agentes del creador autenticado
// POST → crea un nuevo agente con estado 'in_review'
//
// Ambos endpoints requieren autenticación y rol 'creator'.
//
// Seguridad:
//   - GET: connection_config enmascarado (sin secretos al cliente)
//   - POST: valida strings no vacíos, enums válidos, unicidad de slug

import { NextRequest, NextResponse } from "next/server";
import { maskConnectionConfig } from "@/lib/connection-secrets";
import { getVerifiedCreator } from "@/lib/creator/auth";

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

type ConnectionConfig =
  | { agent_id: string; environment_id: string; api_key: string }
  | { endpoint: string; api_key: string; spec_version: string }
  | { package_url: string; deployment_guide_url: string; supported_models: string[] };

interface CreateAgentBody {
  name: string;
  slug?: string;
  short_description: string;
  description: string;
  category: string;
  pricing_usd: number;
  languages: string[];
  demo_video_url?: string;
  hosting_type: "managed_anthropic" | "creator_hosted" | "self_hosted_package";
  model_provider: string;
  min_model_capability: string;
  staff_delegation: boolean;
  quick_actions: QuickAction[];
  work_item_types: string[];
  relevant_integrations?: string[];
  knowledge_base?: string;
  test_scenarios?: TestScenario[];
  known_limitations?: string;
  compliance_declaration: boolean;
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

// ── Constantes de validación ──────────────────────────────────────────────────

// Valores válidos para el campo category
const VALID_CATEGORIES = [
  "rehabilitation",
  "assessment",
  "exercise",
  "documentation",
  "billing",
  "scheduling",
  "patient-education",
  "outcome-tracking",
  "other",
] as const;

// Valores válidos para el campo hosting_type
const VALID_HOSTING_TYPES = [
  "managed_anthropic",
  "creator_hosted",
  "self_hosted_package",
] as const;

// ── Helper: construir connection_config según hosting_type ────────────────────

function buildConnectionConfig(body: CreateAgentBody): ConnectionConfig | null {
  const { hosting_type } = body;

  if (hosting_type === "managed_anthropic") {
    if (!body.anthropic_agent_id || !body.anthropic_environment_id || !body.anthropic_api_key) {
      return null;
    }
    return {
      agent_id: body.anthropic_agent_id,
      environment_id: body.anthropic_environment_id,
      api_key: body.anthropic_api_key,
    };
  }

  if (hosting_type === "creator_hosted") {
    if (!body.api_endpoint || !body.api_key || !body.api_spec_version) {
      return null;
    }
    return {
      endpoint: body.api_endpoint,
      api_key: body.api_key,
      spec_version: body.api_spec_version,
    };
  }

  if (hosting_type === "self_hosted_package") {
    if (!body.package_url || !body.deployment_guide_url || !body.supported_models) {
      return null;
    }
    return {
      package_url: body.package_url,
      deployment_guide_url: body.deployment_guide_url,
      supported_models: body.supported_models,
    };
  }

  return null;
}

// ── GET /api/creator/agents ───────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const { error, status, supabase, user } = await getVerifiedCreator();

    if (error || !user) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    const { data: agents, error: dbError } = await supabase
      .from("agents")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("[creator/agents GET] Error de BD:", dbError.message);
      return NextResponse.json(
        { error: "Error al obtener los agentes." },
        { status: 500 }
      );
    }

    // Enmascarar API keys en connection_config antes de enviar al cliente
    const safeAgents = (agents ?? []).map((agent) => ({
      ...agent,
      connection_config: maskConnectionConfig(agent.connection_config),
    }));

    return NextResponse.json(safeAgents);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/agents GET] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/creator/agents ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { error, status, supabase, user } = await getVerifiedCreator();

    if (error || !user) {
      return NextResponse.json({ error }, { status: status ?? 401 });
    }

    const body = await req.json().catch(() => null) as CreateAgentBody | null;

    if (!body) {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud es inválido o está vacío." },
        { status: 400 }
      );
    }

    // ── Validar campos requeridos — rechaza strings vacíos además de null/undefined ──
    const requiredStringFields: (keyof CreateAgentBody)[] = [
      "name",
      "short_description",
      "description",
      "category",
      "model_provider",
      "min_model_capability",
      "hosting_type",
    ];

    for (const field of requiredStringFields) {
      const val = body[field];
      if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
        return NextResponse.json(
          { error: `El campo '${field}' es requerido y no puede estar vacío.` },
          { status: 400 }
        );
      }
    }

    // Campos no-string también requeridos
    if (body.pricing_usd === undefined || body.pricing_usd === null) {
      return NextResponse.json({ error: "El campo 'pricing_usd' es requerido." }, { status: 400 });
    }
    if (!Array.isArray(body.languages) || body.languages.length === 0) {
      return NextResponse.json({ error: "El campo 'languages' debe ser un array no vacío." }, { status: 400 });
    }
    if (!Array.isArray(body.quick_actions)) {
      return NextResponse.json({ error: "El campo 'quick_actions' es requerido." }, { status: 400 });
    }
    if (!Array.isArray(body.work_item_types)) {
      return NextResponse.json({ error: "El campo 'work_item_types' es requerido." }, { status: 400 });
    }

    // ── Validar enums ─────────────────────────────────────────────────────────
    if (!VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
      return NextResponse.json(
        { error: `Categoría inválida. Valores permitidos: ${VALID_CATEGORIES.join(", ")}.` },
        { status: 400 }
      );
    }

    if (!VALID_HOSTING_TYPES.includes(body.hosting_type as typeof VALID_HOSTING_TYPES[number])) {
      return NextResponse.json(
        { error: `hosting_type inválido. Valores permitidos: ${VALID_HOSTING_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    // ── Generar slug ──────────────────────────────────────────────────────────
    const slug =
      body.slug?.trim() ||
      body.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    if (!slug) {
      return NextResponse.json(
        { error: "No se pudo generar un slug válido a partir del nombre." },
        { status: 400 }
      );
    }

    // ── Verificar unicidad del slug ───────────────────────────────────────────
    const { data: existing, error: slugError } = await supabase
      .from("agents")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugError) {
      console.error("[creator/agents POST] Error al verificar slug:", slugError.message);
      return NextResponse.json({ error: "Error al verificar el slug." }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        {
          error: `El slug '${slug}' ya está en uso por otro agente. ` +
                 "Cambia el nombre del agente o provee un slug diferente.",
        },
        { status: 409 }
      );
    }

    // ── Construir connection_config ───────────────────────────────────────────
    const connectionConfig = buildConnectionConfig(body);

    if (!connectionConfig) {
      return NextResponse.json(
        {
          error: `Faltan campos de conexión requeridos para hosting_type '${body.hosting_type}'.`,
        },
        { status: 400 }
      );
    }

    // ── Insertar el agente con estado 'in_review' ─────────────────────────────
    const { data: agent, error: insertError } = await supabase
      .from("agents")
      .insert({
        name: body.name,
        slug,
        short_description: body.short_description,
        description: body.description,
        category: body.category,
        pricing_usd: body.pricing_usd,
        languages: body.languages,
        demo_video_url: body.demo_video_url ?? null,
        hosting_type: body.hosting_type,
        model_provider: body.model_provider,
        min_model_capability: body.min_model_capability,
        staff_delegation: body.staff_delegation,
        quick_actions: body.quick_actions,
        work_item_types: body.work_item_types,
        relevant_integrations: body.relevant_integrations ?? [],
        knowledge_base: body.knowledge_base ?? null,
        test_scenarios: body.test_scenarios ?? [],
        known_limitations: body.known_limitations ?? null,
        compliance_declaration: body.compliance_declaration,
        connection_config: connectionConfig,
        creator_id: user.id,
        status: "in_review",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[creator/agents POST] Error al insertar:", insertError.message);
      return NextResponse.json(
        { error: "Error al crear el agente." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ...agent, connection_config: maskConnectionConfig(agent.connection_config) },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor.";
    console.error("[creator/agents POST] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
