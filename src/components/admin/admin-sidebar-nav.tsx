// Componente Client: navegación del sidebar del Panel de Administración.
// Sigue el mismo patrón que creator-sidebar-nav.tsx pero con acentos rojos
// para diferenciar visualmente el área de administración.
// Usa Link y usePathname de @/i18n/navigation para hrefs con locale automático.

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

// Lista con check (Review Queue)
const IconReview = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 4h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </svg>
)

// Robot (Agents)
const IconAgents = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="8" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6M8 2h8M9 13h.01M15 13h.01M9 17h6" />
  </svg>
)

// Personas (Users)
const IconUsers = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-5-3.87M9 20H4v-2a4 4 0 0 1 5-3.87m6-4a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6-4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

// Barras (Revenue)
const IconRevenue = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-5 4 3 4-6 4 4M3 21h18" />
  </svg>
)

// Documento con bandera (Reports)
const IconReports = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 7h10l-2 4 2 4H3" />
  </svg>
)

// Flecha salida (Sign Out)
const IconSignOut = () => (
  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminSidebarNavProps {
  userEmail: string
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AdminSidebarNav({ userEmail }: AdminSidebarNavProps) {
  const t = useTranslations('admin.nav')
  // usePathname de @/i18n/navigation devuelve la ruta SIN prefijo de locale
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NAV_LINKS = [
    { label: t('overview'),     href: '/admin',                icon: <IconOverview /> },
    { label: t('reviewQueue'), href: '/admin/review-queue',    icon: <IconReview />   },
    { label: t('agents'),      href: '/admin/agents',          icon: <IconAgents />   },
    { label: t('users'),       href: '/admin/users',           icon: <IconUsers />    },
    { label: t('revenue'),     href: '/admin/revenue',         icon: <IconRevenue />  },
    { label: t('reports'),     href: '/admin/reports',         icon: <IconReports />  },
  ] as const

  // Overview usa coincidencia exacta; las demás usan startsWith
  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href)

  // Acentos rojos para diferenciar del creator dashboard (azul)
  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-red-50 text-red-700'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`

  return (
    <>
      {/* ================================================================
          BARRA SUPERIOR MÓVIL (visible solo en < md)
          ================================================================ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4">
        {/* Título del panel admin en móvil — con indicador rojo */}
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 truncate">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          {t('title')}
        </span>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
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
        {/* Cabecera: título con indicador rojo para distinguir del creator */}
        <div className="flex h-14 items-center gap-2 px-5 border-b border-neutral-100">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0" />
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

        {/* Footer: selector de locale, email y cerrar sesión */}
        <div className="border-t border-neutral-100 px-3 py-3 space-y-2">
          <div className="px-3">
            <LocaleSwitcher />
          </div>
          <p className="truncate px-3 text-xs text-neutral-500">{userEmail}</p>
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
