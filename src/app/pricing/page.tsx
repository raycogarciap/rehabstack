// src/app/pricing/page.tsx
// Página pública de precios — Server Component.
// Muestra los 3 tiers de suscripción y una sección FAQ.
// Los priceIds se leen desde variables de entorno en el servidor
// y se pasan como props a CheckoutButton (Client Component).

import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckoutButton } from "@/components/pricing/checkout-button";

export const metadata: Metadata = {
  title: "Pricing | RehabStack",
  description:
    "Simple, transparent pricing for AI agents built for physical therapy and rehabilitation professionals. Start free for 14 days.",
};

// ============================================================
// DATOS DE TIERS
// ============================================================

interface Tier {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: "checkout" | "contact";
  ctaLabel: string;
  popular: boolean;
  priceId: string;
}

function getTiers(): Tier[] {
  return [
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      tagline: "Perfect for individual practitioners",
      features: [
        "1 AI Agent",
        "200 sessions / month",
        "Email support",
        "Basic analytics",
        "All specialties",
      ],
      cta: "checkout",
      ctaLabel: "Get Started",
      popular: false,
      // Leído en el servidor y pasado como prop — seguro para el cliente
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      tagline: "For growing practices",
      features: [
        "3 AI Agents",
        "500 sessions / month",
        "Priority support",
        "Advanced analytics",
        "Team collaboration (2 seats)",
        "All specialties",
        "Custom agent settings",
      ],
      cta: "checkout",
      ctaLabel: "Get Started",
      popular: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL ?? "",
    },
    {
      name: "Clinic",
      price: "$149",
      period: "/month",
      tagline: "For clinics and group practices",
      features: [
        "Unlimited AI Agents",
        "Unlimited sessions",
        "Dedicated support",
        "Full analytics suite",
        "Unlimited team seats",
        "All specialties",
        "White-label options",
        "API access",
      ],
      cta: "contact",
      ctaLabel: "Contact Us",
      popular: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CLINIC ?? "",
    },
  ];
}

// ============================================================
// FAQ
// ============================================================

const FAQ_ITEMS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel whenever you want — no contracts, no cancellation fees. You keep access until the end of the billing period.",
  },
  {
    q: "Is there a free trial?",
    a: "All plans include a 14-day free trial. No credit card required to start.",
  },
  {
    q: "What specialties are supported?",
    a: "All rehabilitation specialties: physical therapy, occupational therapy, sports rehab, neurological rehab, pediatric PT, and more.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes. Upgrade or downgrade at any time from your billing settings. Changes take effect at the next billing cycle.",
  },
  {
    q: "Is my data secure?",
    a: "RehabStack is built with HIPAA-aware infrastructure. All data is encrypted in transit and at rest. We never share patient data.",
  },
] as const;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PricingPage() {
  const tiers = getTiers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">

      {/* ── Encabezado ────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Start free for 14 days. No contracts. Cancel anytime.
        </p>
      </div>

      {/* ── Grid de tiers ─────────────────────────────────────── */}
      {/* Columna única en móvil, 3 columnas en escritorio */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <TierCard key={tier.name} tier={tier} />
        ))}
      </div>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <FaqSection />
    </div>
  );
}

// ============================================================
// TARJETA DE TIER
// ============================================================

function TierCard({ tier }: { tier: Tier }) {
  return (
    <Card
      className={
        tier.popular
          ? // Resalta "Most Popular" con borde azul y sombra pronunciada
            "relative ring-2 ring-blue-600 shadow-lg shadow-blue-600/10"
          : "relative"
      }
    >
      {/* Badge "Most Popular" — solo en Professional */}
      {tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader className="pt-6">
        <CardTitle className="text-lg font-bold text-neutral-900">
          {tier.name}
        </CardTitle>
        <CardDescription>{tier.tagline}</CardDescription>

        {/* Precio */}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-neutral-900">
            {tier.price}
          </span>
          <span className="text-sm font-medium text-neutral-500">{tier.period}</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Lista de features */}
        <ul className="space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckIcon
                className="mt-0.5 size-4 shrink-0 text-blue-600"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2">
        {tier.cta === "checkout" ? (
          // Botón de suscripción (Client Component)
          <CheckoutButton
            priceId={tier.priceId}
            label={tier.ctaLabel}
            className="w-full"
          />
        ) : (
          // Clinic: enlace a /contact (no necesita checkout)
          <Link href="/contact" className="w-full">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400"
            >
              {tier.ctaLabel}
            </button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// SECCIÓN FAQ
// ============================================================

function FaqSection() {
  return (
    <section className="mt-24 mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 text-center mb-10">
        Frequently asked questions
      </h2>

      <div className="divide-y divide-neutral-200 border-t border-neutral-200">
        {FAQ_ITEMS.map(({ q, a }) => (
          // details/summary: accesible, sin JS, sin dependencias
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-neutral-900 hover:text-blue-600 transition-colors">
              {q}
              {/* Ícono + que rota a × cuando está abierto */}
              <span className="shrink-0 text-lg font-light text-neutral-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
