// app/[locale]/how-it-works/page.tsx
// Página educativa permanente — base de conocimiento estructurada.
// Server Component con 7 secciones + FAQ accordion (client component).

import Link from "next/link";
import {
  Shield,
  Lock,
  FileText,
  AlertTriangle,
  Mic,
  RefreshCw,
  BookOpen,
  Target,
  Globe,
  Heart,
} from "lucide-react";
import { FAQ } from "@/components/how-it-works/FAQ";
import type { FAQItem } from "@/components/how-it-works/FAQ";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | RehabStack",
  description:
    "Learn how RehabStack AI assistants work, how we handle your data, and how to get the best results from your AI assistant.",
  openGraph: {
    title: "How It Works | RehabStack",
    description:
      "Learn how RehabStack AI assistants work, how we handle your data, and how to get the best results from your AI assistant.",
  },
};

// ─── Colores de marca ─────────────────────────────────────────────────────────
const INDIGO = "#4F46E5";
const SAGE = "#6B9E78";

// ─── Badge de número de sección ───────────────────────────────────────────────
function SectionBadge({ n }: { n: string }) {
  return (
    <span className="bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
      {n}
    </span>
  );
}

// ─── Datos del FAQ ────────────────────────────────────────────────────────────
const FAQ_ITEMS: FAQItem[] = [
  {
    q: "Do I need technical skills to use RehabStack?",
    a: "No. RehabStack is designed for clinicians, not developers. If you can send a WhatsApp message, you can use any assistant on the platform. No AI experience required.",
  },
  {
    q: "Is my data shared with other users?",
    a: "Never. Your conversations, content, and patient case information are completely private to your account. No other user or creator can see your data.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "Your card is charged automatically at the end of the 48-hour trial. You can cancel at any time before the trial ends from your account settings — no charge will apply. After subscribing, you can cancel anytime and retain access until the end of your billing period.",
  },
  {
    q: "Can I use RehabStack in my language?",
    a: "Yes. RehabStack is fully available in English, Spanish, Portuguese, French, German, and Arabic. AI assistants communicate with you in your preferred language automatically.",
  },
  {
    q: "Are the AI assistants HIPAA compliant?",
    a: "RehabStack is built with privacy and security as core principles. We follow GDPR standards and encrypt all data. For practitioners in HIPAA-regulated environments, we recommend reviewing our privacy policy and not entering patient PII (personally identifiable information) into any AI assistant — use anonymized clinical descriptions instead.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your account settings. No cancellation fees, no questions asked. You retain access until the end of your current billing period.",
  },
  {
    q: "What if the AI assistant makes a clinical error?",
    a: "AI assistants on RehabStack produce content suggestions — not clinical decisions. Every output requires your professional review before use. You maintain full clinical responsibility for any content you publish or advice you give. The assistant is a production tool, not a clinical decision-making system.",
  },
  {
    q: "Can multiple team members use the same subscription?",
    a: "The Team feature allows you to invite staff members (receptionists, admin staff, VAs) to access specific assistant functions on your behalf. Each subscription supports one primary clinician account with configurable staff access.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── SECCIÓN 1: Hero ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#312E81] py-20 px-4 text-center">
        <p className="text-[#818CF8] uppercase tracking-widest text-sm font-semibold mb-4">
          How It Works
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
          Everything you need to know before you start.
        </h1>
        <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10">
          Plain language answers to the questions rehabilitation professionals
          ask most.
        </p>

        {/* Jump links de navegación rápida */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {[
            { label: "What are AI assistants?", href: "#what-are-ai-assistants" },
            { label: "How agents work", href: "#how-agents-work" },
            { label: "Privacy & data", href: "#privacy" },
            { label: "Getting best results", href: "#best-results" },
            { label: "FAQ", href: "#faq" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN 2: What are AI assistants? ──────────────────────────────── */}
      <div id="what-are-ai-assistants" className="bg-white py-20 px-4 scroll-mt-8">
        <div className="max-w-4xl mx-auto">
          <SectionBadge n="01" />
          <h2 className="text-3xl font-bold text-[#1E293B] mb-6">
            What are AI assistants?
          </h2>
          <p className="text-xl text-[#374151] leading-relaxed mb-10">
            An AI assistant is a software tool that uses artificial intelligence
            to help you complete specific tasks — faster and better than doing
            them manually. Think of it as a highly capable colleague who never
            gets tired, works in any language, and specializes in exactly what
            you need.
          </p>

          <div className="space-y-6">
            {/* Bloque 1 — Not a chatbot */}
            <div className="bg-[#F8FAFC] rounded-2xl p-8 border-l-4 border-[#4F46E5]">
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Not a generic chatbot
              </h3>
              <p className="text-[#64748B] leading-relaxed">
                Generic AI tools like ChatGPT are trained on everything.
                RehabStack assistants are built for rehabilitation — they
                understand clinical terminology, specialty-specific workflows,
                and the professional standards of your field. The difference in
                output quality is significant.
              </p>
            </div>

            {/* Bloque 2 — As a service */}
            <div className="bg-[#F8FAFC] rounded-2xl p-8 border-l-4 border-[#6B9E78]">
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                AI as a service, not a tool
              </h3>
              <p className="text-[#64748B] leading-relaxed">
                You don&apos;t need to learn prompting, configure settings, or
                manage AI models. Each assistant on RehabStack is a complete
                service — you describe what you need, it delivers professional
                results. The complexity is handled for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 3: How agents work ───────────────────────────────────────── */}
      <div id="how-agents-work" className="bg-[#F8FAFC] py-20 px-4 scroll-mt-8">
        <div className="max-w-4xl mx-auto">
          <SectionBadge n="02" />
          <h2 className="text-3xl font-bold text-[#1E293B] mb-12">
            How AI agents work as a service.
          </h2>

          {/* Timeline de 4 pasos */}
          <div className="max-w-3xl mx-auto">
            {[
              {
                n: "1",
                title: "You subscribe",
                body: "Choose an assistant from the marketplace and start your 48-hour free trial. Your card is stored securely via Stripe — you won't be charged until the trial ends.",
              },
              {
                n: "2",
                title: "You brief the assistant",
                body: "Tell your assistant what you need. You can type a message, record a voice note, upload a photo, or share a document. The assistant understands rehabilitation context — you don't need to explain your specialty every time.",
              },
              {
                n: "3",
                title: "The assistant works",
                body: "The AI processes your brief and produces results. Depending on the assistant, this takes 30 seconds to 3 minutes. Complex requests (like a full course curriculum) may take longer — the assistant tells you what to expect.",
              },
              {
                n: "4",
                title: "You review and use",
                body: "Everything the assistant produces lands in your Work archive. You review, edit if needed, and publish or act. Nothing goes live without your approval. You maintain full control and professional responsibility for all published content.",
              },
            ].map((step, i, arr) => {
              const isLast = i === arr.length - 1;
              return (
                <div key={step.n} className="flex gap-6 items-start relative">
                  {/* Línea conectora — visible en todos menos el último */}
                  {!isLast && (
                    <div className="absolute left-6 top-14 w-px bg-[#C7D2FE]" style={{ height: "calc(100% - 3.5rem)" }} />
                  )}
                  {/* Círculo numerado */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg z-10"
                    style={{ backgroundColor: INDIGO }}
                  >
                    {step.n}
                  </div>
                  {/* Contenido */}
                  <div className={isLast ? "pb-0" : "pb-12"}>
                    <h3 className="font-bold text-[#1E293B] text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[#64748B] leading-relaxed">{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 4: Privacy & Data ────────────────────────────────────────── */}
      <div id="privacy" className="bg-white py-20 px-4 scroll-mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-4xl">
            <SectionBadge n="03" />
            <h2 className="text-3xl font-bold text-[#1E293B] mb-6">
              Your data. Your control.
            </h2>
            <p className="text-xl text-[#374151] leading-relaxed mb-12">
              We know you handle sensitive clinical information. Here is exactly
              how we treat your data.
            </p>
          </div>

          {/* 3 tarjetas de privacidad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1 — No vendemos */}
            <div className="bg-[#F0F7F1] rounded-2xl p-8 border border-[#D1E8D5]">
              <div className="bg-[#6B9E78] rounded-xl p-3 inline-flex mb-5">
                <Shield size={24} color="white" />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                We don&apos;t sell your data
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm">
                Your conversations, patient information, and content are never
                sold to third parties. Never. Full stop.
              </p>
            </div>

            {/* Card 2 — Cifrado */}
            <div className="bg-[#EEF2FF] rounded-2xl p-8 border border-[#C7D2FE]">
              <div className="bg-[#4F46E5] rounded-xl p-3 inline-flex mb-5">
                <Lock size={24} color="white" />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Encrypted in transit and at rest
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm">
                All data is encrypted using industry-standard TLS in transit and
                AES-256 at rest. Your Supabase database is isolated and
                access-controlled.
              </p>
            </div>

            {/* Card 3 — GDPR */}
            <div className="bg-[#FFFBEB] rounded-2xl p-8 border border-[#FDE68A]">
              <div className="bg-[#F59E0B] rounded-xl p-3 inline-flex mb-5">
                <FileText size={24} color="white" />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                GDPR compliant
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm">
                RehabStack operates under GDPR. You can request your data,
                export it, or delete it at any time from your account settings.
              </p>
            </div>
          </div>

          {/* Aviso importante sobre datos de pacientes */}
          <div className="max-w-3xl mx-auto bg-[#FFF9DB] rounded-2xl p-8 border border-[#FDE68A]">
            <div className="flex items-start gap-4">
              <AlertTriangle
                size={24}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "#B45309" }}
              />
              <div>
                <h3 className="font-bold text-[#92400E] mb-3">
                  Patient data — important
                </h3>
                <p className="text-[#92400E] leading-relaxed">
                  Do not enter real patient names, dates of birth, NHS/insurance
                  numbers, or other personally identifiable patient information
                  into AI assistants. Describe patient cases in anonymized
                  clinical terms (e.g.,{" "}
                  <em>
                    &lsquo;34-year-old male runner, 6 weeks post ACL
                    reconstruction&rsquo;
                  </em>
                  ) — this is both best practice and sufficient for the assistant
                  to produce excellent results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 5: Getting Best Results ─────────────────────────────────── */}
      <div id="best-results" className="bg-[#F8FAFC] py-20 px-4 scroll-mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-4xl mb-12">
            <SectionBadge n="04" />
            <h2 className="text-3xl font-bold text-[#1E293B]">
              How to get the best results.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tip 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
                <Mic size={24} style={{ color: INDIGO }} />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Be specific in your brief
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm mb-4">
                The more context you give, the better the output. Instead of
                &lsquo;write about shoulder injuries&rsquo;, say &lsquo;write an
                Instagram carousel about rotator cuff rehabilitation for
                recreational tennis players aged 40-60, focusing on the first 6
                weeks post-diagnosis.&rsquo;
              </p>
              <span className="bg-[#4F46E5] text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-block">
                Pro tip
              </span>
            </div>

            {/* Tip 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
                <RefreshCw size={24} style={{ color: INDIGO }} />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Iterate, don&apos;t redo
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm mb-4">
                If the first output isn&apos;t quite right, don&apos;t start over. Tell the
                assistant what to change: &lsquo;Make the tone less formal&rsquo; or
                &lsquo;Add more detail about the exercise progression in slide 4.&rsquo; Each
                iteration improves the result.
              </p>
              <span className="bg-[#4F46E5] text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-block">
                Pro tip
              </span>
            </div>

            {/* Tip 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
                <BookOpen size={24} style={{ color: INDIGO }} />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Use your onboarding profile
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm mb-4">
                Every assistant asks you to complete a brief onboarding when you
                first subscribe. The more detail you provide about your
                specialty, patient demographic, and communication style, the
                more personalized every output becomes from day one.
              </p>
              <span className="bg-[#4F46E5] text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-block">
                Pro tip
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 6: FAQ ───────────────────────────────────────────────────── */}
      <div id="faq" className="bg-white py-20 px-4 scroll-mt-8">
        <div className="max-w-4xl mx-auto">
          <SectionBadge n="05" />
          <h2 className="text-3xl font-bold text-[#1E293B] mb-12">
            Frequently asked questions.
          </h2>

          {/* FAQ accordion — client component */}
          <FAQ items={FAQ_ITEMS} />
        </div>
      </div>

      {/* ── SECCIÓN 7: Still have questions CTA ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#4F46E5] to-[#3730A3] py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Still have questions?
        </h2>
        <p className="text-indigo-200 mb-8 text-lg">
          Our team responds to every message within 24 hours.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/about"
            className="bg-white text-[#4F46E5] hover:bg-gray-50 px-8 py-3 rounded-xl font-bold transition-colors"
          >
            Contact Us →
          </Link>
          <Link
            href="/agents"
            className="border border-white/30 text-white hover:border-white px-8 py-3 rounded-xl font-bold transition-colors"
          >
            Browse AI Assistants →
          </Link>
        </div>
      </div>
    </div>
  );
}
