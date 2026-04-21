// app/[locale]/about/page.tsx
// Página About — Server Component con 6 secciones:
// Hero → Founder Story → Mission → Skool Community → Contact → Consultation CTA

import Link from "next/link";
import { Target, Globe, Heart, Users } from "lucide-react";
import { ContactForm } from "@/components/about/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | RehabStack",
  description:
    "RehabStack was built by a physiotherapist who got tired of the same problems every rehabilitation professional faces.",
  openGraph: {
    title: "About | RehabStack",
    description:
      "RehabStack was built by a physiotherapist who got tired of the same problems every rehabilitation professional faces.",
  },
};

// ─── Colores reutilizables ────────────────────────────────────────────────────
const SAGE = "#6B9E78";
const INDIGO = "#4F46E5";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── SECCIÓN 1: Hero ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#312E81] py-20 px-4 text-center">
        <p className="text-[#818CF8] uppercase tracking-widest text-sm font-semibold mb-4">
          Our Story
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto leading-tight">
          Built by a physiotherapist, for physiotherapists.
        </h1>
        <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto">
          RehabStack exists because one physiotherapist got tired of the same
          problems every rehabilitation professional faces worldwide.
        </p>
      </div>

      {/* ── SECCIÓN 2: Founder Story ─────────────────────────────────────────── */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Columna izquierda — foto placeholder */}
          <div>
            <div className="bg-[#EEF2FF] rounded-3xl aspect-square max-w-xs mx-auto flex items-center justify-center">
              <span className="text-6xl font-bold text-[#4F46E5]">RG</span>
            </div>
            <div className="text-center mt-4">
              <p className="font-bold text-[#1E293B]">Rayco García</p>
              <p className="text-sm text-[#64748B]">Founder &amp; CEO, RehabStack</p>
              <p className="text-sm text-[#64748B]">Bali, Indonesia 🌴</p>
            </div>
          </div>

          {/* Columna derecha — historia */}
          <div className="space-y-4 text-lg text-[#374151] leading-relaxed">
            <p>
              I spent 12 years as a physiotherapist working across elite football
              clubs, private practice, and rehabilitation centers in Spain and the
              UK. I loved the clinical work. What I didn&apos;t love was everything
              around it.
            </p>
            <p>
              I knew I should be posting on social media. I was hearing about
              great courses after the seats were gone. I had 12 years of
              specialized knowledge that other clinicians kept asking me about —
              but turning that into a course felt like a second job I didn&apos;t
              have time for.
            </p>
            <p>
              In 2025, AI tools started becoming capable enough to actually help
              with these problems. But none of them understood rehabilitation.
              They didn&apos;t know what a PEDro score was. They didn&apos;t understand
              the difference between a sports physio and a neurological physio.
              They were generic.
            </p>
            <p>
              So I built RehabStack — a marketplace of AI assistants built
              specifically for rehabilitation professionals. Each one trained on
              the specific context, terminology, and challenges of our profession.
              Not a generic AI tool with a rehab-sounding name. Something that
              actually understands your world.
            </p>
          </div>
        </div>

        {/* Bloque de cita centrado */}
        <div className="mt-16 max-w-2xl mx-auto bg-[#F8FAFC] rounded-2xl p-8 border-l-4 border-[#4F46E5]">
          <p className="text-xl text-[#1E293B] italic leading-relaxed">
            &ldquo;The best technology for rehabilitation professionals shouldn&apos;t be
            built by people who&apos;ve never treated a patient.&rdquo;
          </p>
          <p className="text-sm text-[#64748B] mt-3">— Rayco García, Founder</p>
        </div>
      </div>

      {/* ── SECCIÓN 3: Mission ───────────────────────────────────────────────── */}
      <div className="bg-[#F8FAFC] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: SAGE }}
            >
              Our Mission
            </p>
            <h2 className="text-3xl font-bold text-[#1E293B]">
              Give every rehabilitation professional an unfair advantage.
            </h2>
          </div>

          {/* 3 pilares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div
                className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5"
              >
                <Target size={24} style={{ color: INDIGO }} />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Specialty-specific AI
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm">
                Every AI assistant on RehabStack is built for rehabilitation —
                not adapted from a generic tool. Clinical terminology, specialty
                context, and professional standards are built in.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
                <Globe size={24} style={{ color: INDIGO }} />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Global from day one
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm">
                Rehabilitation is a global profession. RehabStack operates in 6
                languages and serves practitioners across every major
                rehabilitation market worldwide.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-[#EEF2FF] rounded-xl p-3 inline-flex mb-5">
                <Heart size={24} style={{ color: INDIGO }} />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-3">
                Built by practitioners
              </h3>
              <p className="text-[#64748B] leading-relaxed text-sm">
                Every feature on RehabStack was requested or validated by a
                rehabilitation professional. We don&apos;t build what we think
                practitioners need — we build what they tell us they need.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 4: Skool Community ───────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#6B9E78] to-[#4A7A57] py-20 px-4 text-center">
        <div className="bg-white/20 rounded-2xl p-4 inline-flex mb-6">
          <Users size={32} color="white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Join 500+ rehabilitation professionals.
        </h2>
        <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
          Our free Skool community is where rehabilitation professionals explore
          AI-powered practice growth, share results, ask questions, and connect
          with practitioners worldwide.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="https://skool.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-[#4A7A57] hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors inline-block"
          >
            Join the Community →
          </Link>
          <Link
            href="https://skool.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            Already a member? Sign in →
          </Link>
        </div>
      </div>

      {/* ── SECCIÓN 5: Contact Form ──────────────────────────────────────────── */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-12">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: SAGE }}
            >
              Get in Touch
            </p>
            <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
              We&apos;d love to hear from you.
            </h2>
            <p className="text-lg text-[#64748B]">
              Whether you&apos;re a practitioner, a developer, or a journalist — we
              read every message.
            </p>
          </div>

          {/* ContactForm — client component con validación */}
          <ContactForm />
        </div>
      </div>

      {/* ── SECCIÓN 6: Consultation CTA ─────────────────────────────────────── */}
      <div className="bg-[#F8FAFC] py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Columna izquierda — texto */}
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: SAGE }}
            >
              Work With Us
            </p>
            <h2 className="text-3xl font-bold text-[#1E293B] mb-4">
              Book a strategy call.
            </h2>
            <p className="text-[#64748B] leading-relaxed mb-6">
              Want to discuss building an AI agent for your specialty? Exploring
              a partnership? We offer paid 30-minute strategy calls for serious
              inquiries.
            </p>
            <p className="text-sm text-[#94A3B8]">
              30 minutes · Paid consultation
            </p>
          </div>

          {/* Columna derecha — card con lista */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
            <p className="font-bold text-[#1E293B] mb-5">What we cover:</p>
            <ul className="space-y-3">
              {[
                "Designing an AI agent for your specialty",
                "Listing and monetizing on RehabStack",
                "Building a content strategy for your practice",
                "Partnership and white-label opportunities",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="font-bold mt-0.5 flex-shrink-0"
                    style={{ color: SAGE }}
                  >
                    ✓
                  </span>
                  <span className="text-[#374151] text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="https://cal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#4F46E5] text-white hover:bg-[#3730A3] py-4 rounded-xl font-bold transition-colors mt-6"
            >
              Book a 30-Minute Call →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
