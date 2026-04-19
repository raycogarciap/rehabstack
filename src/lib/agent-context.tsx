// src/lib/agent-context.tsx
// React Context para datos del agente en el workspace.
// AgentWorkspaceShell: Client Component que renderiza el layout full-screen
// (top bar + sidebar + children + botón copilot).
// Usa Link y usePathname de @/i18n/navigation para que la detección de ruta
// activa funcione correctamente con cualquier locale (pathname sin prefijo).

'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/locale-switcher'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface QuickAction {
  label: string
  icon?: string
  prompt: string
}

export interface AgentData {
  id: string
  name: string
  category: string
  hosting_type: string
  quick_actions: QuickAction[]
  platform_agent_id: string | null
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AgentContext = createContext<AgentData | null>(null)

/** Hook para consumir datos del agente en Client Components dentro del workspace */
export function useAgent(): AgentData {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used inside AgentWorkspaceShell')
  return ctx
}

// ─── Iconos SVG del sidebar ────────────────────────────────────────────────────

function IconChat() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  )
}

function IconWork() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  )
}

function IconChannels() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
    </svg>
  )
}

function IconIntegrations() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function IconTeam() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function IconUsage() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function IconCopilot() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

// ─── AgentWorkspaceShell ──────────────────────────────────────────────────────

/**
 * Layout full-screen del workspace del agente.
 * Server Component (layout.tsx) fetchea el agente y pasa los datos aquí.
 * Este componente provee el contexto y renderiza:
 *   top bar | sidebar (desktop) | children | copilot button
 *   bottom tab bar (mobile)
 *
 * Usa Link y usePathname de @/i18n/navigation para que los hrefs y la
 * detección de ruta activa funcionen correctamente con cualquier locale.
 */
export function AgentWorkspaceShell({
  agent,
  children,
}: {
  agent: AgentData
  children: ReactNode
}) {
  // usePathname de @/i18n/navigation devuelve la ruta SIN prefijo de locale
  const pathname = usePathname()
  const t = useTranslations('dashboard.nav')
  const [copilotOpen, setCopilotOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCopilotOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Ítems de navegación del sidebar del agente
  // Los hrefs sin locale — Link de @/i18n/navigation los completa automáticamente
  const navItems = [
    { label: 'Chat',         href: `/dashboard/agents/${agent.id}`,              icon: <IconChat /> },
    { label: 'Work',         href: `/dashboard/agents/${agent.id}/work`,         icon: <IconWork /> },
    { label: 'Channels',     href: `/dashboard/agents/${agent.id}/channels`,     icon: <IconChannels /> },
    { label: 'Integrations', href: `/dashboard/agents/${agent.id}/integrations`, icon: <IconIntegrations /> },
    { label: 'Team',         href: `/dashboard/agents/${agent.id}/team`,         icon: <IconTeam /> },
    { label: 'Settings',     href: `/dashboard/agents/${agent.id}/settings`,     icon: <IconSettings /> },
    { label: 'Usage',        href: `/dashboard/agents/${agent.id}/usage`,        icon: <IconUsage /> },
  ]

  // Chat activo solo con match exacto; demás secciones usan startsWith
  const isActive = (href: string) =>
    href === `/dashboard/agents/${agent.id}`
      ? pathname === href
      : pathname.startsWith(href)

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-blue-50 text-blue-700'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`

  return (
    <AgentContext.Provider value={agent}>
      {/* Contenedor full-screen — sin herencia del layout del dashboard */}
      <div className="flex h-screen flex-col overflow-hidden bg-white">

        {/* ── Top bar ───────────────────────────────────────────────────────── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex items-center gap-3">
            {/* Volver a My Agents — Link locale-aware */}
            <Link href="/dashboard/agents">
              <Button variant="ghost" size="sm" className="gap-1.5 text-neutral-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                {t('myAgents')}
              </Button>
            </Link>
            <span className="hidden h-4 w-px bg-neutral-200 sm:block" />
            <span className="hidden font-semibold text-neutral-900 sm:block">{agent.name}</span>
          </div>

          {/* Acciones derechas: LocaleSwitcher + notificaciones */}
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
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
                isActive(item.href) ? 'text-blue-600' : 'text-neutral-500'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </AgentContext.Provider>
  )
}
