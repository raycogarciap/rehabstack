// Página de documentación para creadores — /[locale]/creator/docs
// Server Component estático: documenta la RehabStack Agent API Spec.
// No requiere interactividad; el contenido es JSX puro sin MDX.

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.docs' })
  return {
    title: t('metaTitle'),
  }
}

// ── Subcomponente: badge de método HTTP con color según verbo ─────────────────

function MethodBadge({ method }: { method: 'POST' | 'GET' | 'DELETE' }) {
  // POST = azul, GET = verde, DELETE = rojo
  const colors: Record<string, string> = {
    POST:   'bg-blue-100 text-blue-700 border border-blue-200',
    GET:    'bg-green-100 text-green-700 border border-green-200',
    DELETE: 'bg-red-100 text-red-700 border border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold ${colors[method]}`}
    >
      {method}
    </span>
  )
}

// ── Subcomponente: bloque de endpoint de API ──────────────────────────────────

interface EndpointBlockProps {
  method: 'POST' | 'GET' | 'DELETE'
  path: string
  description: string
  requestBody?: string
  responseBody: string
}

function EndpointBlock({ method, path, description, requestBody, responseBody }: EndpointBlockProps) {
  return (
    /* Tarjeta con borde sutil para cada endpoint */
    <div className="rounded-lg border border-neutral-200 p-4 mb-4 bg-white">
      {/* Línea de encabezado: badge del método + ruta en código monoespaciado */}
      <div className="flex items-center gap-2 mb-2">
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-neutral-800">{path}</code>
      </div>

      {/* Descripción breve del endpoint */}
      <p className="text-sm text-neutral-600 mb-3">{description}</p>

      {/* Cuerpo de la petición (solo si aplica) */}
      {requestBody && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Request</p>
          <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100">
            <code>{requestBody}</code>
          </pre>
        </div>
      )}

      {/* Cuerpo de la respuesta */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Response</p>
        <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100">
          <code>{responseBody}</code>
        </pre>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────

export default async function CreatorDocsPage() {
  // Obtenemos traducciones del namespace creator.docs
  const t = await getTranslations('creator.docs')

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Encabezado principal ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {t('title')}
        </h1>
        <p className="mt-1 text-neutral-500">{t('subtitle')}</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sección 1: Descripción general de los 4 tipos de alojamiento          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Overview</h2>
        <p className="text-sm text-neutral-600 mb-4">
          RehabStack supports four agent hosting types. Choose the one that best fits your
          infrastructure and technical expertise.
        </p>

        {/* Lista de tipos con descripción inline */}
        <ul className="space-y-3 text-sm text-neutral-700">
          <li>
            <code className="font-mono text-blue-700 bg-blue-50 rounded px-1">managed_anthropic</code>
            {' — '}Built on the <strong>Anthropic Managed Agents API</strong>. Simplest option —
            just provide your Anthropic Agent ID and API key. RehabStack handles all session
            routing and infrastructure.
          </li>
          <li>
            <code className="font-mono text-neutral-500 bg-neutral-100 rounded px-1">managed_openai</code>
            {' — '}Coming soon. OpenAI managed agent hosting is not yet available.
          </li>
          <li>
            <code className="font-mono text-blue-700 bg-blue-50 rounded px-1">creator_hosted</code>
            {' — '}You host a <strong>REST API</strong> that implements the RehabStack Agent API
            Spec documented below. RehabStack calls your endpoints; you control the model,
            prompt, and logic.
          </li>
          <li>
            <code className="font-mono text-blue-700 bg-blue-50 rounded px-1">self_hosted_package</code>
            {' — '}End users deploy your agent package on <strong>their own infrastructure</strong>.
            Lower commission, highest technical complexity for end users.
          </li>
        </ul>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sección 2: Tabla comparativa de tipos de alojamiento                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Hosting Types</h2>

        {/* Tabla responsive con scroll horizontal en pantallas pequeñas */}
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full text-sm text-neutral-700">
            <thead className="bg-neutral-50 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Hosting Type</th>
                <th className="px-4 py-3 text-left">Infrastructure</th>
                <th className="px-4 py-3 text-left">Commission</th>
                <th className="px-4 py-3 text-left">Complexity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              <tr>
                <td className="px-4 py-3 font-mono text-blue-700">managed_anthropic</td>
                <td className="px-4 py-3">Anthropic</td>
                <td className="px-4 py-3">20–25%</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Low</span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-blue-700">creator_hosted</td>
                <td className="px-4 py-3">Your servers</td>
                <td className="px-4 py-3">20–25%</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Medium</span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-blue-700">self_hosted_package</td>
                <td className="px-4 py-3">{"User's servers"}</td>
                <td className="px-4 py-3">10–15%</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">High</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sección 3: Especificación de la API para creator_hosted               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Creator-Hosted API Specification
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          Your API must implement these endpoints. All requests from RehabStack will include
          an <code className="font-mono bg-neutral-100 rounded px-1">Authorization: Bearer &lt;your-api-key&gt;</code> header.
        </p>

        {/* POST /sessions — Crear sesión */}
        <EndpointBlock
          method="POST"
          path="/sessions"
          description="Create a new conversation session. Store session state server-side. Called once per user dashboard open."
          requestBody={`{
  "user_id": "uuid",
  "agent_id": "uuid",
  "user_profile": {
    "name": "Dr. Ana García",
    "specialty": "Sports Rehabilitation",
    "language": "es"
  }
}`}
          responseBody={`{
  "session_id": "string",
  "welcome_message": "Hello! How can I help you today?" // optional
}`}
        />

        {/* POST /sessions/{session_id}/messages — Enviar mensaje con streaming */}
        <EndpointBlock
          method="POST"
          path="/sessions/{session_id}/messages"
          description="Send a message and receive a streaming response via Server-Sent Events (SSE). RehabStack streams this directly to the user's browser."
          requestBody={`{
  "message": "I need 3 Instagram posts about rotator cuff exercises",
  "session_id": "string"
}`}
          responseBody={`// Content-Type: text/event-stream

data: {"type": "text", "content": "Here are "}
data: {"type": "text", "content": "3 Instagram posts..."}
data: {"type": "done"}`}
        />

        {/* GET /sessions/{session_id}/history — Historial */}
        <EndpointBlock
          method="GET"
          path="/sessions/{session_id}/history"
          description="Retrieve the full message history for a session. Used to restore context when a user reopens their dashboard."
          responseBody={`{
  "messages": [
    {
      "role": "user",
      "content": "I need 3 Instagram posts...",
      "timestamp": "2026-04-20T14:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Here are 3 Instagram posts...",
      "timestamp": "2026-04-20T14:00:05Z"
    }
  ]
}`}
        />

        {/* DELETE /sessions/{session_id} — Cerrar sesión */}
        <EndpointBlock
          method="DELETE"
          path="/sessions/{session_id}"
          description="Terminate a session and clean up any server-side resources (memory, temp files, etc.)."
          responseBody={`{
  "success": true
}`}
        />

        {/* GET /health — Health check */}
        <EndpointBlock
          method="GET"
          path="/health"
          description="Health check endpoint. RehabStack pings this periodically to verify uptime and display agent availability in the marketplace."
          responseBody={`{
  "status": "ok",
  "version": "1.0.0"
}`}
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sección 4: Formato de Quick Actions                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Quick Actions</h2>
        <p className="text-sm text-neutral-600 mb-3">
          <code className="font-mono bg-neutral-100 rounded px-1">quick_actions</code> is a JSONB
          array stored on your agent record (up to 4 items). Each item has this shape:
        </p>

        {/* Bloque de código: formato de Quick Action */}
        <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100 mb-3">
          <code>{`{
  "id": "unique-id",
  "icon": "🚀",
  "label": "Create Content",
  "prompt": "Create a social media content package based on..."
}`}</code>
        </pre>

        <p className="text-sm text-neutral-600">
          When a user clicks a Quick Action button in their dashboard, RehabStack sends the{' '}
          <code className="font-mono bg-neutral-100 rounded px-1">prompt</code> value directly to
          your <code className="font-mono bg-neutral-100 rounded px-1">POST /sessions/{'{id}'}/messages</code> endpoint.
          Design prompts that are immediately useful without requiring additional user input.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sección 5: Guía de Test Scenarios                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Test Scenarios Guide</h2>
        <p className="text-sm text-neutral-600 mb-3">
          A minimum of <strong>3 test scenarios</strong> are required for marketplace listing.
          The RehabStack review team uses these to verify your agent behaves as described.
          Each scenario has this format:
        </p>

        {/* Bloque de código: formato de test scenario */}
        <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100 mb-4">
          <code>{`{
  "user_message": "I need 3 Instagram posts about rotator cuff exercises",
  "expected_behavior": "Agent should generate 3 Instagram posts with captions, hashtags, and image descriptions relevant to rotator cuff rehabilitation"
}`}</code>
        </pre>

        {/* Consejos para escribir buenos test scenarios */}
        <p className="text-sm font-semibold text-neutral-700 mb-2">Tips for strong test scenarios:</p>
        <ul className="space-y-1 text-sm text-neutral-600 list-disc list-inside">
          <li>
            <strong>Happy path</strong> — a clear, well-formed request your agent handles perfectly.
          </li>
          <li>
            <strong>Edge cases</strong> — empty input, very short queries, or off-topic requests
            (e.g., &quot;What is the weather today?&quot;). Document how your agent redirects gracefully.
          </li>
          <li>
            <strong>Error handling</strong> — what happens when the agent cannot fulfill the request?
            It should explain its limitations clearly instead of hallucinating.
          </li>
        </ul>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Sección 6: Ejemplo de implementación en Python / FastAPI               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Implementation Example (creator_hosted)
        </h2>
        <p className="text-sm text-neutral-600 mb-3">
          A minimal working implementation using Python and FastAPI. In production, replace
          the in-memory <code className="font-mono bg-neutral-100 rounded px-1">sessions</code> dict
          with Redis or a database.
        </p>

        {/* Bloque de código Python completo */}
        <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100">
          <code>{`from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic
import uuid

app = FastAPI()
sessions = {}  # In production, use Redis or a database

@app.post("/sessions")
async def create_session(body: dict):
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "history": [],
        "user_profile": body.get("user_profile", {})
    }
    return {"session_id": session_id}

@app.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, body: dict):
    client = anthropic.Anthropic()
    session = sessions[session_id]
    session["history"].append({"role": "user", "content": body["message"]})

    async def generate():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=session["history"]
        ) as stream:
            for text in stream.text_stream:
                yield f'data: {{"type": "text", "content": "{text}"}}\\n\\n'
        yield 'data: {"type": "done"}\\n\\n'

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}`}</code>
        </pre>
      </section>

      {/* ── Separador visual ────────────────────────────────────────────────── */}
      <hr className="border-neutral-200" />

      {/* ── Pie de página: enlace a documentación completa ──────────────────── */}
      <div className="flex items-center gap-3 pb-4">
        <Link href="/docs">
          <Button variant="outline">{t('fullDocs')}</Button>
        </Link>
      </div>
    </div>
  )
}
