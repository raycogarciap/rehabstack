// src/app/api/assistant/route.ts
// POST /api/assistant — Asistente IA del sitio web.
// Sin autenticación requerida (endpoint público).
// Rate limited: 100 mensajes por IP cada 24 horas usando Upstash Redis.
// Usa Claude Sonnet para responder en streaming via SSE (Server-Sent Events).

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'
import { buildKnowledgeBase } from '@/lib/assistant-knowledge'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Helper: instancia de Redis (devuelve null si no está configurado)
// ---------------------------------------------------------------------------

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // Si las variables no existen o contienen placeholders, retorna null
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
  // -------------------------------------------------------------------------
  // 1. Parsear y validar el body
  // -------------------------------------------------------------------------

  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    // Si el JSON es inválido, retornamos SSE de error
    return new Response(
      'data: {"type":"error","message":"Cuerpo de solicitud inválido."}\n\ndata: {"type":"done"}\n\n',
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  // Validar que messages sea un array no vacío
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      'data: {"type":"error","message":"Se requiere un array de mensajes no vacío."}\n\ndata: {"type":"done"}\n\n',
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  // Locale por defecto 'en' si no se provee
  const locale = body.locale ?? 'en'
  const visitorEmail = body.visitorEmail

  // Filtrar y validar mensajes: solo role 'user' o 'assistant' con content string
  const rawMessages = body.messages.filter(
    (m) =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
  )

  // Máximo 50 mensajes en el historial
  const messages = rawMessages.slice(-50)

  // -------------------------------------------------------------------------
  // 2. Verificar que la API key de Anthropic esté configurada
  // -------------------------------------------------------------------------

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      'data: {"type":"error","message":"AI assistant is not configured."}\n\ndata: {"type":"done"}\n\n',
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  // -------------------------------------------------------------------------
  // 3. Rate limiting por IP usando Upstash Redis
  // -------------------------------------------------------------------------

  // Extraer la IP del cliente del header x-forwarded-for (Vercel/proxies)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const redis = getRedis()

  if (redis) {
    const rlKey = `assistant_rl_${ip}`

    // Incrementar el contador; en la primera llamada del día, establecer TTL de 24h
    const count = await redis.incr(rlKey)
    if (count === 1) await redis.expire(rlKey, 86400)

    if (count > 100) {
      // Límite superado → retornar error SSE con código 429
      return new Response(
        'data: {"type":"error","message":"Rate limit exceeded. Please try again tomorrow."}\n\ndata: {"type":"done"}\n\n',
        { status: 429, headers: { 'Content-Type': 'text/event-stream' } }
      )
    }
  }

  // -------------------------------------------------------------------------
  // 4. Captura de lead (fire-and-forget, no bloquea el streaming)
  // -------------------------------------------------------------------------
  // Si el visitante proporcionó su email, lo guardamos en la tabla `leads`.
  // No esperamos la respuesta para no retrasar el inicio del stream.

  if (visitorEmail && visitorEmail.includes('@')) {
    // Guardado asíncrono sin await — los errores no afectan la respuesta
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
  // 6. Crear la solicitud de streaming a Anthropic
  // -------------------------------------------------------------------------

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Iniciar el stream con Claude Sonnet (modelo especificado en los requisitos)
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
  })

  // -------------------------------------------------------------------------
  // 7. Crear y retornar el ReadableStream SSE
  // -------------------------------------------------------------------------

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Iterar sobre los eventos del stream de Anthropic
        for await (const event of stream) {
          // Solo nos interesan los deltas de texto del contenido
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            // Enviar cada token como un evento SSE con formato JSON
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'token',
                  content: event.delta.text,
                })}\n\n`
              )
            )
          }
        }

        // Señal de finalización del stream
        controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'))
      } catch (err) {
        // En caso de error, enviar mensaje de error SSE antes de cerrar
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: msg })}\n\ndata: {"type":"done"}\n\n`
          )
        )
      } finally {
        // Siempre cerrar el controlador del stream
        controller.close()
      }
    },
  })

  // Retornar la respuesta SSE con los headers apropiados
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
