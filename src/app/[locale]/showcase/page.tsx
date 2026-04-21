// src/app/[locale]/showcase/page.tsx
// Página de showcase — Client Component por el tab switching con useState.
// Datos importados desde src/lib/demo-data.ts (compartido con la página de detalle).
// Tab 1: Practitioner Results — tarjetas verde salvia con flag + agente icon.
// Tab 2: Agent Demos — grid de demos con search y filtro por categoría.

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Search, Play } from 'lucide-react'
import { PRACTITIONER_RESULTS, AGENT_DEMOS } from '@/lib/demo-data'
import type { PractitionerResult, AgentDemo } from '@/lib/demo-data'

// ── Helper: extrae el ID de YouTube desde una URL embed ───────────────────────
function extractYouTubeId(url: string): string | null {
  const match = url.match(/\/embed\/([^?&/]+)/)
  return match ? match[1] : null
}

// ── Formulario de email inline ────────────────────────────────────────────────
function InlineEmailForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return <p className="text-sm text-[#4F46E5] font-semibold">You&apos;re on the list!</p>
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubmitted(true) }}
      className="flex gap-2 max-w-sm mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4F46E5] transition-colors"
        required
      />
      <button
        type="submit"
        className="bg-[#4F46E5] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#3730A3] transition-colors flex-shrink-0"
      >
        Subscribe
      </button>
    </form>
  )
}

// ── Tarjeta de practicante — diseño verde salvia ───────────────────────────────
function PractitionerCard({ result }: { result: PractitionerResult }) {
  return (
    <div className="bg-[#F0F7F1] rounded-2xl border border-[#D1E8D5] shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">

      {/* Cabecera: avatar+info LEFT, flag+agente RIGHT */}
      <div className="flex items-start justify-between mb-4">
        {/* LEFT: avatar + nombre + especialidad */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"
            style={{ backgroundColor: result.avatarColor }}
            aria-hidden="true"
          >
            {result.initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1E293B] leading-tight">{result.name}</p>
            <p className="text-sm text-[#64748B]">{result.specialty}</p>
            <p className="text-xs text-[#94A3B8]">{result.location}</p>
          </div>
        </div>

        {/* RIGHT: bandera + badge de agente */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
          <span className="text-3xl leading-none" role="img" aria-label={result.location}>
            {result.flag}
          </span>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: result.agentColor + '20', color: result.agentColor }}
          >
            <span aria-hidden="true">{result.agentIcon}</span>
            {result.agentUsed}
          </span>
        </div>
      </div>

      {/* Resultado clave — sobre fondo blanco */}
      <div className="mb-3">
        <span className="bg-white rounded-xl px-4 py-2 inline-block text-[#4A7A57] font-bold text-sm">
          🏆 {result.result}
        </span>
      </div>

      {/* Cita */}
      <div className="flex-1 mb-4">
        <span className="text-[#6B9E78] text-3xl leading-none font-serif">&ldquo;</span>
        <p className="text-[#1E293B] text-sm leading-relaxed italic -mt-1">{result.quote}</p>
      </div>

      {/* Fila inferior: social links + "I want this" */}
      <div className="mt-auto pt-4 border-t border-[#D1E8D5] flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#6B9E78]">
          <a
            href={result.socialLinks.instagram}
            className="hover:text-[#4A7A57] transition-colors flex items-center gap-1 text-xs"
          >
            <ExternalLink className="size-3" aria-hidden="true" />
            Instagram
          </a>
          <a
            href={result.socialLinks.linkedin}
            className="hover:text-[#4A7A57] transition-colors flex items-center gap-1 text-xs"
          >
            <ExternalLink className="size-3" aria-hidden="true" />
            LinkedIn
          </a>
        </div>
        <Link
          href={`/agents/${result.agentCategory}/${result.agentSlug}`}
          className="text-[#4F46E5] text-xs font-semibold hover:underline"
        >
          I want this →
        </Link>
      </div>
    </div>
  )
}

// ── Tarjeta de demo — thumbnail YouTube → detail page ────────────────────────
function DemoCard({ demo }: { demo: AgentDemo }) {
  const videoId = extractYouTubeId(demo.videoUrl)
  const detailUrl = `/showcase/demos/${demo.slug}`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail clicable que lleva a la página de detalle */}
      <Link href={detailUrl} className="block relative" style={{ paddingBottom: '56.25%' }}>
        {videoId ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={demo.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="size-6 text-[#4F46E5] ml-1" aria-hidden="true" />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] to-[#312E81] flex items-center justify-center">
            <Play className="size-8 text-white/60" aria-hidden="true" />
          </div>
        )}
      </Link>

      {/* Body de la tarjeta */}
      <div className="p-6">
        {/* Badge de categoría + fecha */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: demo.badgeColor, backgroundColor: demo.badgeBg }}
          >
            {demo.categoryBadge}
          </span>
          <span className="text-xs text-[#94A3B8]">{demo.datePosted}</span>
        </div>

        {/* Título */}
        <h3 className="font-bold text-[#1E293B] text-lg mt-3 mb-2 leading-snug">
          {demo.title}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-[#64748B] leading-relaxed mb-4">{demo.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {demo.tags.map((tag) => (
            <span
              key={tag}
              className="bg-[#F1F5F9] text-[#475569] text-xs px-2 py-0.5 rounded font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Link a la página de detalle del demo */}
        <Link
          href={detailUrl}
          className="text-[#4F46E5] text-sm font-semibold hover:underline inline-block"
        >
          Watch {demo.agentName} demo →
        </Link>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

type Tab = 'results' | 'demos'

// Categorías de filtro disponibles en el tab de demos
const DEMO_CATEGORIES = ['All', 'Grow Your Practice', 'Find Training', 'Monetize Expertise']

export default function ShowcasePage() {
  // Tab activo — demos por defecto
  const [activeTab, setActiveTab] = useState<Tab>('demos')

  // Estado de búsqueda y filtro del tab de demos
  const [demoSearch, setDemoSearch] = useState('')
  const [demoCategory, setDemoCategory] = useState('All')

  // Demos filtrados según búsqueda y categoría
  const filteredDemos = AGENT_DEMOS.filter((demo) => {
    const matchesSearch =
      demoSearch === '' ||
      demo.agentName.toLowerCase().includes(demoSearch.toLowerCase())
    const matchesCategory =
      demoCategory === 'All' || demo.categoryBadge === demoCategory
    return matchesSearch && matchesCategory
  })

  return (
    <>
      {/* ── 1. Hero oscuro ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#312E81] py-16 px-4 text-center">
        <p className="text-[#818CF8] uppercase tracking-widest text-sm font-semibold mb-4">
          Real Results
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-3xl mx-auto">
          Practitioners seeing real results.
        </h1>
        <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
          Browse practitioner success stories and see AI agents in action before you commit.
        </p>
      </div>

      {/* ── 2. Tab bar sticky ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-[105px] z-40 py-0 px-4">
        <div className="max-w-6xl mx-auto flex gap-0">
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-6 py-4 text-sm transition-colors cursor-pointer ${
              activeTab === 'results'
                ? 'border-b-2 border-[#4F46E5] text-[#4F46E5] font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Practitioner Results
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demos')}
            className={`px-6 py-4 text-sm transition-colors cursor-pointer ${
              activeTab === 'demos'
                ? 'border-b-2 border-[#4F46E5] text-[#4F46E5] font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Agent Demos
          </button>
        </div>
      </div>

      {/* ── 3. Contenido de tabs ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* TAB 1: Practitioner Results */}
        {activeTab === 'results' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRACTITIONER_RESULTS.map((result) => (
                <PractitionerCard key={result.id} result={result} />
              ))}
            </div>

            {/* CTA inferior */}
            <div className="mt-12 text-center">
              <p className="text-[#64748B] text-base mb-4 font-medium">
                Seeing results with RehabStack?
              </p>
              <Link
                href="#"
                className="border border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF] px-6 py-2.5 rounded-lg font-semibold text-sm inline-block transition-colors"
              >
                Share your story →
              </Link>
              <div className="mt-8">
                <p className="text-[#64748B] text-sm mb-3">
                  Get inspired by more success stories.
                </p>
                <InlineEmailForm />
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Agent Demos */}
        {activeTab === 'demos' && (
          <>
            {/* Barra de búsqueda y filtro */}
            <div className="mb-8 flex flex-wrap gap-3 items-center">
              {/* Search input con icono */}
              <div className="relative w-full max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Search by agent name..."
                  value={demoSearch}
                  onChange={(e) => setDemoSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-colors"
                />
              </div>

              {/* Pills de categoría */}
              <div className="flex flex-wrap gap-2">
                {DEMO_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDemoCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      demoCategory === cat
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-white border border-gray-200 text-[#64748B] hover:border-[#4F46E5] hover:text-[#4F46E5]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de demos filtrados */}
            {filteredDemos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredDemos.map((demo) => (
                  <DemoCard key={demo.id} demo={demo} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-[#64748B] font-medium mb-2">No demos match your search.</p>
                <button
                  type="button"
                  onClick={() => { setDemoSearch(''); setDemoCategory('All') }}
                  className="text-[#4F46E5] text-sm font-semibold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* CTA inferior del tab */}
            <div className="mt-12 text-center">
              <p className="text-[#64748B] text-sm mb-3">
                Built an agent demo you want featured?
              </p>
              <Link href="/about" className="text-[#4F46E5] font-semibold text-sm hover:underline">
                Contact us →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
