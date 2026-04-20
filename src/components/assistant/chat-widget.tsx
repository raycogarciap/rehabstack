'use client'

// Widget flotante de chat con IA para RehabStack
// Se muestra en la esquina inferior derecha de todas las páginas públicas
// Se comunica con POST /api/assistant mediante SSE streaming

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

// Tipos de datos
interface ChatWidgetProps {
  locale: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean // true mientras el asistente está transmitiendo
}

// Renderizador simple de markdown — no usa react-markdown (no instalado)
// Convierte **negrita**, *cursiva* y saltos de línea
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Separar por negrita: **texto**
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Eliminar los asteriscos y envolver en <strong>
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })
    return (
      <span key={i}>
        {rendered}
        {/* Agregar salto de línea entre líneas (excepto la última) */}
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

export default function ChatWidget({ locale }: ChatWidgetProps) {
  // Textos traducidos mediante next-intl
  const t = useTranslations('assistant')

  // Estado del widget: abierto/cerrado, mensajes, input, streaming y email del visitante
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [visitorEmail, setVisitorEmail] = useState<string | null>(null)

  // Referencia para auto-scroll al final de los mensajes
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Al montar el componente, leer el estado abierto/cerrado desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rehabstack_assistant_open')
    if (saved === 'true') {
      setIsOpen(true)
      // Si se abre por primera vez, mostrar el mensaje de bienvenida
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', content: t('openingMessage') }])
      }
    }
    // Solo ejecutar al montar (sin dependencias)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll al último mensaje cada vez que cambia la lista de mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Alternar entre abierto y cerrado, persistiendo en localStorage
  const toggleOpen = () => {
    const next = !isOpen
    setIsOpen(next)
    localStorage.setItem('rehabstack_assistant_open', String(next))
    // Si se abre y no hay mensajes, mostrar el mensaje de bienvenida
    if (next && messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('openingMessage') }])
    }
  }

  // Enviar un mensaje al asistente y procesar la respuesta SSE
  const sendMessage = async (text: string) => {
    // Ignorar si el texto está vacío o ya se está transmitiendo
    if (!text.trim() || isStreaming) return

    // Agregar mensaje del usuario al historial
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    // Agregar placeholder vacío del asistente con indicador de streaming
    const assistantPlaceholder: Message = { role: 'assistant', content: '', streaming: true }
    setMessages([...newMessages, assistantPlaceholder])

    // Detectar si el usuario compartió su email (regex simple)
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) setVisitorEmail(emailMatch[0])

    try {
      // Llamar a la API del asistente con el historial de mensajes
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages, // enviar historial SIN el placeholder de streaming
          locale,
          visitorEmail: visitorEmail ?? emailMatch?.[0],
        }),
      })

      // Leer la respuesta SSE (Server-Sent Events) en streaming
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decodificar el chunk de bytes a texto
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          // Los eventos SSE empiezan con "data: "
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event = JSON.parse(jsonStr)

            if (event.type === 'token') {
              // Acumular tokens y actualizar el último mensaje en tiempo real
              accumulated += event.content
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accumulated,
                  streaming: true,
                }
                return updated
              })
            } else if (event.type === 'done') {
              // Marcar el mensaje como completado (fin de streaming)
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accumulated || updated[updated.length - 1].content,
                  streaming: false,
                }
                return updated
              })
            } else if (event.type === 'error') {
              // Mostrar mensaje de error del servidor
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: event.message || 'Sorry, something went wrong.',
                  streaming: false,
                }
                return updated
              })
            }
          } catch {
            // Ignorar eventos SSE malformados
          }
        }
      }
    } catch {
      // Error de red o conexión — mostrar mensaje de error al usuario
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          streaming: false,
        }
        return updated
      })
    } finally {
      // Siempre marcar el streaming como terminado
      setIsStreaming(false)
    }
  }

  return (
    <>
      {/* Fondo oscuro en mobile cuando el panel está abierto */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleOpen}
        />
      )}

      {/* Panel de chat — pantalla completa en mobile, panel fijo en desktop */}
      {isOpen && (
        <div
          className={[
            'fixed z-50 flex flex-col bg-white overflow-hidden',
            'border border-neutral-200',
            // Mobile: pantalla completa
            'inset-x-0 bottom-0 top-0',
            // Desktop: panel en esquina inferior derecha con tamaño fijo
            'md:inset-auto md:bottom-20 md:right-4 md:w-[380px] md:top-auto',
            'md:rounded-2xl md:shadow-2xl md:max-h-[560px]',
          ].join(' ')}
        >
          {/* Cabecera del widget con título y botón de minimizar */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              {/* Icono de chat */}
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="font-semibold text-sm">{t('title')}</span>
            </div>

            {/* Botón para minimizar/cerrar el widget */}
            <button
              onClick={toggleOpen}
              aria-label={t('minimize')}
              className="rounded-full p-1 hover:bg-blue-500 transition-colors"
            >
              {/* Icono X de cerrar */}
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Área de mensajes con scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-50 max-h-96 md:max-h-none">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Burbuja de mensaje con estilos diferentes para usuario y asistente */}
                <div
                  className={[
                    'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-neutral-800 shadow-sm border border-neutral-100 rounded-bl-sm',
                  ].join(' ')}
                >
                  {/* Mostrar puntos animados mientras el asistente está pensando (streaming vacío) */}
                  {msg.role === 'assistant' && msg.streaming && !msg.content ? (
                    <span className="flex gap-1 items-center h-5">
                      <span
                        className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </span>
                  ) : (
                    // Renderizar el contenido con markdown básico
                    <div className="leading-relaxed">{renderMarkdown(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Prompts sugeridos — solo cuando hay exactamente 1 mensaje (bienvenida) y no hay streaming */}
            {messages.length === 1 && !isStreaming && (
              <div className="flex flex-col gap-2 pt-1">
                {[
                  t('suggestedPrompts.agents'),
                  t('suggestedPrompts.pricing'),
                  t('suggestedPrompts.help'),
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-sm rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Elemento invisible para anclar el auto-scroll al final */}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de entrada de texto y botón de envío */}
          <div className="border-t border-neutral-200 bg-white px-3 py-3 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage(input)
              }}
              className="flex gap-2"
            >
              {/* Campo de texto del usuario */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isStreaming ? t('thinking') : t('placeholder')}
                disabled={isStreaming}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="rounded-xl bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={t('send')}
              >
                {/* Icono de enviar */}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Botón flotante circular — visible solo cuando el chat está cerrado */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 group">
          {/* Tooltip "Chat with us" — solo visible en desktop al hacer hover */}
          <div className="hidden md:block bg-neutral-800 text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t('open')}
          </div>

          {/* Botón circular azul de 56px con icono de chat */}
          <button
            onClick={toggleOpen}
            aria-label={t('open')}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all"
          >
            {/* Icono de burbuja de chat */}
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
