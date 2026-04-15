// Layout del dashboard — Server Component protegido.
// Verifica que el usuario esté autenticado (doble comprobación junto al middleware).
// Obtiene el email del usuario y lo pasa al SidebarNav (Client Component).
// El Suspense wrapping de DashboardNav es necesario en Next.js 15 porque
// las llamadas a cookies() en layouts con data-fetch pueden bloquear el streaming.

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

// Skeleton mínimo que se muestra mientras carga el sidebar con datos del usuario
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

// Componente async interno que carga los datos del usuario y renderiza el sidebar.
// Separado del layout principal para que Suspense pueda mostrar el skeleton
// mientras se resuelve la llamada a Supabase.
async function DashboardNav() {
  const supabase = await createClient();

  // getUser() valida el token contra Supabase Auth (más seguro que getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si el middleware falló o el token expiró, redirige al login
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
      {/* Sidebar con Suspense: muestra skeleton mientras carga los datos del usuario */}
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardNav />
      </Suspense>

      {/* Contenido principal de la página
          - pt-14: compensa la barra superior fija en móvil
          - md:pl-60: compensa el sidebar fijo en escritorio */}
      <main className="pt-14 md:pt-0 md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
