// Página de onboarding para creadores — /[locale]/creator/onboarding
// Server Component. Autentica al usuario, lee su perfil y determina
// en qué paso del flujo de onboarding se encuentra.
//
// Pasos:
//   1. Aceptar términos  → ?step=2
//   2. Conectar Stripe   → redirige a Stripe → callback → ?success=true
//   3. ¡Listo!           → ?success=true

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ConnectStripeButton } from '@/components/creator/connect-stripe-button'

// ── Tipos de props ────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'creator.onboarding' })
  return { title: t('metaTitle') }
}

// ── Iconos SVG ────────────────────────────────────────────────────────────────

// Círculo de paso completado (verde con marca de verificación)
function StepDone() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

// Círculo de paso activo (azul con número)
function StepActive({ n }: { n: number }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
      <span className="text-sm font-bold text-white">{n}</span>
    </div>
  )
}

// Círculo de paso pendiente (gris con número)
function StepPending({ n }: { n: number }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200">
      <span className="text-sm font-semibold text-neutral-500">{n}</span>
    </div>
  )
}

// Línea divisoria entre pasos
function StepLine({ completed }: { completed: boolean }) {
  return (
    <div
      className={`h-0.5 flex-1 ${completed ? 'bg-green-400' : 'bg-neutral-200'}`}
      aria-hidden="true"
    />
  )
}

// ── Indicador de progreso ─────────────────────────────────────────────────────

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
  step1Title: string
  step2Title: string
  step3Title: string
}

function StepIndicator({ currentStep, step1Title, step2Title, step3Title }: StepIndicatorProps) {
  return (
    <div className="mb-10">
      {/* Círculos y líneas conectoras */}
      <div className="flex items-center">
        {/* Paso 1 */}
        {currentStep > 1 ? <StepDone /> : currentStep === 1 ? <StepActive n={1} /> : <StepPending n={1} />}
        <StepLine completed={currentStep > 1} />
        {/* Paso 2 */}
        {currentStep > 2 ? <StepDone /> : currentStep === 2 ? <StepActive n={2} /> : <StepPending n={2} />}
        <StepLine completed={currentStep > 2} />
        {/* Paso 3 */}
        {currentStep === 3 ? <StepDone /> : <StepPending n={3} />}
      </div>

      {/* Títulos debajo de cada paso */}
      <div className="mt-2 flex justify-between text-xs text-neutral-500">
        <span className={currentStep === 1 ? 'font-semibold text-blue-600' : currentStep > 1 ? 'text-green-600' : ''}>
          {step1Title}
        </span>
        <span className={currentStep === 2 ? 'font-semibold text-blue-600' : currentStep > 2 ? 'text-green-600' : ''}>
          {step2Title}
        </span>
        <span className={currentStep === 3 ? 'font-semibold text-green-600' : ''}>
          {step3Title}
        </span>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default async function CreatorOnboardingPage({ params, searchParams }: Props) {
  // ── Autenticación ─────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const locale = await getLocale()
    redirect(`/${locale}/login`)
  }

  // ── Perfil del usuario (solo los campos necesarios para este paso) ─────────
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_connect_id')
    .eq('id', user.id)
    .single()

  // ── Parámetros de URL ─────────────────────────────────────────────────────
  const sp = await searchParams
  const successParam = sp['success']
  const stepParam    = sp['step']

  const isSuccess = successParam === 'true'
  const isStep2   = stepParam === '2'

  // ── Determinar paso actual ────────────────────────────────────────────────
  // Paso 3: onboarding completado (parámetro ?success=true)
  // Paso 2: Stripe Connect en progreso (stripe_connect_id ya guardado, o ?step=2)
  // Paso 1: inicio del flujo (por defecto)
  const currentStep: 1 | 2 | 3 = isSuccess
    ? 3
    : (isStep2 || !!profile?.stripe_connect_id)
      ? 2
      : 1

  // ── Traducciones ──────────────────────────────────────────────────────────
  const t    = await getTranslations('creator.onboarding')
  const { locale } = await params

  // Obtener el array de términos usando t.raw()
  const termsRaw = t.raw('terms') as string[]

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Título de la página */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          {t('title')}
        </h1>
        <p className="mt-2 text-neutral-500">{t('subtitle')}</p>
      </div>

      {/* Indicador de pasos */}
      <StepIndicator
        currentStep={currentStep}
        step1Title={t('step1Title')}
        step2Title={t('step2Title')}
        step3Title={t('step3Title')}
      />

      {/* ── Paso 1: Términos del creador ───────────────────────────────────── */}
      {currentStep === 1 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">
            {t('termsHeading')}
          </h2>

          {/* Lista de condiciones */}
          <ul className="mb-6 space-y-2">
            {termsRaw.map((term, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                {/* Viñeta azul */}
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                {term}
              </li>
            ))}
          </ul>

          {/* Botón que navega al paso 2 usando un enlace simple */}
          <Link href={`/${locale}/creator/onboarding?step=2`}>
            <Button size="lg" className="w-full sm:w-auto">
              {t('agreeButton')}
            </Button>
          </Link>
        </section>
      )}

      {/* ── Paso 2: Conectar Stripe ────────────────────────────────────────── */}
      {currentStep === 2 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm text-center">
          {/* Icono de Stripe / pago */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-neutral-900">
            {t('step2Title')}
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            {t('connectStripeDesc')}
          </p>

          {/* Botón cliente que llama a /api/stripe/connect */}
          <ConnectStripeButton />
        </section>
      )}

      {/* ── Paso 3: Éxito ─────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm text-center">
          {/* Icono de éxito grande */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-neutral-900">
            {t('successTitle')}
          </h2>
          <p className="mb-8 text-neutral-500">{t('successMessage')}</p>

          {/* Ir al dashboard de creadores */}
          <Link href={`/${locale}/creator`}>
            <Button size="lg">
              {t('goToDashboard')}
            </Button>
          </Link>
        </section>
      )}
    </main>
  )
}
