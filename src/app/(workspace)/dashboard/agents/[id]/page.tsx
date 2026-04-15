// src/app/(workspace)/dashboard/agents/[id]/page.tsx
// Vista de chat del workspace del agente — Client Component.
// Gestiona: sesión, historial de mensajes, SSE streaming, Quick Actions, input.
// Todos los datos del agente (name, quick_actions) vienen del AgentContext.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/lib/agent-context";

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  createdAt: Date;
}

// ─── Iconos inline ─────────────────────────────────────────────────────────

function IconSend() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
    </svg>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function AgentChatPage() {
  // useParams puede devolver string o string[] — normalizamos a string
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const agent = useAgent();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Guarda el último mensaje del usuario para poder reintentarlo
  const lastUserMessage = useRef<string>("");

  // ── Inicializa la sesión al montar ──────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    async function initSession() {
      try {
        // Intenta recuperar sesión existente
        const getRes = await fetch(`/api/agents/${id}/session`);
        const getData = await getRes.json() as { sessionId: string | null };

        if (getData.sessionId) {
          setSessionId(getData.sessionId);
          return;
        }

        // No hay sesión previa — crea una nueva
        const postRes = await fetch(`/api/agents/${id}/session`, { method: "POST" });
        const postData = await postRes.json() as { sessionId: string };
        setSessionId(postData.sessionId);
      } catch {
        setError("Failed to initialize session. Please refresh the page.");
      }
    }

    initSession();
  }, [id]);

  // ── Auto-scroll al final cuando llegan mensajes nuevos ─────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ── Auto-resize del textarea según el contenido ─────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // ── Enviar mensaje al agente via SSE streaming ──────────────────────────

  const sendMessage = useCallback(
    async (content: string = input) => {
      const trimmed = content.trim();
      // Guarda explícitamente sin sessionId en la dependencia para evitar stale closure
      if (!trimmed || streaming) return;
      // Guarda el sessionId actual de la closure — si es null, aborta
      if (!sessionId) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      // Persiste el mensaje para el botón de Retry
      lastUserMessage.current = trimmed;
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      // Resetea el alto del textarea
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setStreaming(true);
      setStreamingContent("");
      setError(null);

      try {
        const res = await fetch(`/api/agents/${id}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, sessionId }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        // Lee el stream SSE línea por línea
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event = JSON.parse(raw) as {
                type: "token" | "done" | "error";
                content?: string;
                message?: string;
              };

              if (event.type === "token" && event.content) {
                // Acumula tokens para renderizado progresivo
                accumulated += event.content;
                setStreamingContent(accumulated);
              } else if (event.type === "done") {
                // El stream terminó — agrega el mensaje completo al historial
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: "agent",
                    content: accumulated,
                    createdAt: new Date(),
                  },
                ]);
                setStreamingContent("");
                setStreaming(false);
              } else if (event.type === "error") {
                throw new Error(event.message ?? "Agent error");
              }
            } catch (parseErr) {
              // Ignora errores de JSON mal formado; relanza otros
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setStreaming(false);
        setStreamingContent("");
      }
    },
    [id, input, streaming, sessionId]
  );

  // Envía con Enter; Shift+Enter inserta salto de línea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copia el contenido de un mensaje al portapapeles con feedback visual
  const handleCopy = async (msgId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(msgId);
    setTimeout(() => setCopied(null), 1500);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Área de mensajes ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        {messages.length === 0 && !streaming && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-medium text-neutral-700">{agent.name}</p>
            <p className="text-sm text-neutral-400">
              Start a conversation or use a Quick Action below.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                // Burbuja del usuario — alineada a la derecha
                <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                  {msg.content}
                </div>
              ) : (
                // Burbuja del agente — con soporte Markdown y botón copiar
                <div className="group relative max-w-[70%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    aria-label="Copy message"
                    className="absolute -top-2 right-3 hidden items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 shadow-sm transition hover:text-neutral-700 group-hover:flex"
                  >
                    <IconCopy />
                    {copied === msg.id ? "Copied!" : "Copy"}
                  </button>
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Indicador de streaming — puntos animados o texto parcial */}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
                {streamingContent ? (
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                ) : (
                  // Puntos de espera mientras llega el primer token
                  <div className="flex items-center gap-1 py-1">
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ancla para el auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Quick Actions — accesos rápidos predefinidos del agente ─────── */}
      {agent.quick_actions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-neutral-100 px-4 py-2 scrollbar-none">
          {agent.quick_actions.slice(0, 4).map((action) => (
            <button
              key={action.label}
              onClick={() => setInput(action.prompt)}
              disabled={streaming}
              className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Banner de error con botón Retry ──────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-3 border-t border-red-200 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => {
              setError(null);
              // Pasa el mensaje guardado explícitamente para evitar stale closure
              sendMessage(lastUserMessage.current);
            }}
            className="shrink-0 rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Área de input con textarea auto-redimensionable ──────────────── */}
      <div className="shrink-0 border-t border-neutral-200 bg-white p-4 pb-safe">
        <div className="flex items-end gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400/20">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={sessionId ? "Message…" : "Initializing session…"}
            rows={1}
            disabled={streaming || !sessionId}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50"
            style={{ maxHeight: "160px" }}
          />
          <div className="flex shrink-0 items-center gap-1 pb-0.5">
            {/* Nota de voz — próximamente */}
            <button
              disabled
              aria-label="Voice note (coming soon)"
              className="rounded-md p-1.5 text-neutral-300"
            >
              <IconMic />
            </button>
            {/* Adjuntar archivo — próximamente */}
            <button
              disabled
              aria-label="Attach file (coming soon)"
              className="rounded-md p-1.5 text-neutral-300"
            >
              <IconPaperclip />
            </button>
            {/* Botón de envío — usa size="icon" (32×32 px) del componente Button */}
            <Button
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim() || !sessionId}
              aria-label="Send message"
              size="icon"
            >
              <IconSend />
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-neutral-400">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  );
}
