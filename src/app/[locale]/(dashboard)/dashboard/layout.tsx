// Layout del dashboard — /[locale]/dashboard — Server Component protegido.
// Verifica autenticación y renderiza sidebar + contenido principal.
// El selector de idioma está en el workspace (agent-context) y en el navbar público.

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'

// Skeleton mínimo mientras carga el sidebar con datos del usuario
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
  )
}

// Componente async interno: carga datos del usuario y renderiza el sidebar.
async function DashboardNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const locale = await getLocale()
    redirect(`/${locale}/login`)
  }

  return <SidebarNav userEmail={user.email ?? ''} />
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar con Suspense */}
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardNav />
      </Suspense>

      {/* Contenido principal
          - pt-14: compensa la barra fija móvil del SidebarNav
          - md:pl-60: compensa el sidebar fijo en escritorio */}
      <main className="pt-14 md:pt-0 md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
