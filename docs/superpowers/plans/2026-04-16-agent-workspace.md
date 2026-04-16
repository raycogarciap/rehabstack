# Agent Workspace Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Agent Workspace at `/dashboard/agents/[id]` — a full-screen chat interface with sidebar navigation, SSE streaming, Quick Actions, react-markdown rendering, and a mock agent for testing.

**Architecture:** Next.js App Router route groups separate the dashboard layout (`(dashboard)`) from the full-screen workspace layout (`(workspace)`), both resolving to `/dashboard/*` URLs. Agent data flows from a Server Component layout into child pages via a React Context Client Component (`AgentWorkspaceShell`). All agent communication goes through `agent-runtime.ts`.

**Tech Stack:** Next.js 16, TypeScript, Supabase SSR, shadcn/ui (`@base-ui/react`), Tailwind CSS, `react-markdown`, Anthropic SDK (already installed).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Move | `src/app/dashboard/layout.tsx` → `src/app/(dashboard)/dashboard/layout.tsx` | Dashboard sidebar layout |
| Move | `src/app/dashboard/page.tsx` → `src/app/(dashboard)/dashboard/page.tsx` | Dashboard home |
| Create | `src/app/(dashboard)/dashboard/agents/page.tsx` | My Agents list (Server Component) |
| Create | `src/lib/agent-context.tsx` | AgentContext + AgentWorkspaceShell Client Component |
| Create | `src/app/(workspace)/dashboard/agents/[id]/layout.tsx` | Workspace root (Server Component, fetches agent) |
| Create | `src/app/(workspace)/dashboard/agents/[id]/page.tsx` | Chat view (Client Component) |
| Create | `src/app/(workspace)/dashboard/agents/[id]/[...section]/page.tsx` | Coming-soon catch-all |
| Create | `src/app/api/agents/[id]/session/route.ts` | GET + POST session management |
| Create | `src/app/api/agents/[id]/message/route.ts` | POST → SSE stream |
| Create | `src/app/api/agents/mock/sessions/route.ts` | Mock session creation |
| Create | `src/app/api/agents/mock/sessions/[sessionId]/messages/route.ts` | Mock SSE stream |

---

## Task 1: Install react-markdown and verify build

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install react-markdown**

```bash
cd c:/Users/user/Desktop/4physio/rehabstack
npm install react-markdown
```

Expected output includes `added N packages` with no errors.

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd c:/Users/user/Desktop/4physio/rehabstack
npx tsc --noEmit
```

Expected: no errors (or same errors as before — do not introduce new ones).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-markdown"
```

---

## Task 2: Restructure dashboard to route group `(dashboard)`

**Files:**
- Create: `src/app/(dashboard)/dashboard/layout.tsx` (move from `src/app/dashboard/layout.tsx`)
- Create: `src/app/(dashboard)/dashboard/page.tsx` (move from `src/app/dashboard/page.tsx`)
- Delete: `src/app/dashboard/layout.tsx`
- Delete: `src/app/dashboard/page.tsx`

> Route groups (`(name)`) are invisible in the URL. Moving files into `(dashboard)/dashboard/` keeps URLs identical — `/dashboard` still works.

- [ ] **Step 1: Create the route group directory structure**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/(dashboard)/dashboard"
```

- [ ] **Step 2: Copy layout.tsx into route group**

Read `src/app/dashboard/layout.tsx` (already known from exploration). Write identical content to `src/app/(dashboard)/dashboard/layout.tsx`:

```tsx
// src/app/(dashboard)/dashboard/layout.tsx
// Layout del dashboard — Server Component protegido.
// Verifica que el usuario esté autenticado (doble comprobación junto al middleware).
// Obtiene el email del usuario y lo pasa al SidebarNav (Client Component).
// El Suspense wrapping de DashboardNav es necesario en Next.js 16 porque
// las llamadas a cookies() en layouts con data-fetch pueden bloquear el streaming.

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-neutral-200 bg-white animate-pulse">
      <div className="h-14 border-b border-neutral-100 px-5 flex items-center">
        <div className="h-5 w-32 rounded bg-neutral-200" />
      </div>
      <div className="flex-1 px-3 py-4 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 rounded-md bg-neutral-100" />
        ))}
      </div>
    </aside>
  );
}

async function DashboardNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SidebarNav userEmail={user.email ?? ""} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardNav />
      </Suspense>
      <main className="pt-14 md:pt-0 md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Copy page.tsx into route group**

Read `src/app/dashboard/page.tsx` (already known). Write identical content to `src/app/(dashboard)/dashboard/page.tsx`. The file content is unchanged — just the path moves.

- [ ] **Step 4: Delete old dashboard files**

```bash
rm "c:/Users/user/Desktop/4physio/rehabstack/src/app/dashboard/layout.tsx"
rm "c:/Users/user/Desktop/4physio/rehabstack/src/app/dashboard/page.tsx"
```

- [ ] **Step 5: Verify build still works**

```bash
cd c:/Users/user/Desktop/4physio/rehabstack
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 6: Start dev server and verify `/dashboard` loads**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard` — should load identical dashboard page with sidebar. If it 404s, the route group path is wrong — double-check directory nesting.

- [ ] **Step 7: Commit**

```bash
git add src/app/
git commit -m "refactor: move dashboard to (dashboard) route group"
```

---

## Task 3: Create `src/lib/agent-context.tsx`

**Files:**
- Create: `src/lib/agent-context.tsx`

- [ ] **Step 1: Create the context and shell component**

```tsx
// src/lib/agent-context.tsx
// React Context para datos del agente en el workspace.
// AgentWorkspaceShell: Client Component que renderiza el layout full-screen
// (top bar + sidebar + children + botón copilot).
// AgentContext permite a los Client Components hijos acceder a los datos del agente
// sin prop drilling ni llamadas adicionales a la BD.

"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  icon?: string;
  prompt: string;
}

export interface AgentData {
  id: string;
  name: string;
  category: string;
  hosting_type: string;
  quick_actions: QuickAction[];
  platform_agent_id: string | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AgentContext = createContext<AgentData | null>(null);

/** Hook para consumir datos del agente en Client Components dentro del workspace */
export function useAgent(): AgentData {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used inside AgentWorkspaceShell");
  return ctx;
}

// ─── Iconos SVG del sidebar ────────────────────────────────────────────────────

function IconChat() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
}

function IconWork() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  );
}

function IconChannels() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

function IconIntegrations() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconTeam() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconUsage() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function IconCopilot() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

// ─── AgentWorkspaceShell ──────────────────────────────────────────────────────

/**
 * Layout full-screen del workspace del agente.
 * Server Component (layout.tsx) fetchea el agente y pasa los datos aquí.
 * Este componente provee el contexto y renderiza:
 *   top bar | sidebar (desktop) | children | copilot button
 *   bottom tab bar (mobile)
 */
export function AgentWorkspaceShell({
  agent,
  children,
}: {
  agent: AgentData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Ítems de navegación del sidebar del agente
  const navItems = [
    { label: "Chat",         href: `/dashboard/agents/${agent.id}`,               icon: <IconChat /> },
    { label: "Work",         href: `/dashboard/agents/${agent.id}/work`,          icon: <IconWork /> },
    { label: "Channels",     href: `/dashboard/agents/${agent.id}/channels`,      icon: <IconChannels /> },
    { label: "Integrations", href: `/dashboard/agents/${agent.id}/integrations`,  icon: <IconIntegrations /> },
    { label: "Team",         href: `/dashboard/agents/${agent.id}/team`,          icon: <IconTeam /> },
    { label: "Settings",     href: `/dashboard/agents/${agent.id}/settings`,      icon: <IconSettings /> },
    { label: "Usage",        href: `/dashboard/agents/${agent.id}/usage`,         icon: <IconUsage /> },
  ] as const;

  // Chat es activo solo con match exacto para no solaparse con /work, /team, etc.
  const isActive = (href: string) =>
    href === `/dashboard/agents/${agent.id}`
      ? pathname === href
      : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-blue-50 text-blue-700"
        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
    }`;

  return (
    <AgentContext.Provider value={agent}>
      {/* Contenedor full-screen — sin herencia del layout del dashboard */}
      <div className="flex h-screen flex-col overflow-hidden bg-white">

        {/* ── Top bar ───────────────────────────────────────────────────────── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex items-center gap-3">
            {/* Volver a My Agents */}
            <Link href="/dashboard/agents">
              <Button variant="ghost" size="sm" className="gap-1.5 text-neutral-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                My Agents
              </Button>
            </Link>
            <span className="hidden h-4 w-px bg-neutral-200 sm:block" />
            <span className="hidden font-semibold text-neutral-900 sm:block">{agent.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="text-neutral-500">
              <IconBell />
            </Button>
          </div>
        </header>

        {/* ── Body: sidebar + contenido principal ───────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar — solo escritorio */}
          <nav className="hidden w-48 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {agent.name}
              </p>
              <div className="flex flex-col gap-0.5">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Contenido principal */}
          <main className="relative flex flex-1 flex-col overflow-hidden">
            {children}

            {/* ── Botón flotante Platform Copilot ─────────────────────────── */}
            <button
              onClick={() => setCopilotOpen((prev) => !prev)}
              aria-label="Platform Copilot"
              className="absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 md:bottom-6 md:right-6"
            >
              <IconCopilot />
            </button>

            {/* Panel del Copilot */}
            {copilotOpen && (
              <div className="absolute bottom-20 right-4 z-20 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl md:bottom-24 md:right-6">
                <div className="flex items-center justify-between border-b border-neutral-100 bg-purple-50 px-4 py-3">
                  <span className="text-sm font-semibold text-purple-800">Platform Copilot</span>
                  <button
                    onClick={() => setCopilotOpen(false)}
                    aria-label="Close Copilot"
                    className="rounded p-0.5 text-purple-600 hover:bg-purple-100"
                  >
                    <IconClose />
                  </button>
                </div>
                <div className="px-4 py-6 text-center text-sm text-neutral-500">
                  Platform Copilot coming soon.
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ── Bottom tab bar — solo móvil ─────────────────────────────────── */}
        <nav className="flex shrink-0 border-t border-neutral-200 bg-white md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive(item.href) ? "text-blue-600" : "text-neutral-500"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </AgentContext.Provider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd c:/Users/user/Desktop/4physio/rehabstack
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agent-context.tsx
git commit -m "feat: add AgentContext and AgentWorkspaceShell client component"
```

---

## Task 4: Create workspace layout `(workspace)/dashboard/agents/[id]/layout.tsx`

**Files:**
- Create: `src/app/(workspace)/dashboard/agents/[id]/layout.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/(workspace)/dashboard/agents/[id]"
```

- [ ] **Step 2: Create the layout**

```tsx
// src/app/(workspace)/dashboard/agents/[id]/layout.tsx
// Layout raíz del workspace del agente — Server Component.
// No hereda el layout del dashboard (route group separado).
// Fetchea los datos del agente desde Supabase y los provee via AgentWorkspaceShell.
// Si id === "mock", usa un agente hardcodeado para testing sin BD.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentWorkspaceShell, type AgentData } from "@/lib/agent-context";

// Agente de prueba — no requiere BD ni suscripción
const MOCK_AGENT: AgentData = {
  id: "mock",
  name: "Content Engine (Demo)",
  category: "grow-your-practice",
  hosting_type: "creator_hosted",
  quick_actions: [
    { label: "Record Voice Note", prompt: "I want to create content from a voice note. Please guide me." },
    { label: "Upload Photo/Video", prompt: "I have a photo or video I want to build content around." },
    { label: "Request Testimonial", prompt: "Help me craft a testimonial request to send to a patient." },
    { label: "Create VA Brief", prompt: "Create a virtual assistant brief for social media content creation." },
  ],
  platform_agent_id: null,
};

export const metadata: Metadata = {
  title: "Agent Workspace | RehabStack",
};

export default async function AgentWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let agent: AgentData;

  if (id === "mock") {
    // Modo demo: no requiere auth ni BD
    agent = MOCK_AGENT;
  } else {
    // Modo producción: requiere auth y agente en BD
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data } = await supabase
      .from("agents")
      .select("id, name, category, hosting_type, quick_actions, platform_agent_id")
      .eq("id", id)
      .single();

    if (!data) redirect("/dashboard/agents");
    agent = data as AgentData;
  }

  return <AgentWorkspaceShell agent={agent}>{children}</AgentWorkspaceShell>;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(workspace)/"
git commit -m "feat: add workspace layout with route group and AgentWorkspaceShell"
```

---

## Task 5: Create mock API endpoints

**Files:**
- Create: `src/app/api/agents/mock/sessions/route.ts`
- Create: `src/app/api/agents/mock/sessions/[sessionId]/messages/route.ts`

These implement the RehabStack Agent API Spec so `creator_hosted` flows work end-to-end.

- [ ] **Step 1: Create mock sessions route**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/api/agents/mock/sessions"
```

```ts
// src/app/api/agents/mock/sessions/route.ts
// Mock que implementa el RehabStack Agent API Spec para testing local.
// POST /api/agents/mock/sessions → crea una sesión mock sin BD ni servicio externo.

import { NextResponse } from "next/server";

export async function POST() {
  // Devuelve un session_id único para cumplir la interfaz del spec
  return NextResponse.json({
    session_id: `mock-session-${Date.now()}`,
  });
}
```

- [ ] **Step 2: Create mock messages route**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/api/agents/mock/sessions/[sessionId]/messages"
```

```ts
// src/app/api/agents/mock/sessions/[sessionId]/messages/route.ts
// Mock que implementa POST /sessions/{id}/messages del RehabStack Agent API Spec.
// Devuelve un SSE stream con una respuesta simulada token por token.

const MOCK_RESPONSE = `Hello! I'm the **Content Engine** running in demo mode.

Here's what I can help you with:

- **Instagram content packages** tailored to your practice specialty
- **VA briefs** so your virtual assistant can handle content creation
- **Testimonial requests** that feel natural to send to patients
- **Social media strategies** built around your clinical expertise

What would you like to work on today?`;

export async function POST() {
  const encoder = new TextEncoder();

  // Divide la respuesta en tokens (palabras + espacios) para el efecto streaming
  const tokens = MOCK_RESPONSE.match(/\S+\s*/g) ?? [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of tokens) {
        // Delay entre tokens para simular velocidad de generación real
        await new Promise((resolve) => setTimeout(resolve, 25));
        const event = JSON.stringify({ type: "token", content: token });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
```

- [ ] **Step 3: Test mock endpoints manually**

Start dev server if not running:
```bash
npm run dev
```

Test session creation:
```bash
curl -X POST http://localhost:3000/api/agents/mock/sessions
```
Expected: `{"session_id":"mock-session-1234567890"}`

Test message stream:
```bash
curl -X POST http://localhost:3000/api/agents/mock/sessions/mock-123/messages
```
Expected: SSE stream lines: `data: {"type":"token","content":"Hello! "}` … `data: {"type":"done"}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/agents/mock/
git commit -m "feat: add mock agent API endpoints (RehabStack Agent API Spec)"
```

---

## Task 6: Create session API route `/api/agents/[id]/session`

**Files:**
- Create: `src/app/api/agents/[id]/session/route.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/api/agents/[id]/session"
```

- [ ] **Step 2: Create the route**

```ts
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
```

- [ ] **Step 3: Test session GET for mock**

```bash
curl http://localhost:3000/api/agents/mock/session
```
Expected: `{"sessionId":"mock-db-session-id"}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/agents/
git commit -m "feat: add session API route with mock bypass"
```

---

## Task 7: Create message API route `/api/agents/[id]/message`

**Files:**
- Create: `src/app/api/agents/[id]/message/route.ts`

- [ ] **Step 1: Create the route**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/api/agents/[id]/message"
```

```ts
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
```

- [ ] **Step 2: Test mock message endpoint**

```bash
curl -X POST http://localhost:3000/api/agents/mock/message \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

Expected: SSE stream with tokens then `data: {"type":"done"}`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/agents/
git commit -m "feat: add message API route with SSE streaming and mock bypass"
```

---

## Task 8: Create My Agents list page

**Files:**
- Create: `src/app/(dashboard)/dashboard/agents/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/(dashboard)/dashboard/agents"
```

- [ ] **Step 2: Create the page**

```tsx
// src/app/(dashboard)/dashboard/agents/page.tsx
// Lista los agentes a los que el usuario está suscrito.
// Estado vacío: card con "No agents yet" + link al marketplace.
// Incluye un shortcut de desarrollo para abrir el agente mock.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Agents | RehabStack",
  description: "Manage your subscribed AI agents.",
};

// Icono robot para estado vacío
function IconRobot() {
  return (
    <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3a.75.75 0 0 0-1.5 0v.75H6A2.25 2.25 0 0 0 3.75 6v10.5A2.25 2.25 0 0 0 6 18.75h12A2.25 2.25 0 0 0 20.25 16.5V6A2.25 2.25 0 0 0 18 3.75h-2.25V3a.75.75 0 0 0-1.5 0v.75h-4.5V3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H9Zm5.25 0a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5h-.008Z" />
    </svg>
  );
}

export default async function MyAgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Busca suscripciones activas del usuario con datos del agente
  const { data: rows } = await supabase
    .from("subscriptions")
    .select("agent_id, agents(id, name, category, status)")
    .eq("user_id", user.id)
    .eq("status", "active");

  // Extrae y filtra los agentes (la relación puede devolver null si el agente fue eliminado)
  type AgentRow = { id: string; name: string; category: string; status: string };
  const agents: AgentRow[] = (rows ?? [])
    .map((r) => r.agents as AgentRow | null)
    .filter((a): a is AgentRow => a !== null);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">My Agents</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage and interact with your subscribed AI agents.
        </p>
      </div>

      {agents.length === 0 ? (
        /* Estado vacío */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <IconRobot />
            <h2 className="mt-4 text-lg font-semibold text-neutral-700">No agents yet</h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              Subscribe to an AI agent from the marketplace to get started.
            </p>
            <div className="mt-6">
              <Link href="/agents">
                <Button>Browse Marketplace</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grid de tarjetas de agentes */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{agent.name}</CardTitle>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      agent.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <CardDescription className="capitalize">
                  {agent.category?.replace(/-/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href={`/dashboard/agents/${agent.id}`}>
                  <Button className="w-full">Open Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shortcut de desarrollo: mock agent */}
      <div className="border-t border-dashed border-neutral-200 pt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Development
        </p>
        <Link href="/dashboard/agents/mock">
          <Button variant="outline" size="sm">
            Open Mock Agent →
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify `/dashboard/agents` loads in browser**

Navigate to `http://localhost:3000/dashboard/agents` — should show the empty state with "Browse Marketplace" and the "Open Mock Agent →" dev shortcut.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/agents/"
git commit -m "feat: add My Agents list page with empty state"
```

---

## Task 9: Create chat page `[id]/page.tsx`

**Files:**
- Create: `src/app/(workspace)/dashboard/agents/[id]/page.tsx`

- [ ] **Step 1: Create the chat page**

```tsx
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
  const { id } = useParams<{ id: string }>();
  const agent = useAgent();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null); // id del mensaje copiado

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastUserMessage = useRef<string>("");

  // ── Inicializa la sesión al montar ──────────────────────────────────────

  useEffect(() => {
    async function initSession() {
      try {
        // Primero intenta obtener una sesión activa existente
        const getRes = await fetch(`/api/agents/${id}/session`);
        const getData = await getRes.json() as { sessionId: string | null };

        if (getData.sessionId) {
          setSessionId(getData.sessionId);
          return;
        }

        // Si no existe, crea una nueva
        const postRes = await fetch(`/api/agents/${id}/session`, { method: "POST" });
        const postData = await postRes.json() as { sessionId: string };
        setSessionId(postData.sessionId);
      } catch {
        setError("Failed to initialize session. Please refresh the page.");
      }
    }

    initSession();
  }, [id]);

  // ── Auto-scroll al final cuando llegan mensajes ────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // ── Auto-resize del textarea ────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Resetea la altura para recalcular correctamente
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // ── Enviar mensaje ──────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string = input) => {
      const trimmed = content.trim();
      if (!trimmed || streaming || !sessionId) return;

      // Append mensaje de usuario inmediatamente (optimistic)
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      lastUserMessage.current = trimmed;
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
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

        // Lee el stream SSE token por token
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
                accumulated += event.content;
                setStreamingContent(accumulated);
              } else if (event.type === "done") {
                // Mueve el contenido acumulado como mensaje completo
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
              // Ignora líneas SSE que no son JSON válido
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

  // Envía con Enter (Shift+Enter = salto de línea)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copia texto al portapapeles con feedback visual
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
        {/* Estado vacío */}
        {messages.length === 0 && !streaming && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-medium text-neutral-700">{agent.name}</p>
            <p className="text-sm text-neutral-400">
              Start a conversation or use a Quick Action below.
            </p>
          </div>
        )}

        {/* Historial de mensajes */}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                /* Burbuja de usuario — derecha, azul */
                <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                  {msg.content}
                </div>
              ) : (
                /* Burbuja del agente — izquierda, blanca, con markdown */
                <div className="group relative max-w-[70%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
                  {/* Botón de copia — aparece al hacer hover */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    aria-label="Copy message"
                    className="absolute -top-2 right-3 hidden items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 shadow-sm transition hover:text-neutral-700 group-hover:flex"
                  >
                    <IconCopy />
                    {copied === msg.id ? "Copied!" : "Copy"}
                  </button>
                  {/* Renderizado markdown */}
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Mensaje en streaming — animación de puntos → texto */}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
                {streamingContent ? (
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                ) : (
                  /* Indicador de carga — tres puntos animados */
                  <div className="flex items-center gap-1 py-1">
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
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

      {/* ── Banner de error ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-3 border-t border-red-200 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => {
              setError(null);
              sendMessage(lastUserMessage.current);
            }}
            className="shrink-0 rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Input area ────────────────────────────────────────────────────── */}
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
            {/* Micrófono — placeholder deshabilitado */}
            <button
              disabled
              aria-label="Voice note (coming soon)"
              className="rounded-md p-1.5 text-neutral-300"
            >
              <IconMic />
            </button>
            {/* Adjunto — placeholder deshabilitado */}
            <button
              disabled
              aria-label="Attach file (coming soon)"
              className="rounded-md p-1.5 text-neutral-300"
            >
              <IconPaperclip />
            </button>
            {/* Botón enviar */}
            <Button
              size="icon-sm"
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim() || !sessionId}
              aria-label="Send message"
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Test in browser**

Navigate to `http://localhost:3000/dashboard/agents/mock`.

Verify:
- Full-screen layout (no dashboard sidebar)
- Top bar shows "← My Agents" + "Content Engine (Demo)"
- Agent sidebar on the left (Chat highlighted)
- 4 Quick Action buttons above input
- Send a message → animated dots appear → tokens stream in → markdown renders
- "Copy" button appears on hover over agent messages
- Retry button appears on simulated error (manually break the fetch to test)
- Mobile view: bottom tab bar, no left sidebar

- [ ] **Step 4: Commit**

```bash
git add "src/app/(workspace)/dashboard/agents/[id]/page.tsx"
git commit -m "feat: add agent chat page with SSE streaming and react-markdown"
```

---

## Task 10: Create catch-all for unimplemented sections

**Files:**
- Create: `src/app/(workspace)/dashboard/agents/[id]/[...section]/page.tsx`

- [ ] **Step 1: Create the catch-all**

```bash
mkdir -p "c:/Users/user/Desktop/4physio/rehabstack/src/app/(workspace)/dashboard/agents/[id]/[...section]"
```

```tsx
// src/app/(workspace)/dashboard/agents/[id]/[...section]/page.tsx
// Captura todas las rutas no implementadas del workspace (Work, Channels, etc.)
// y muestra un placeholder "Coming soon" con el nombre de la sección.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming Soon | RehabStack",
};

export default async function SectionPlaceholderPage({
  params,
}: {
  params: Promise<{ id: string; section: string[] }>;
}) {
  const { section } = await params;
  // Obtiene el nombre de la sección de la URL (p.ej. ["work"] → "Work")
  const sectionName = (section[0] ?? "").replace(/-/g, " ");
  const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">This section is coming soon.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test catch-all**

Navigate to `http://localhost:3000/dashboard/agents/mock/work` — should show "Work / This section is coming soon." with the workspace layout intact.

Navigate to `http://localhost:3000/dashboard/agents/mock/team` — should show "Team / This section is coming soon."

- [ ] **Step 3: Commit**

```bash
git add "src/app/(workspace)/dashboard/agents/[id]/[...section]/"
git commit -m "feat: add coming-soon catch-all for unimplemented workspace sections"
```

---

## Task 11: Final verification and push

- [ ] **Step 1: Full TypeScript check**

```bash
cd c:/Users/user/Desktop/4physio/rehabstack
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Verify all routes**

With `npm run dev` running, verify:

| URL | Expected |
|-----|----------|
| `http://localhost:3000/dashboard` | Dashboard home (sidebar visible) |
| `http://localhost:3000/dashboard/agents` | My Agents list (sidebar visible, "Open Mock Agent →" shortcut) |
| `http://localhost:3000/dashboard/agents/mock` | Chat workspace (full-screen, NO dashboard sidebar) |
| `http://localhost:3000/dashboard/agents/mock/work` | "Work — Coming soon" within workspace layout |
| `http://localhost:3000/dashboard/agents/mock/team` | "Team — Coming soon" within workspace layout |

- [ ] **Step 3: Test the complete chat flow**

1. Open `http://localhost:3000/dashboard/agents/mock`
2. Click "Record Voice Note" Quick Action → input pre-fills with the prompt
3. Press Enter → message bubble appears right, loading dots appear left
4. Tokens stream in → markdown renders (bold text visible)
5. Hover over agent message → "Copy" button appears, click it → clipboard updated
6. Click "← My Agents" → returns to `/dashboard/agents`
7. Click the purple Copilot button → panel opens with "coming soon" message
8. Click "Work" in sidebar → "Work — Coming soon" placeholder renders

- [ ] **Step 4: Final commit and push**

```bash
git add .
git commit -m "feat: agent workspace dashboard — full-screen chat, SSE streaming, route groups"
git push
```

---

## Quick Reference: SSE Event Format

```
data: {"type":"token","content":"partial text "}\n\n
data: {"type":"token","content":"more text"}\n\n
data: {"type":"done"}\n\n

# On error:
data: {"type":"error","message":"Description of what went wrong"}\n\n
```

## Quick Reference: Mock URLs

| URL | Purpose |
|-----|---------|
| `/dashboard/agents/mock` | Full chat workspace, no auth/DB required |
| `POST /api/agents/mock/session` | Returns `{sessionId: "mock-db-session-id"}` |
| `POST /api/agents/mock/message` | Returns SSE stream with canned markdown response |
| `POST /api/agents/mock/sessions` | Mock RehabStack Agent API Spec session endpoint |
| `POST /api/agents/mock/sessions/[id]/messages` | Mock RehabStack Agent API Spec message endpoint |
