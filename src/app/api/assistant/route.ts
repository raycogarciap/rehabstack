// src/app/api/assistant/route.ts
// POST /api/assistant — Asistente IA del sitio web.
// Sin autenticación requerida (endpoint público).
// Rate limited: 100 mensajes por IP cada 24 horas usando Upstash Redis.
//
// El proveedor de LLM se controla con ASSISTANT_AI_PROVIDER:
//   "anthropic" → claude-sonnet-4-6   (default)
//   "openai"    → gpt-4o-mini
// La abstracción vive en src/lib/assistant-llm.ts.

import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { buildKnowledgeBase } from '@/lib/assistant-knowledge'
import { createAdminClient } from '@/lib/supabase/admin'
import { streamAssistantResponse } from '@/lib/assistant-llm'

// ---------------------------------------------------------------------------
// Helper: instancia de Redis (devuelve null si no está configurado)
// ---------------------------------------------------------------------------

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token || url.includes('placeholder')) return null

  return new Redis({ url, token })
}

// ---------------------------------------------------------------------------
// Tipos del body de la petición
// ---------------------------------------------------------------------------

interface MessageItem {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: MessageItem[]
  locale?: string
  visitorEmail?: string
}

// ---------------------------------------------------------------------------
// Manejador principal POST
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  }

  // -------------------------------------------------------------------------
  // 1. Parsear y validar el body
  // -------------------------------------------------------------------------

  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return new Response(
      'data: {"type":"error","message":"Cuerpo de solicitud inválido."}\n\ndata: {"type":"done"}\n\n',
      { status: 400, headers: SSE_HEADERS }
    )
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      'data: {"type":"error","message":"Se requiere un array de mensajes no vacío."}\n\ndata: {"type":"done"}\n\n',
      { status: 400, headers: SSE_HEADERS }
    )
  }

  const locale = body.locale ?? 'en'
  const visitorEmail = body.visitorEmail

  // Filtrar roles válidos y truncar a los últimos 50 mensajes
  const messages = body.messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
    .slice(-50)

  // -------------------------------------------------------------------------
  // 2. Verificar que al menos una API key esté disponible para el proveedor activo
  // -------------------------------------------------------------------------

  const provider = process.env.ASSISTANT_AI_PROVIDER?.toLowerCase() ?? 'anthropic'
  const keyMissing =
    (provider === 'openai' && !process.env.OPENAI_API_KEY) ||
    (provider !== 'openai' && !process.env.ANTHROPIC_API_KEY)

  if (keyMissing) {
    return new Response(
      'data: {"type":"error","message":"AI assistant is not configured."}\n\ndata: {"type":"done"}\n\n',
      { status: 500, headers: SSE_HEADERS }
    )
  }

  // -------------------------------------------------------------------------
  // 3. Rate limiting por IP usando Upstash Redis
  // -------------------------------------------------------------------------

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const redis = getRedis()

  if (redis) {
    const rlKey = `assistant_rl_${ip}`
    const count = await redis.incr(rlKey)
    if (count === 1) await redis.expire(rlKey, 86400)

    if (count > 100) {
      return new Response(
        'data: {"type":"error","message":"Rate limit exceeded. Please try again tomorrow."}\n\ndata: {"type":"done"}\n\n',
        { status: 429, headers: SSE_HEADERS }
      )
    }
  }

  // -------------------------------------------------------------------------
  // 4. Captura de lead (fire-and-forget)
  // -------------------------------------------------------------------------

  if (visitorEmail && visitorEmail.includes('@')) {
    ;(async () => {
      try {
        const supabase = createAdminClient()
        await supabase.from('leads').insert({
          email: visitorEmail,
          locale,
          source: 'ai_assistant',
        })
      } catch {
        // No bloquear la respuesta si falla el guardado del lead
      }
    })()
  }

  // -------------------------------------------------------------------------
  // 5. Construir el prompt del sistema con la base de conocimiento dinámica
  // -------------------------------------------------------------------------

  const knowledge = await buildKnowledgeBase(locale)

  const systemPrompt = `You are the RehabStack AI Assistant — a helpful guide for clinical professionals exploring our AI agent marketplace. Assume most users have no awareness of what an agent-as-a-service is.

## About RehabStack
RehabStack is an AI agent marketplace built specifically for physical therapists, occupational therapists, and rehabilitation professionals. We offer specialized AI agents that help practitioners grow their practice, find continuing education, and monetize their expertise and much more.

## Current Platform Knowledge
${knowledge}

## Your Role
- Help visitors discover the right agent for their needs
- Answer questions about pricing, features, and how agents work
- Guide interested visitors to register and subscribe
- Guide interested visitors to create and list their own Agents
- If a visitor seems ready to buy, suggest they click "Get Started" or visit /pricing
- If a visitor shares their email, acknowledge it warmly — the system will save it automatically
- Always respond in the ${locale} language
- Never claim to be human
- Never make up agent features not listed in your knowledge base
- If asked about an agent not in your knowledge, say "That agent isn't available yet but we're always adding new ones"

## Conversion Goals
- Primary: Get visitor to /register
- Secondary: Get visitor to /pricing
- Tertiary: Capture visitor email for follow-up`

  // -------------------------------------------------------------------------
  // 6. Delegar al proveedor activo y retornar el stream SSE
  // -------------------------------------------------------------------------

  try {
    const stream = await streamAssistantResponse(messages, systemPrompt)
    return new Response(stream, { headers: SSE_HEADERS })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to start stream'
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: msg })}\n\ndata: {"type":"done"}\n\n`,
      { status: 500, headers: SSE_HEADERS }
    )
  }
}
