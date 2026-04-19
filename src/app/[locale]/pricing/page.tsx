// Página de precios — /[locale]/pricing — Server Component.
// Las strings de tiers, features y FAQ vienen de translations.
// Los priceIds siguen leyéndose desde env vars (datos, no UI text).

import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { CheckoutButton } from '@/components/pricing/checkout-button'

// ── Metadata ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pricing' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// ── Página principal ───────────────────────────────────────────────────────────

export default async function PricingPage() {
  const t = await getTranslations('pricing')

  const tiers = [
    {
      nameKey:    'starter' as const,
      price:      '$19',
      features:   t.raw('starter.features') as string[],
      cta:        'checkout' as const,
      ctaLabel:   t('starter.cta'),
      popular:    false,
      priceId:    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? '',
    },
    {
      nameKey:    'professional' as const,
      price:      '$49',
      features:   t.raw('professional.features') as string[],
      cta:        'checkout' as const,
      ctaLabel:   t('professional.cta'),
      popular:    true,
      priceId:    process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL ?? '',
    },
    {
      nameKey:    'clinic' as const,
      price:      '$149',
      features:   t.raw('clinic.features') as string[],
      cta:        'contact' as const,
      ctaLabel:   t('clinic.cta'),
      popular:    false,
      priceId:    process.env.NEXT_PUBLIC_STRIPE_PRICE_CLINIC ?? '',
    },
  ]

  const faqItems = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">

      {/* Encabezado */}
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-neutral-600">{t('subtitle')}</p>
      </div>

      {/* Grid de tiers */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.nameKey}
            className={
              tier.popular
                ? 'relative ring-2 ring-blue-600 shadow-lg shadow-blue-600/10'
                : 'relative'
            }
          >
            {tier.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                  {t('mostPopular')}
                </span>
              </div>
            )}

            <CardHeader className="pt-6">
              <CardTitle className="text-lg font-bold text-neutral-900">
                {t(`${tier.nameKey}.name`)}
              </CardTitle>
              <CardDescription>{t(`${tier.nameKey}.tagline`)}</CardDescription>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-neutral-900">
                  {tier.price}
                </span>
                <span className="text-sm font-medium text-neutral-500">{t('period')}</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-2">
              {tier.cta === 'checkout' ? (
                <CheckoutButton priceId={tier.priceId} label={tier.ctaLabel} className="w-full" />
              ) : (
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
        ))}
      </div>

      {/* FAQ */}
      <section className="mt-24 mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 text-center mb-10">
          {t('faq.title')}
        </h2>
        <div className="divide-y divide-neutral-200 border-t border-neutral-200">
          {faqItems.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-neutral-900 hover:text-blue-600 transition-colors">
                {q}
                <span className="shrink-0 text-lg font-light text-neutral-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
