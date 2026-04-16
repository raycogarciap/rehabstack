# Agent Workspace Dashboard — Design Spec
**Date:** 2026-04-16  
**Status:** Approved  
**Scope:** `/dashboard/agents` list page + `/dashboard/agents/[id]` workspace (full-screen, own layout)

---

## Overview

Build the Agent Management Dashboard for RehabStack — the place where subscribed users interact with their AI agents. Consists of two surfaces:

1. **My Agents list** (`/dashboard/agents`) — shows subscribed agents with "Open Dashboard" CTAs
2. **Agent Workspace** (`/dashboard/agents/[id]`) — full-screen chat interface with its own layout

---

## Architecture

### Route Group Strategy

Next.js App Router route groups allow two sibling groups to share the same URL namespace with different layouts. This enables `/dashboard/agents/[id]` to have a completely independent layout (no parent sidebar) while `/dashboard/agents` (list) continues to use the dashboard sidebar.

```
src/app/
  (dashboard)/               ← route group: layout con sidebar principal
    dashboard/
      layout.tsx             ← sidebar global (Dashboard, My Agents, Showcase, Settings)
      page.tsx
      agents/
        page.tsx             ← lista de agentes suscritos
  (workspace)/               ← route group: layout propio, pantalla completa
    dashboard/
      agents/
        [id]/
          layout.tsx         ← layout full-screen del workspace del agente
          page.tsx           ← chat view (default, Client Component)
```

**Important:** The existing `src/app/dashboard/` files must be moved into `src/app/(dashboard)/dashboard/` to activate the route group. The `(workspace)` group is placed alongside `(dashboard)` so it can use the same `/dashboard/agents/[id]` URL with its own root layout.

### Shared Context

Agent data fetched server-side in the layout is shared to child pages via React Context:

```
layout.tsx (Server)
  → fetchAgent(id) from Supabase
  → <AgentWorkspaceShell agent={agent}>{children}</AgentWorkspaceShell>

AgentWorkspaceShell (Client Component — src/lib/agent-context.tsx)
  → <AgentContext.Provider value={agent}>
      renders: top bar + sidebar + children + copilot button
    </AgentContext.Provider>

page.tsx (Client Component)
  → useAgent() hook to read agent data (quick_actions, name, etc.)
```

---

## Files to Create / Modify

### New files
| File | Type | Purpose |
|------|------|---------|
| `src/app/(dashboard)/dashboard/layout.tsx` | Server Component | Move existing dashboard layout here |
| `src/app/(dashboard)/dashboard/page.tsx` | Server Component | Move existing dashboard page here |
| `src/app/(dashboard)/dashboard/agents/page.tsx` | Server Component | Subscribed agents list |
| `src/app/(workspace)/dashboard/agents/[id]/layout.tsx` | Server Component | Workspace root layout |
| `src/app/(workspace)/dashboard/agents/[id]/page.tsx` | Client Component | Chat view |
| `src/lib/agent-context.tsx` | Client Component | React Context + AgentWorkspaceShell |
| `src/app/api/agents/[id]/message/route.ts` | API Route | POST → SSE stream |
| `src/app/api/agents/[id]/session/route.ts` | API Route | GET + POST session |
| `src/app/api/agents/mock/sessions/route.ts` | API Route | Mock session creation |
| `src/app/api/agents/mock/sessions/[sessionId]/messages/route.ts` | API Route | Mock SSE stream |

### Files to move (not modify)
- `src/app/dashboard/layout.tsx` → `src/app/(dashboard)/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx` → `src/app/(dashboard)/dashboard/page.tsx`

---

## Component Design

### `AgentWorkspaceShell` (Client Component)

Manages the full-screen layout and local UI state:

```
┌─────────────────────────────────────────────────────────┐
│ ← My Agents    [Agent Name]              🔔  [avatar]  │  h-14 top bar
├──────────────┬──────────────────────────────────────────┤
│  💬 Chat     │                                          │
│  📋 Work     │         {children}                      │
│  📡 Channels │                                          │
│  🔗 Integr.  │                                    [🤖]  │  floating copilot
│  👥 Team     │                                          │
│  ⚙️ Settings │                                          │
│  📊 Usage    │                                          │
└──────────────┴──────────────────────────────────────────┘
   w-48                  flex-1
```

**Mobile behavior:** Sidebar collapses to a bottom tab bar (7 icon tabs). Copilot button remains floating (purple, bottom-right above the tab bar).

**Sidebar nav items** (with placeholder content for non-Chat sections):
- Chat → `/dashboard/agents/[id]` (default, implemented)
- Work, Channels, Integrations, Team, Settings, Usage → handled by a catch-all route `[...section]/page.tsx` that renders a "Coming soon" card

This avoids 404s for unimplemented sections while keeping the nav functional. The catch-all reads `params.section[0]` to display the section name.

### Chat Page (`[id]/page.tsx`)

**State:**
```ts
messages: { id: string; role: "user" | "agent"; content: string; createdAt: Date }[]
input: string
streaming: boolean          // true = first token not yet received
streamingContent: string    // accumulated tokens during stream
error: string | null
sessionId: string | null    // dbSessionId from session API
```

**On mount:**
1. `GET /api/agents/[id]/session` → if sessionId exists, store it
2. If null → `POST /api/agents/[id]/session` → store new sessionId
3. Proceed (session guaranteed before first message)

**Send flow:**
1. Append `{ role: "user", content: input }` to messages
2. Clear input, set `streaming: true`
3. `fetch POST /api/agents/[id]/message` with `{ message, sessionId }`
4. Read `response.body` as `ReadableStream`
5. Parse each `data: {...}` line:
   - `{ type: "token", content }` → append to `streamingContent`, show animated bubble
   - `{ type: "done" }` → move `streamingContent` to messages array, reset streaming state
   - `{ type: "error", message }` → set `error`, show retry banner
6. On network error → set `error`

**Quick Actions bar:**
- Renders `agent.quick_actions` (from context) — up to 4 buttons
- Each has `{ label, icon?, prompt }` from JSONB
- Click → sets input to `prompt` (does not auto-send, lets user review)

**Message rendering:**
- User messages: right-aligned, blue bubble, plain text
- Agent messages: left-aligned, white card, `react-markdown` with Tailwind prose classes
- Each agent message has a "Copy" button (top-right of bubble, icon only)
- Streaming agent message: animated typing indicator (3 dots) until first token, then tokens appear inline

**Input area:**
- `<textarea>` auto-resize (1–5 rows), `onKeyDown Enter` sends (Shift+Enter = newline)
- Send button (disabled while streaming)
- Mic icon (placeholder, disabled)
- Paperclip icon (placeholder, disabled)

**Error state:** Full-width red banner above input with error message + "Retry" button that re-sends the last user message.

---

## API Routes

### `POST /api/agents/[id]/message`

```
1. Auth check → 401 if not authenticated
2. Parse body: { message: string, sessionId: string }
3. Validate inputs (message non-empty, sessionId present)
4. If id === "mock" → stream mock response (bypass agent-runtime)
5. Else → streamAgentMessage({ agentId: id, sessionId, message, userId })
6. Return Response(stream, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no" })
```

**Mock stream:** Splits a canned response string into tokens, emits each with 30ms delay, then emits `done`.

**SSE format:**
```
data: {"type":"token","content":"Hello "}
data: {"type":"token","content":"world!"}
data: {"type":"done"}
```

Error:
```
data: {"type":"error","message":"Agent unavailable"}
```

### `GET /api/agents/[id]/session`

```
1. Auth check
2. If id === "mock" → return { sessionId: "mock-db-session" }
3. Query sessions table: user_id = userId AND agent_id = id AND status = "active"
   ORDER BY created_at DESC LIMIT 1
4. Return { sessionId: row.id } or { sessionId: null }
```

### `POST /api/agents/[id]/session`

```
1. Auth check
2. If id === "mock" → return { sessionId: "mock-db-session", platformSessionId: "mock-platform" }
3. Call createAgentSession({ agentId: id, userId })
4. Return { sessionId: dbSessionId, platformSessionId }
```

### Mock endpoints (`/api/agents/mock/sessions/*`)

These implement the RehabStack Agent API Spec so the mock agent's `creator_hosted` flow works end-to-end through agent-runtime.ts:

- `POST /api/agents/mock/sessions` → `{ session_id: "mock-session-<timestamp>" }`
- `POST /api/agents/mock/sessions/[sessionId]/messages` → SSE stream with canned response

---

## My Agents List (`/dashboard/agents/page.tsx`)

Server Component. Queries:
```sql
SELECT subscriptions.*, agents.id, agents.name, agents.category, agents.status
FROM subscriptions
JOIN agents ON agents.id = subscriptions.agent_id
WHERE subscriptions.user_id = auth.uid()
  AND subscriptions.status = 'active'
```

Each agent card shows:
- Agent name + category badge
- Status indicator (active/inactive)
- "Open Dashboard" button → `href="/dashboard/agents/{agent.id}"`

Empty state: card with "No agents yet" + "Browse Marketplace" link to `/agents`.

`generateMetadata` → `"My Agents | RehabStack"`.

---

## Dependencies

```bash
npm install react-markdown
```

No other new dependencies. All UI uses existing shadcn/ui components.

---

## Mock Agent Setup

For testing without DB entries, two approaches work simultaneously:

1. **URL-based mock** (`/dashboard/agents/mock`): Layout detects `id === "mock"` and uses hardcoded agent object. Session and message API routes detect `id === "mock"` and bypass DB/agent-runtime.

2. **DB mock agent** (optional, for full end-to-end testing): Insert agent row with `hosting_type = "creator_hosted"`, `connection_config = { "base_url": "http://localhost:3000/api/agents/mock" }`. Any agent ID points through agent-runtime → mock endpoints.

---

## Coding Rules (from CLAUDE.md)

- TypeScript only, no plain JS
- Server Components by default; Client Components only for interactivity
- `<Link href="..."><Button>text</Button></Link>` — never `asChild`
- `generateMetadata()` on every page
- No API keys in client code
- Supabase SSR helpers (`@supabase/ssr`) for all auth
- Mobile-responsive from the start
