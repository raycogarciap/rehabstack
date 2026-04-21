// src/app/[locale]/for-creators/page.tsx
// Landing page de persuasión para desarrolladores y clínicos que quieren listar agentes.
// Server Component async — 7 secciones: hero, stats, oportunidad, beneficios, 3 caminos, credibilidad, CTA final.

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  TrendingUp,
  Globe,
  DollarSign,
  Users,
  Zap,
  CreditCard,
  BarChart3,
  Star,
  Shield,
  Headphones,
  Code,
  Stethoscope,
  Settings,
} from 'lucide-react'
import { WaitlistForm } from '@/components/for-creators/WaitlistForm'

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'For Creators | RehabStack',
  description:
    'Build and list AI agents for 90,000+ rehabilitation practices worldwide. Keep 75–80% of every subscription.',
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ForCreatorsPage() {
  return (
    <>
      {/* ── 1. Hero band ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#312E81] py-20 px-4 text-center">
        <p className="text-[#818CF8] uppercase tracking-widest text-sm font-semibold mb-4">
          For Builders &amp; Creators
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
          Build and list AI agents for rehabilitation professionals worldwide.
        </h1>
        <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10">
          The rehabilitation industry has no AI agent marketplace. Zero direct competitors. You keep 75–80% of every subscription.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/creator"
            className="bg-[#6B9E78] text-white hover:bg-[#4A7A57] px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Start Listing Agents
          </Link>
          <Link
            href="/docs"
            className="border-2 border-[#475569] text-white hover:border-[#6B9E78] px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Read the Docs
          </Link>
        </div>
      </div>

      {/* ── 2. Stats bar ────────────────────────────────────────────────── */}
      <div className="bg-[#0F172A] py-10 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {[
            { number: '75–80%', label: 'Revenue share you keep' },
            { number: '24h',    label: 'Time to list your first agent' },
            { number: '6',      label: 'Languages your agent reaches' },
            { number: '0',      label: 'Direct competitors in this market' },
          ].map(({ number, label }) => (
            <div key={label}>
              <p className="text-4xl font-bold text-white mb-1">{number}</p>
              <p className="text-[#94A3B8] text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. The Opportunity ──────────────────────────────────────────── */}
      <div className="bg-white py-20 px-4">
        {/* Cabecera centrada */}
        <div className="text-center mb-16">
          <p className="text-[#6B9E78] uppercase tracking-widest text-xs font-semibold mb-3">
            The Opportunity
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
            A $47B industry with no AI marketplace.
          </h2>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
            Rehabilitation is one of the last healthcare sectors without a dedicated AI agent marketplace.
            The practitioners are ready. The demand is there. The market is yours.
          </p>
        </div>

        {/* 4 tarjetas de oportunidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            {
              Icon: TrendingUp,
              title: 'Zero direct competitors',
              body: 'No other platform serves AI agents exclusively to rehabilitation professionals. You\'re not fighting for position in a crowded market — you\'re defining a new one.',
            },
            {
              Icon: Globe,
              title: 'Global reach from day one',
              body: 'RehabStack operates in 6 languages across every major rehabilitation market. Your agent reaches practitioners in the UK, Spain, Brazil, France, Germany, and the Arab world.',
            },
            {
              Icon: DollarSign,
              title: 'Practitioners pay premium prices',
              body: 'Rehabilitation professionals invest in tools that save time and grow revenue. Our agents are priced at $179–$499/month — not $9 SaaS pricing. The economics are different here.',
            },
            {
              Icon: Users,
              title: 'We drive the users, you build the product',
              body: 'RehabStack handles distribution via Instagram, SEO, Skool community, and the conference circuit. You focus on building great agents — we bring the practitioners.',
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="bg-[#F8FAFC] rounded-2xl p-8 border border-gray-100">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
                <Icon className="size-6 text-[#4F46E5]" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">{title}</h3>
              <p className="text-[#64748B] leading-relaxed text-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Why List on RehabStack ───────────────────────────────────── */}
      <div className="bg-[#F8FAFC] py-20 px-4">
        {/* Cabecera */}
        <div className="text-center mb-16">
          <p className="text-[#6B9E78] uppercase tracking-widest text-xs font-semibold mb-3">
            Why RehabStack
          </p>
          <h2 className="text-3xl font-bold text-[#1E293B]">
            Everything you need. Nothing you don&apos;t.
          </h2>
        </div>

        {/* 6 beneficios sin fondo de tarjeta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              Icon: Zap,
              title: 'Open listing',
              body: 'No gatekeeping, no approval waitlist. Submit your agent and go live in 24 hours.',
            },
            {
              Icon: CreditCard,
              title: 'We handle billing',
              body: 'Stripe integration, subscription management, failed payment recovery. You never touch a credit card.',
            },
            {
              Icon: BarChart3,
              title: 'Your own dashboard',
              body: 'Real-time revenue, subscriber counts, churn rate, and agent performance metrics.',
            },
            {
              Icon: Star,
              title: 'Professional product page',
              body: 'Your agent gets a dedicated page with videos, screenshots, reviews, and a sharable URL with Open Graph previews.',
            },
            {
              Icon: Shield,
              title: 'Compliance handled',
              body: 'We manage GDPR, data processing agreements, and platform terms. You focus on the product.',
            },
            {
              Icon: Headphones,
              title: 'Creator support',
              body: 'Direct access to the RehabStack team via Slack. We want you to succeed.',
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="text-center">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-4 mx-auto">
                <Icon className="size-6 text-[#4F46E5]" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[#1E293B] mb-2">{title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Three Paths ──────────────────────────────────────────────── */}
      <div className="bg-white py-20 px-4">
        {/* Cabecera */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#1E293B] mb-4">
            Three ways to get started.
          </h2>
          <p className="text-lg text-[#64748B]">
            Whether you&apos;re a developer, a clinician, or somewhere in between.
          </p>
        </div>

        {/* 3 tarjetas de camino */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

          {/* PATH 1: Para desarrolladores */}
          <div className="bg-[#0F172A] rounded-2xl p-8 text-white flex flex-col">
            <div className="bg-[#1E293B] p-3 rounded-xl inline-flex mb-5">
              <Code className="size-6 text-[#818CF8]" aria-hidden="true" />
            </div>
            <span className="bg-[#1E293B] text-[#818CF8] text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block self-start">
              For Developers
            </span>
            <h3 className="text-xl font-bold text-white mb-3">Build and list your own agent</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-6 flex-1">
              You have the technical skills. Use any AI infrastructure — Anthropic, OpenAI, or your own hosted model.
              Implement the RehabStack Agent API spec and go live in 24 hours.
            </p>
            <Link
              href="/docs"
              className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-6 py-3 rounded-lg font-semibold text-sm transition-colors inline-block text-center"
            >
              Read the Docs →
            </Link>
          </div>

          {/* PATH 2: Para clínicos — DESTACADO */}
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#6B9E78] rounded-2xl p-8 text-white ring-4 ring-[#4F46E5]/20 flex flex-col">
            <div className="bg-white/20 p-3 rounded-xl inline-flex mb-5">
              <Stethoscope className="size-6 text-white" aria-hidden="true" />
            </div>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block self-start">
              For Clinicians
            </span>
            <h3 className="text-xl font-bold text-white mb-3">Turn your expertise into an agent</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6 flex-1">
              10+ years of clinical expertise? Your knowledge could become an AI agent that helps thousands of
              practitioners worldwide. We help you design it. You provide the expertise.
            </p>
            <a
              href="https://cal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#4F46E5] hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold text-sm transition-colors inline-block text-center"
            >
              Book a Strategy Call →
            </a>
          </div>

          {/* PATH 3: Managed listing */}
          <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-gray-200 flex flex-col">
            <div className="bg-[#EEF2FF] p-3 rounded-xl inline-flex mb-5">
              <Settings className="size-6 text-[#4F46E5]" aria-hidden="true" />
            </div>
            <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block self-start">
              Managed Service
            </span>
            <h3 className="text-xl font-bold text-[#1E293B] mb-3">We build and maintain it for you</h3>
            <p className="text-[#64748B] text-sm leading-relaxed mb-6 flex-1">
              Don&apos;t know how to build an agent but have expertise worth monetizing? We design, build, and
              maintain your agent. Higher commission split, zero technical work on your end.
            </p>
            {/* Formulario de waitlist inline */}
            <WaitlistForm />
          </div>
        </div>
      </div>

      {/* ── 6. Social proof / credibilidad ──────────────────────────────── */}
      <div className="bg-[#F8FAFC] py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1E293B] mb-6">
            Built by a rehabilitation professional.
          </h2>
          <p className="text-[#64748B] leading-relaxed mb-6">
            RehabStack was built by Rayco García, a physiotherapist who spent years frustrated by the same
            problems his colleagues face. Every design decision, every agent category, and every feature
            exists because a practitioner asked for it. This isn&apos;t a tech company that discovered
            healthcare — it&apos;s a healthcare professional who built the tech.
          </p>
          <Link
            href="/about"
            className="text-[#4F46E5] font-semibold hover:underline text-sm"
          >
            Meet the team →
          </Link>
        </div>
      </div>

      {/* ── 7. Final CTA ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#4F46E5] to-[#3730A3] py-20 px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-4 max-w-2xl mx-auto">
          The market is open. The practitioners are waiting.
        </h2>
        <p className="text-xl text-indigo-200 mb-10">
          List your first agent in 24 hours. No gatekeeping, no approval delays.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/creator"
            className="bg-white text-[#4F46E5] hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Start Listing Agents →
          </Link>
          <a
            href="https://cal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-white/30 text-white hover:border-white px-10 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Book a Strategy Call →
          </a>
        </div>
      </div>
    </>
  )
}
