// Layout para /[locale]/agents/* — navbar proviene del [locale]/layout.tsx global.
// Mantiene el footer simple para agents, category y slug pages.
// Usado por: agents/page, agents/[category]/page, agents/[category]/[slug]/page.

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

async function PublicFooter() {
  const t = await getTranslations('nav')
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-neutral-200 bg-white mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-base font-bold text-neutral-900">
            Rehab<span className="text-blue-600">Stack</span>
          </span>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <Link href="/about"   className="hover:text-neutral-900 transition-colors">{t('about')}</Link>
            <Link href="/contact" className="hover:text-neutral-900 transition-colors">{t('contact')}</Link>
            <Link href="/docs"    className="hover:text-neutral-900 transition-colors">{t('docs')}</Link>
            <Link href="/blog"    className="hover:text-neutral-900 transition-colors">{t('blog')}</Link>
          </nav>
          <p className="text-xs text-neutral-400">© {year} Soulistica LLC · DBA RehabStack</p>
        </div>
      </div>
    </footer>
  )
}

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <main>{children}</main>
      <PublicFooter />
    </div>
  )
}
