// src/app/[locale]/showcase/layout.tsx
// Layout Server Component para /showcase — exporta metadata SEO.
// El page.tsx es "use client" (tabs con useState), por eso la metadata va aquí.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Showcase | RehabStack',
  description: 'Real results from rehabilitation professionals using RehabStack AI assistants.',
  openGraph: {
    title: 'Showcase | RehabStack',
    description: 'Real results from rehabilitation professionals using RehabStack AI assistants.',
    type: 'website',
  },
}

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
