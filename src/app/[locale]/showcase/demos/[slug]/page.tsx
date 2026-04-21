// src/app/[locale]/showcase/demos/[slug]/page.tsx
// Página de detalle de un demo de agente — Server Component.
// Muestra vídeo embed completo, descripción larga por párrafos, CTA y share button.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AGENT_DEMOS } from '@/lib/demo-data'
import { ShareButton } from '@/components/showcase/ShareButton'

// ── Metadata dinámica ─────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const demo = AGENT_DEMOS.find((d) => d.slug === slug)
  return {
    title: demo ? `${demo.title} | RehabStack Showcase` : 'Demo | RehabStack',
    description: demo?.description ?? '',
    openGraph: {
      title: demo?.title ?? 'Agent Demo',
      description: demo?.description ?? '',
      type: 'video.other',
    },
  }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function DemoDetailPage({ params }: Props) {
  const { slug } = await params
  const demo = AGENT_DEMOS.find((d) => d.slug === slug)
  if (!demo) notFound()

  return (
    <>
      {/* ── 1. Breadcrumb ─────────────────────────────────────────────── */}
      <div className="bg-[#F8FAFC] border-b border-gray-100 py-3 px-4">
        <nav
          aria-label="Breadcrumb"
          className="max-w-4xl mx-auto text-sm text-[#64748B] flex items-center gap-1 flex-wrap"
        >
          <Link href="/showcase" className="hover:text-[#1E293B] transition-colors">
            Showcase
          </Link>
          <span className="mx-1">→</span>
          <Link href="/showcase" className="hover:text-[#1E293B] transition-colors">
            Agent Demos
          </Link>
          <span className="mx-1">→</span>
          <span className="text-[#1E293B] font-medium line-clamp-1">{demo.title}</span>
        </nav>
      </div>

      {/* ── 2. Hero — vídeo + info principal ─────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        {/* Badge de categoría + link al agente */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: demo.badgeColor, backgroundColor: demo.badgeBg }}
          >
            {demo.categoryBadge}
          </span>
          <Link
            href={`/agents/${demo.agentCategory}/${demo.agentSlug}`}
            className="text-sm text-[#64748B] hover:text-[#4F46E5] transition-colors font-medium"
          >
            {demo.agentName} →
          </Link>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-[#1E293B] mb-4 leading-snug">{demo.title}</h1>

        {/* Fecha + tags */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm text-[#94A3B8]">{demo.datePosted}</span>
          {demo.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#F1F5F9] text-[#475569] text-xs px-2 py-0.5 rounded font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Vídeo embed — aspect ratio 16:9 */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          <iframe
            src={demo.videoUrl}
            title={demo.title}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>

        {/* Caption del vídeo */}
        <p className="text-sm text-[#94A3B8] text-center mt-3">{demo.title}</p>
      </div>

      {/* ── 3. Descripción larga ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-12 border-t border-gray-100">
        <h2 className="text-xl font-bold text-[#1E293B] mb-6">What this demo shows</h2>
        {demo.longDescription.split('\n\n').map((para, i) => (
          <p key={i} className="text-lg text-[#1E293B] leading-relaxed mb-4">
            {para}
          </p>
        ))}
      </div>

      {/* ── 4. CTA del agente ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-[#EEF2FF] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-bold text-[#1E293B] text-xl text-center md:text-left">
            Ready to try {demo.agentName}?
          </p>
          <Link
            href={`/agents/${demo.agentCategory}/${demo.agentSlug}`}
            className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-6 py-3 rounded-lg font-semibold transition-colors flex-shrink-0"
          >
            Start Free Trial →
          </Link>
        </div>

        {/* Share row */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="text-sm text-[#64748B]">Share this demo:</span>
          <ShareButton />
        </div>
      </div>
    </>
  )
}
