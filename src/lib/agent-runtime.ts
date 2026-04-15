// src/lib/agent-runtime.ts
// Capa de abstracción de agentes: TODAS las comunicaciones con agentes pasan por aquí.
// Enruta las llamadas según el `hosting_type` del agente:
//   - managed_anthropic   → Anthropic Managed Agents API (beta)
//   - managed_openai      → OpenAI managed agent API (reservado, Fase 3)
//   - creator_hosted      → API propia del creador (RehabStack Agent API Spec)
//   - self_hosted_package → Infraestructura del usuario final (Fase 2)
//
// Input  → { agentId, sessionId?, message, userId }
// Output → ReadableStream (SSE compatible con Next.js Response)
//
// ⚠️  Nunca llamar a proveedores de agentes directamente desde API routes o componentes.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// TIPOS
// ============================================================

/** Tipos de hosting soportados por la plataforma */
export type HostingType =
  | "managed_anthropic"
  | "managed_openai"
  | "creator_hosted"
  | "self_hosted_package";

/** Fila de la tabla `agents` con los campos necesarios para el runtime */
interface AgentRow {
  id: string;
  name: string;
  hosting_type: HostingType;
  platform_agent_id: string | null; // ID del agente en la plataforma externa (Anthropic, etc.)
  connection_config: Record<string, unknown>; // JSONB con config de conexión del creador
  staff_delegation: boolean;
}

/** Parámetros para iniciar una sesión de agente */
export interface CreateSessionParams {
  agentId: string;  // UUID del agente en la tabla `agents`
  userId: string;   // UUID del usuario autenticado
}

/** Resultado de crear una sesión */
export interface CreateSessionResult {
  platformSessionId: string; // ID de sesión en la plataforma externa
  dbSessionId: string;       // UUID de la fila en la tabla `sessions`
}

/** Parámetros para enviar un mensaje y recibir respuesta en streaming */
export interface StreamMessageParams {
  agentId: string;
  sessionId: string;  // UUID de la fila en `sessions` (NO el platform_session_id)
  message: string;
  userId: string;
}

// ============================================================
// CLIENTE ANTHROPIC (singleton reutilizable entre llamadas)
// ============================================================

// Lazy-initialized: solo se crea si se usa managed_anthropic
let _anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurada en las variables de entorno");
    }
    _anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: {
        // Beta header para Managed Agents API
        "anthropic-beta": "managed-agents-2026-04-01",
      },
    });
  }
  return _anthropicClient;
}

// ============================================================
// HELPERS INTERNOS
// ============================================================

/** Recupera los datos del agente desde la base de datos */
async function fetchAgentRow(agentId: string): Promise<AgentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name, hosting_type, platform_agent_id, connection_config, staff_delegation")
    .eq("id", agentId)
    .single();

  if (error || !data) {
    throw new Error(`Agente no encontrado: ${agentId}`);
  }

  return data as AgentRow;
}

/** Recupera el `platform_session_id` de una sesión activa en la BD */
async function fetchPlatformSessionId(dbSessionId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("platform_session_id")
    .eq("id", dbSessionId)
    .single();

  if (error || !data?.platform_session_id) {
    throw new Error(`Sesión no encontrada o sin platform_session_id: ${dbSessionId}`);
  }

  return data.platform_session_id as string;
}

/** Guarda una sesión nueva en la tabla `sessions` y devuelve su UUID */
async function insertSession(
  userId: string,
  agentId: string,
  platformSessionId: string,
  hostingType: HostingType
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      agent_id: agentId,
      platform_session_id: platformSessionId,
      hosting_type: hostingType,
      status: "active",
      token_usage_estimate: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Error al crear sesión en BD: ${error?.message ?? "desconocido"}`);
  }

  return data.id as string;
}

// ============================================================
// CREAR SESIÓN — enruta según hosting_type
// ============================================================

/**
 * Inicia una nueva sesión de agente y la persiste en la BD.
 * Llamar una vez antes de enviar mensajes.
 */
export async function createAgentSession(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  const { agentId, userId } = params;
  const agent = await fetchAgentRow(agentId);

  switch (agent.hosting_type) {
    case "managed_anthropic":
      return createManagedAnthropicSession(agent, userId);

    case "creator_hosted":
      return createCreatorHostedSession(agent, userId);

    case "managed_openai":
      // Reservado para Fase 3 — no implementado aún
      throw new Error("managed_openai no está disponible en esta fase");

    case "self_hosted_package":
      // Reservado para Fase 2 — infraestructura del usuario final
      throw new Error("self_hosted_package no está disponible en esta fase");

    default:
      throw new Error(`hosting_type desconocido: ${agent.hosting_type}`);
  }
}

/** Crea sesión en Anthropic Managed Agents API */
async function createManagedAnthropicSession(
  agent: AgentRow,
  userId: string
): Promise<CreateSessionResult> {
  if (!agent.platform_agent_id) {
    throw new Error(
      `El agente "${agent.name}" no tiene platform_agent_id configurado para Anthropic`
    );
  }

  const client = getAnthropicClient();

  // Crea la sesión en Anthropic — el agente ya debe existir (creado una sola vez)
  // La SDK añade automáticamente el beta header managed-agents-2026-04-01
  const session = await (client.beta as any).sessions.create({
    agent_id: agent.platform_agent_id,
  });

  const platformSessionId: string = session.id;

  // Persiste en la BD
  const dbSessionId = await insertSession(userId, agent.id, platformSessionId, "managed_anthropic");

  return { platformSessionId, dbSessionId };
}

/** Crea sesión en la API propia del creador (RehabStack Agent API Spec) */
async function createCreatorHostedSession(
  agent: AgentRow,
  userId: string
): Promise<CreateSessionResult> {
  const config = agent.connection_config as { base_url?: string; api_key?: string };

  if (!config.base_url) {
    throw new Error(`El agente "${agent.name}" no tiene base_url en connection_config`);
  }

  // POST /sessions según RehabStack Agent API Spec
  const resp = await fetch(`${config.base_url}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.api_key ? { Authorization: `Bearer ${config.api_key}` } : {}),
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!resp.ok) {
    throw new Error(
      `Error al crear sesión en agente externo: ${resp.status} ${resp.statusText}`
    );
  }

  const json = await resp.json();
  const platformSessionId: string = json.session_id ?? json.id;

  const dbSessionId = await insertSession(userId, agent.id, platformSessionId, "creator_hosted");

  return { platformSessionId, dbSessionId };
}

// ============================================================
// STREAMING DE MENSAJES — enruta según hosting_type
// ============================================================

/**
 * Envía un mensaje al agente y devuelve un ReadableStream con la respuesta SSE.
 * Usar directamente como body de una NextResponse para streaming.
 *
 * Ejemplo de uso en un API route:
 *   const stream = await streamAgentMessage({ agentId, sessionId, message, userId });
 *   return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
 */
export async function streamAgentMessage(
  params: StreamMessageParams
): Promise<ReadableStream<Uint8Array>> {
  const { agentId, sessionId, message, userId } = params;
  const agent = await fetchAgentRow(agentId);
  const platformSessionId = await fetchPlatformSessionId(sessionId);

  switch (agent.hosting_type) {
    case "managed_anthropic":
      return streamManagedAnthropicMessage(platformSessionId, message);

    case "creator_hosted":
      return streamCreatorHostedMessage(agent, platformSessionId, message);

    case "managed_openai":
      throw new Error("managed_openai no está disponible en esta fase");

    case "self_hosted_package":
      throw new Error("self_hosted_package no está disponible en esta fase");

    default:
      throw new Error(`hosting_type desconocido: ${agent.hosting_type}`);
  }
}

/** Streaming desde Anthropic Managed Agents API */
async function streamManagedAnthropicMessage(
  platformSessionId: string,
  message: string
): Promise<ReadableStream<Uint8Array>> {
  const client = getAnthropicClient();
  const encoder = new TextEncoder();

  // Envía el mensaje como evento de turno de usuario y abre el stream SSE
  const stream = await (client.beta as any).sessions.stream(platformSessionId, {
    events: [
      {
        type: "user_turn",
        content: message,
      },
    ],
  });

  // Convierte el stream del SDK a un ReadableStream de Uint8Array (compatible con Next.js)
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Itera sobre los eventos SSE del SDK de Anthropic
        for await (const event of stream) {
          // Serializa cada evento como línea SSE estándar
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        // Señal de fin de stream
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/** Streaming desde la API propia del creador (RehabStack Agent API Spec) */
async function streamCreatorHostedMessage(
  agent: AgentRow,
  platformSessionId: string,
  message: string
): Promise<ReadableStream<Uint8Array>> {
  const config = agent.connection_config as { base_url?: string; api_key?: string };

  if (!config.base_url) {
    throw new Error(`El agente "${agent.name}" no tiene base_url en connection_config`);
  }

  // POST /sessions/{id}/messages según RehabStack Agent API Spec — retorna SSE
  const resp = await fetch(`${config.base_url}/sessions/${platformSessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(config.api_key ? { Authorization: `Bearer ${config.api_key}` } : {}),
    },
    body: JSON.stringify({ content: message }),
  });

  if (!resp.ok) {
    throw new Error(
      `Error al enviar mensaje al agente externo: ${resp.status} ${resp.statusText}`
    );
  }

  if (!resp.body) {
    throw new Error("El agente externo no devolvió un stream de respuesta");
  }

  // El body ya es un ReadableStream — lo reenvía directamente al cliente
  return resp.body;
}

// ============================================================
// TERMINAR SESIÓN
// ============================================================

/**
 * Marca la sesión como terminada en la BD y la cierra en la plataforma si aplica.
 */
export async function terminateAgentSession(
  dbSessionId: string,
  agentId: string
): Promise<void> {
  const supabase = await createClient();

  // Obtiene el platform_session_id y hosting_type
  const { data } = await supabase
    .from("sessions")
    .select("platform_session_id, hosting_type")
    .eq("id", dbSessionId)
    .single();

  if (data?.hosting_type === "managed_anthropic" && data.platform_session_id) {
    try {
      const client = getAnthropicClient();
      await (client.beta as any).sessions.delete(data.platform_session_id);
    } catch {
      // No crítico: la sesión expirará sola en Anthropic
    }
  }

  if (data?.hosting_type === "creator_hosted" && data.platform_session_id) {
    const agent = await fetchAgentRow(agentId);
    const config = agent.connection_config as { base_url?: string; api_key?: string };
    if (config.base_url) {
      try {
        await fetch(`${config.base_url}/sessions/${data.platform_session_id}`, {
          method: "DELETE",
          headers: config.api_key ? { Authorization: `Bearer ${config.api_key}` } : {},
        });
      } catch {
        // No crítico: el creador manejará expiración
      }
    }
  }

  // Marca como terminada en la BD
  await supabase
    .from("sessions")
    .update({ status: "terminated" })
    .eq("id", dbSessionId);
}
