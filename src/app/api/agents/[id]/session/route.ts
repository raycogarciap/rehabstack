// src/app/api/agents/[id]/session/route.ts
// GET  → devuelve la sesión activa más reciente para user+agent (o null)
// POST → crea una nueva sesión via agent-runtime.ts createAgentSession()
//
// Para id === "mock": bypass completo de BD y runtime — respuesta inmediata.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAgentSession } from "@/lib/agent-runtime";

// ID de sesión fija para el agente mock — no toca la BD
const MOCK_SESSION_ID = "mock-db-session-id";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Modo mock: sesión siempre disponible
  if (id === "mock") {
    return NextResponse.json({ sessionId: MOCK_SESSION_ID });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Busca la sesión activa más reciente para este usuario + agente
  const { data } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("agent_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ sessionId: data?.id ?? null });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Modo mock: devuelve IDs fake sin tocar BD ni runtime
  if (id === "mock") {
    return NextResponse.json({
      sessionId: MOCK_SESSION_ID,
      platformSessionId: "mock-platform-session-id",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { dbSessionId, platformSessionId } = await createAgentSession({
      agentId: id,
      userId: user.id,
    });
    return NextResponse.json({ sessionId: dbSessionId, platformSessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
