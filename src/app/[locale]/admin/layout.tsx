// Layout del Admin Panel — /[locale]/admin — Server Component protegido.
// Verifica que el usuario esté autenticado Y tenga role='admin'.
// Si no está autenticado → redirige a /[locale]/login
// Si está autenticado pero no es admin → redirige a /[locale]/dashboard

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebarNav } from '@/components/admin/admin-sidebar-nav'

// ─── Skeleton del sidebar mientras se cargan los datos ───────────────────────

function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-neutral-200 bg-white animate-pulse">
      <div className="h-14 border-b border-neutral-100 px-5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-200 shrink-0" />
        <div className="h-5 w-32 rounded bg-neutral-200" />
      </div>
      <div className="flex-1 px-3 py-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 rounded-md bg-neutral-100" />
        ))}
      </div>
      <div className="border-t border-neutral-100 px-3 py-3 space-y-2">
        <div className="h-7 w-24 rounded bg-neutral-100 mx-3" />
        <div className="h-4 w-32 rounded bg-neutral-100 mx-3" />
        <div className="h-8 rounded-md bg-neutral-100" />
      </div>
    </aside>
  )
}

// ─── Componente async interno: verifica auth + role y renderiza el sidebar ────

async function AdminNav() {
  const supabase = await createClient()
  const locale = await getLocale()

  // 1. Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // 2. Verificar role='admin'
  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    // Redirigir al dashboard de usuario — no mostrar 403 sin contexto
    redirect(`/${locale}/dashboard`)
  }

  return <AdminSidebarNav userEmail={profile.email ?? user.email ?? ''} />
}

// ─── Layout principal exportado ───────────────────────────────────────────────

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar con verificación de auth + role */}
      <Suspense fallback={<SidebarSkeleton />}>
        <AdminNav />
      </Suspense>

      {/* Contenido principal
          - pt-14: compensa la barra fija móvil del AdminSidebarNav
          - md:pl-60: compensa el sidebar fijo en escritorio */}
      <main className="pt-14 md:pt-0 md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
