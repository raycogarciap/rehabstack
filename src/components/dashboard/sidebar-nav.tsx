// Client Component: navegación del sidebar del dashboard.
// Usa Link y usePathname de @/i18n/navigation para que los hrefs lleven
// automáticamente el locale activo, y useTranslations para los labels.
// El selector de idioma vive en el layout (barra superior), no aquí.

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

// Iconos SVG inline
const IconDashboard = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
  </svg>
)

const IconAgents = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3a.75.75 0 0 0-1.5 0v.75H6A2.25 2.25 0 0 0 3.75 6v10.5A2.25 2.25 0 0 0 6 18.75h12A2.25 2.25 0 0 0 20.25 16.5V6A2.25 2.25 0 0 0 18 3.75h-2.25V3a.75.75 0 0 0-1.5 0v.75h-4.5V3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5H9Zm5.25 0a.75.75 0 0 0 0 1.5h.008a.75.75 0 0 0 0-1.5h-.008Z" />
  </svg>
)

const IconShowcase = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
)

const IconSettings = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

const IconSignOut = () => (
  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
)

interface SidebarNavProps {
  userEmail: string
}

export function SidebarNav({ userEmail }: SidebarNavProps) {
  const t = useTranslations('dashboard.nav')
  // usePathname de @/i18n/navigation devuelve la ruta SIN prefijo de locale
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Los hrefs sin locale — Link de @/i18n/navigation añade el locale automáticamente
  const NAV_LINKS = [
    { label: t('dashboard'), href: '/dashboard',         icon: <IconDashboard /> },
    { label: t('myAgents'), href: '/dashboard/agents',   icon: <IconAgents /> },
    { label: t('showcase'), href: '/dashboard/showcase', icon: <IconShowcase /> },
    { label: t('settings'), href: '/dashboard/settings', icon: <IconSettings /> },
  ] as const

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-blue-50 text-blue-700'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`

  return (
    <>
      {/* ============================================================
          BARRA SUPERIOR MÓVIL (visible solo en < md)
          ============================================================ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <span className="text-lg font-bold tracking-tight text-neutral-900">
          Rehab<span className="text-blue-600">Stack</span>
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
          <div className="flex items-center justify-between">
            <span className="truncate text-xs text-neutral-500">{userEmail}</span>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                {t('signOut')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          SIDEBAR ESCRITORIO (visible solo en >= md)
          ============================================================ */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-neutral-200 bg-white">
        {/* Logo */}
        <div className="flex h-14 items-center px-5 border-b border-neutral-100">
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            Rehab<span className="text-blue-600">Stack</span>
          </span>
        </div>

        {/* Links de navegación */}
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

        {/* Footer del sidebar: email del usuario y logout */}
        <div className="border-t border-neutral-100 px-3 py-3">
          <p className="mb-2 truncate px-3 text-xs text-neutral-500">{userEmail}</p>
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
