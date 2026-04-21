// src/app/[locale]/showcase/page.tsx
// Página de showcase — Client Component por el tab switching con useState.
// Tab 1: Practitioner Results — testimonios con avatar, cita, y agente usado.
// Tab 2: Agent Demos — embeds de YouTube con descripción y tags.

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

// ── Datos mock — Practitioner Results ─────────────────────────────────────────

const PRACTITIONER_RESULTS = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    specialty: 'Sports Physiotherapist',
    location: 'London, UK',
    agentUsed: 'Content Engine',
    agentSlug: 'content-engine',
    agentCategory: 'grow-your-practice',
    result: '3x more patient inquiries in 6 weeks',
    quote:
      'I went from posting once a month to every day. My Instagram following doubled and I get 3x more new patient inquiries than before. The content sounds exactly like me.',
    initials: 'SM',
    avatarColor: '#4F46E5',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: true,
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    specialty: 'Musculoskeletal Chiropractor',
    location: 'Barcelona, Spain',
    agentUsed: 'CE Concierge',
    agentSlug: 'ce-matcher',
    agentCategory: 'find-training',
    result: 'Found 4 relevant courses in first week',
    quote:
      'It found a dry needling masterclass in Berlin I had zero idea existed. Registration closed the next day. I would have missed it completely without CE Concierge.',
    initials: 'CM',
    avatarColor: '#6B9E78',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: true,
  },
  {
    id: 3,
    name: 'Priya Sharma',
    specialty: 'Pelvic Floor Physiotherapist',
    location: 'Melbourne, Australia',
    agentUsed: 'Course Creator',
    agentSlug: 'course-creator',
    agentCategory: 'monetize-expertise',
    result: 'First course launched in 8 weeks',
    quote:
      'I recorded 6 voice notes during my lunch breaks. Eight weeks later I had a full pelvic floor rehab course ready to sell. I never thought it would be this fast.',
    initials: 'PS',
    avatarColor: '#F59E0B',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
  {
    id: 4,
    name: 'Marco Rossi',
    specialty: 'Osteopath',
    location: 'Milan, Italy',
    agentUsed: 'Content Engine',
    agentSlug: 'content-engine',
    agentCategory: 'grow-your-practice',
    result: '2,400 new Instagram followers in 3 months',
    quote:
      'My patients started telling me they saw my posts and finally understood what osteopathy actually does. The educational content has been incredible for my practice.',
    initials: 'MR',
    avatarColor: '#4F46E5',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
  {
    id: 5,
    name: 'Ana Lima',
    specialty: 'Sports Physiotherapist',
    location: 'São Paulo, Brazil',
    agentUsed: 'CE Concierge',
    agentSlug: 'ce-matcher',
    agentCategory: 'find-training',
    result: 'Saved 8 hours per month on course research',
    quote:
      'Finding courses in Brazil that count toward my international certification used to take me a whole weekend. Now CE Concierge does it in minutes and finds options I never knew existed.',
    initials: 'AL',
    avatarColor: '#6B9E78',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
  {
    id: 6,
    name: 'James Okafor',
    specialty: 'Neurological Physiotherapist',
    location: 'Lagos, Nigeria',
    agentUsed: 'Course Creator',
    agentSlug: 'course-creator',
    agentCategory: 'monetize-expertise',
    result: '€4,200 in first month of course sales',
    quote:
      'I\'ve been treating stroke patients for 14 years. Course Creator helped me turn that expertise into a structured online course in 6 weeks. The first month I made more from the course than a week of clinical work.',
    initials: 'JO',
    avatarColor: '#F59E0B',
    socialLinks: { instagram: '#', linkedin: '#' },
    featured: false,
  },
]

// ── Datos mock — Agent Demos ───────────────────────────────────────────────────

const AGENT_DEMOS = [
  {
    id: 1,
    agentName: 'CE Matcher',
    agentSlug: 'ce-matcher',
    agentCategory: 'find-training',
    categoryBadge: 'Find Training',
    badgeColor: '#0EA5E9',
    badgeBg: '#E0F2FE',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'CE Matcher in action: Finding a dry needling course in Europe',
    description:
      'Watch how CE Matcher scans providers across 12 countries, filters by specialty and recertification requirements, and builds a complete trip plan in under 3 minutes.',
    datePosted: 'April 10, 2026',
    tags: ['course-finding', 'dry-needling', 'europe'],
  },
  {
    id: 2,
    agentName: 'Content Engine',
    agentSlug: 'content-engine',
    agentCategory: 'grow-your-practice',
    categoryBadge: 'Grow Your Practice',
    badgeColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Content Engine: From voice note to Instagram carousel in 4 minutes',
    description:
      'A sports physiotherapist records a 2-minute voice note about ACL rehabilitation. Watch what Content Engine produces: carousel, LinkedIn post, video script, and blog draft.',
    datePosted: 'April 3, 2026',
    tags: ['content-creation', 'instagram', 'sports-physio'],
  },
]

// ── Sub-componentes ───────────────────────────────────────────────────────────

// Formulario de email inline (reemplaza el import para evitar dependencia cross-tab)
function InlineEmailForm({ placeholder = 'your@email.com', buttonText = 'Subscribe' }: { placeholder?: string; buttonText?: string }) {
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
        placeholder={placeholder}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4F46E5] transition-colors"
        required
      />
      <button
        type="submit"
        className="bg-[#4F46E5] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#3730A3] transition-colors flex-shrink-0"
      >
        {buttonText}
      </button>
    </form>
  )
}

// Tarjeta de resultado de practicante
function PractitionerCard({ result }: { result: typeof PRACTITIONER_RESULTS[number] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
      {/* Fila superior: avatar + nombre + especialidad + ubicación */}
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

      {/* Badge del agente usado */}
      <div className="mt-3 mb-2">
        <Link href={`/agents/${result.agentCategory}/${result.agentSlug}`}>
          <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full inline-block hover:bg-[#E0E7FF] transition-colors">
            Used: {result.agentUsed}
          </span>
        </Link>
      </div>

      {/* Resultado clave */}
      <p className="text-[#6B9E78] font-bold text-sm mb-3">{result.result}</p>

      {/* Cita */}
      <div className="flex-1">
        <span className="text-[#4F46E5] text-2xl leading-none font-serif">&ldquo;</span>
        <p className="text-[#1E293B] text-sm leading-relaxed italic -mt-1">{result.quote}</p>
      </div>

      {/* Fila inferior: social links + "I want this" */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#94A3B8]">
          <a href={result.socialLinks.instagram} className="hover:text-[#4F46E5] transition-colors flex items-center gap-1 text-xs">
            <ExternalLink className="size-3" aria-hidden="true" />
            Instagram
          </a>
          <a href={result.socialLinks.linkedin} className="hover:text-[#4F46E5] transition-colors flex items-center gap-1 text-xs">
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

// Tarjeta de demo de agente
function DemoCard({ demo }: { demo: typeof AGENT_DEMOS[number] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Embed de YouTube — aspect ratio 16:9 */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={demo.videoUrl}
          title={demo.title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

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
        <h3 className="font-bold text-[#1E293B] text-lg mt-3 mb-2 leading-snug">{demo.title}</h3>

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

        {/* Link al agente */}
        <Link
          href={`/agents/${demo.agentCategory}/${demo.agentSlug}`}
          className="text-[#4F46E5] text-sm font-semibold hover:underline inline-block"
        >
          View {demo.agentName} →
        </Link>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

type Tab = 'results' | 'demos'

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<Tab>('results')

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

            {/* CTA inferior del tab */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {AGENT_DEMOS.map((demo) => (
                <DemoCard key={demo.id} demo={demo} />
              ))}
            </div>

            {/* CTA inferior del tab */}
            <div className="mt-12 text-center">
              <p className="text-[#64748B] text-sm mb-3">
                Built an agent demo you want featured?
              </p>
              <Link
                href="/about"
                className="text-[#4F46E5] font-semibold text-sm hover:underline"
              >
                Contact us →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
