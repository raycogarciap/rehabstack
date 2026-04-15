// src/app/api/agents/[id]/message/route.ts
// POST → recibe { message, sessionId } y devuelve un SSE stream con la respuesta del agente.
// Enruta via agent-runtime.ts (managed_anthropic, creator_hosted, etc.).
// Para id === "mock": bypass de runtime, stream simulado directo.
//
// SSE format: data: {"type":"token","content":"..."}\n\n
//             data: {"type":"done"}\n\n
//             data: {"type":"error","message":"..."}\n\n

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamAgentMessage } from "@/lib/agent-runtime";

// Headers requeridos para SSE en Next.js + Vercel
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

// Respuesta mock para id === "mock" — no llama a agent-runtime
const MOCK_RESPONSE = `Hello! I'm the **Content Engine** running in demo mode.

Here's what I can help you with:

- **Instagram content packages** tailored to your practice specialty
- **VA briefs** so your virtual assistant can handle content creation
- **Testimonial requests** that feel natural to send to patients
- **Social media strategies** built around your clinical expertise

What would you like to work on today?`;

function buildErrorStream(message: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`)
      );
      controller.close();
    },
  });
}

function buildMockStream(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const tokens = MOCK_RESPONSE.match(/\S+\s*/g) ?? [];
  return new ReadableStream({
    async start(controller) {
      for (const token of tokens) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)
        );
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
      );
      controller.close();
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check (excepto mock — permite testing sin sesión)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && id !== "mock") {
    return new Response(buildErrorStream("Unauthorized"), {
      status: 401,
      headers: SSE_HEADERS,
    });
  }

  // Parsear body
  const body = await req.json().catch(() => ({})) as {
    message?: string;
    sessionId?: string;
  };
  const { message, sessionId } = body;

  if (!message?.trim()) {
    return new Response(buildErrorStream("message is required"), {
      status: 400,
      headers: SSE_HEADERS,
    });
  }

  // Modo mock: stream simulado sin BD ni runtime
  if (id === "mock") {
    return new Response(buildMockStream(), { headers: SSE_HEADERS });
  }

  if (!sessionId) {
    return new Response(buildErrorStream("sessionId is required"), {
      status: 400,
      headers: SSE_HEADERS,
    });
  }

  // Producción: enruta a través del agent-runtime
  try {
    const stream = await streamAgentMessage({
      agentId: id,
      sessionId,
      message: message.trim(),
      userId: user!.id,
    });
    return new Response(stream, { headers: SSE_HEADERS });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Agent unavailable";
    return new Response(buildErrorStream(errMsg), {
      status: 500,
      headers: SSE_HEADERS,
    });
  }
}
