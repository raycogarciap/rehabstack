// Client Component: navegación del sidebar del Creator Dashboard.
// Sigue el mismo patrón que src/components/dashboard/sidebar-nav.tsx.
// Usa Link y usePathname de @/i18n/navigation para hrefs con locale automático,
// y useTranslations para los labels del namespace 'creator.nav'.

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/locale-switcher'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────

// Cuadrícula (Overview)
const IconOverview = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
  </svg>
)

// CPU / Robot (My Agents)
const IconAgents = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="8" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6M8 2h8M9 13h.01M15 13h.01M9 17h6" />
  </svg>
)

// Más / Plus (New Agent)
const IconPlus = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

// Barras / Chart (Revenue)
const IconRevenue = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-5 4 3 4-6 4 4M3 21h18" />
  </svg>
)

// Documento / Book (Docs)
const IconDocs = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 8h14M7 4h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </svg>
)

// Engranaje (Settings)
const IconSettings = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

// Flecha salida (Sign Out)
const IconSignOut = () => (
  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreatorSidebarNavProps {
  userEmail: string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CreatorSidebarNav({ userEmail }: CreatorSidebarNavProps) {
  const t = useTranslations('creator.nav')
  // usePathname de @/i18n/navigation devuelve la ruta SIN prefijo de locale
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Los hrefs no incluyen locale; Link de @/i18n/navigation lo añade automáticamente
  const NAV_LINKS = [
    { label: t('overview'),  href: '/creator',              icon: <IconOverview /> },
    { label: t('myAgents'), href: '/creator/agents',        icon: <IconAgents />  },
    { label: t('newAgent'), href: '/creator/agents/new',    icon: <IconPlus />    },
    { label: t('revenue'),  href: '/creator/revenue',       icon: <IconRevenue /> },
    { label: t('docs'),     href: '/creator/docs',          icon: <IconDocs />    },
    { label: t('settings'), href: '/creator/settings',      icon: <IconSettings />},
  ] as const

  // Overview usa coincidencia exacta; las demás usan startsWith
  const isActive = (href: string) =>
    href === '/creator' ? pathname === href : pathname.startsWith(href)

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-blue-50 text-blue-700'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`

  return (
    <>
      {/* ================================================================
          BARRA SUPERIOR MÓVIL (visible solo en < md)
          ================================================================ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4">
        {/* Título del Creator Dashboard en móvil */}
        <span className="text-sm font-semibold text-neutral-900 truncate">
          {t('title')}
        </span>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
        >
          {mobileOpen ? (
            // Icono X para cerrar
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Icono hamburguesa para abrir
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </header>

      {/* Menú desplegable móvil */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 border-b border-neutral-200 bg-white px-4 py-3 shadow-sm">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(link.href)}
                onClick={() => setMobileOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          <Separator className="my-3" />

          {/* Footer móvil: email, selector de locale y cerrar sesión */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-neutral-500">{userEmail}</span>
            <LocaleSwitcher />
          </div>
          <form action="/api/auth/signout" method="POST" className="mt-2">
            <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <IconSignOut />
              {t('signOut')}
            </Button>
          </form>
        </div>
      )}

      {/* ================================================================
          SIDEBAR ESCRITORIO (visible solo en >= md)
          ================================================================ */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-neutral-200 bg-white">
        {/* Cabecera del sidebar: título del Creator Dashboard */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-neutral-100">
          <span className="text-sm font-semibold text-neutral-900 truncate">
            {t('title')}
          </span>
        </div>

        {/* Links de navegación principal */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer del sidebar: selector de locale, email del usuario y cerrar sesión */}
        <div className="border-t border-neutral-100 px-3 py-3 space-y-2">
          {/* Selector de idioma */}
          <div className="px-3">
            <LocaleSwitcher />
          </div>

          {/* Email del usuario */}
          <p className="truncate px-3 text-xs text-neutral-500">{userEmail}</p>

          {/* Botón de cerrar sesión */}
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <IconSignOut />
              {t('signOut')}
            </Button>
          </form>
        </div>
      </aside>
    </>
  )
}
