// src/lib/assistant-llm.ts
// Capa de abstracción del LLM para el Asistente IA del sitio web.
// Enruta a Anthropic o OpenAI según la variable ASSISTANT_AI_PROVIDER.
//
// Uso:
//   const stream = await streamAssistantResponse(messages, systemPrompt)
//   return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
//
// Formato SSE de salida (idéntico para ambos proveedores):
//   data: {"type":"token","content":"..."}
//   data: {"type":"done"}
//   data: {"type":"error","message":"..."}

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

type Provider = 'anthropic' | 'openai'

// ─── Helper: leer el proveedor activo ────────────────────────────────────────

function getProvider(): Provider {
  const raw = process.env.ASSISTANT_AI_PROVIDER?.toLowerCase().trim()
  if (raw === 'openai') return 'openai'
  // Por defecto Anthropic (valor del CLAUDE.md y fallback seguro)
  return 'anthropic'
}

// ─── Encoder compartido ───────────────────────────────────────────────────────

const encoder = new TextEncoder()

function sseToken(content: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
}

function sseDone(): Uint8Array {
  return encoder.encode('data: {"type":"done"}\n\n')
}

function sseError(message: string): Uint8Array {
  return encoder.encode(
    `data: ${JSON.stringify({ type: 'error', message })}\n\ndata: {"type":"done"}\n\n`
  )
}

// ─── Proveedor Anthropic ──────────────────────────────────────────────────────

async function streamWithAnthropic(
  messages: AssistantMessage[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está configurada')
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
  })

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(sseToken(event.delta.text))
          }
        }
        controller.enqueue(sseDone())
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Anthropic stream error'
        controller.enqueue(sseError(msg))
      } finally {
        controller.close()
      }
    },
  })
}

// ─── Proveedor OpenAI ─────────────────────────────────────────────────────────

async function streamWithOpenAI(
  messages: AssistantMessage[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está configurada')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            controller.enqueue(sseToken(delta))
          }
        }
        controller.enqueue(sseDone())
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'OpenAI stream error'
        controller.enqueue(sseError(msg))
      } finally {
        controller.close()
      }
    },
  })
}

// ─── Función pública ──────────────────────────────────────────────────────────

/**
 * Devuelve un ReadableStream SSE con la respuesta del LLM activo.
 * El proveedor se elige via ASSISTANT_AI_PROVIDER ("anthropic" | "openai").
 * El formato de salida es idéntico independientemente del proveedor.
 */
export async function streamAssistantResponse(
  messages: AssistantMessage[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider()

  if (provider === 'openai') {
    return streamWithOpenAI(messages, systemPrompt)
  }

  return streamWithAnthropic(messages, systemPrompt)
}
