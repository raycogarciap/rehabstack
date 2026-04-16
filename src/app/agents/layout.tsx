// src/app/agents/layout.tsx
// Layout público compartido por todas las rutas /agents/*.
// Incluye navbar sticky con logo + navegación + footer.
// Server Component — sin interactividad.

import Link from 'next/link'

// ── Navbar pública ────────────────────────────────────────────────────────────
function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-neutral-900">
          Rehab<span className="text-blue-600">Stack</span>
        </Link>

        {/* Navegación central */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 sm:flex">
          <Link href="/agents"       className="text-blue-600">Agents</Link>
          <Link href="/pricing"      className="hover:text-neutral-900 transition-colors">Pricing</Link>
          <Link href="/for-creators" className="hover:text-neutral-900 transition-colors">For Creators</Link>
          <Link href="/showcase"     className="hover:text-neutral-900 transition-colors">Showcase</Link>
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/login"
            className="hidden text-neutral-600 hover:text-neutral-900 transition-colors sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-white hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── Footer público ────────────────────────────────────────────────────────────
function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-base font-bold text-neutral-900">
            Rehab<span className="text-blue-600">Stack</span>
          </span>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <Link href="/about"   className="hover:text-neutral-900 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-neutral-900 transition-colors">Contact</Link>
            <Link href="/docs"    className="hover:text-neutral-900 transition-colors">Docs</Link>
            <Link href="/blog"    className="hover:text-neutral-900 transition-colors">Blog</Link>
          </nav>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Soulistica LLC · DBA RehabStack
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  )
}
