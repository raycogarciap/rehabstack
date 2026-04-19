// Página de registro — /[locale]/register
// Server Component con Server Action para crear cuenta en Supabase Auth.
// Las especialidades se muestran en el idioma del locale activo.

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/server'
import { locales, localeNames } from '@/i18n/config'
import type { Locale } from '@/i18n/config'

// ── Metadata ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string; confirm?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.register' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// ── Server Action ──────────────────────────────────────────────────────────────

async function registerUser(formData: FormData) {
  'use server'
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string
  const name     = formData.get('name')     as string
  const specialty = formData.get('specialty') as string
  const language = (formData.get('language') as string) || 'en'
  const locale   = await getLocale()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { name, specialty, language },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    redirect(`/${locale}/register?error=${encodeURIComponent(error.message)}`)
  }

  // Email ya registrado y confirmado → identities vacío
  if (data.user && data.user.identities?.length === 0) {
    redirect(
      `/${locale}/register?error=${encodeURIComponent('This email is already registered.')}`
    )
  }

  if (data.user) {
    await supabase.from('users').insert({ id: data.user.id, email, name, specialty, language })
  }

  redirect(`/${locale}/register?confirm=pending`)
}

// ── Componente de página ───────────────────────────────────────────────────────

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const errorMessage  = sp.error
  const confirmPending = sp.confirm === 'pending'
  const t  = await getTranslations('auth.register')
  const ts = await getTranslations('auth.specialties')

  // Especialidades: valor en BD en inglés, label en el idioma del usuario
  const SPECIALTIES = [
    { value: 'Physical Therapy',     label: ts('physicalTherapy') },
    { value: 'Occupational Therapy', label: ts('occupationalTherapy') },
    { value: 'Speech Therapy',       label: ts('speechTherapy') },
    { value: 'Athletic Training',    label: ts('athleticTraining') },
    { value: 'Chiropractic',         label: ts('chiropractic') },
    { value: 'Massage Therapy',      label: ts('massageTherapy') },
    { value: 'Other',                label: ts('other') },
  ]

  // Idiomas disponibles en la plataforma
  const LANGUAGES = locales.map((l: Locale) => ({ value: l, label: localeNames[l] }))

  // Si el registro fue exitoso → solo mostrar confirmación
  if (confirmPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('checkEmailTitle')}</CardTitle>
          <CardDescription>{t('checkEmailSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-green-50 px-4 py-4 text-sm text-green-700 border border-green-200">
            <p className="font-medium">{t('almostThere')}</p>
            <p className="mt-1">{t('almostThereDesc')}</p>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-sm text-neutral-500">
          {t('alreadyConfirmed')}&nbsp;
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            {t('signIn')}
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form action={registerUser} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" name="email" type="email"
              placeholder={t('emailPlaceholder')} required autoComplete="email" />
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" name="password" type="password"
              placeholder={t('passwordPlaceholder')} required minLength={8}
              autoComplete="new-password" />
          </div>

          {/* Nombre completo */}
          <div className="space-y-1">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" name="name" type="text"
              placeholder={t('namePlaceholder')} required autoComplete="name" />
          </div>

          {/* Especialidad */}
          <div className="space-y-1">
            <Label htmlFor="specialty">{t('specialty')}</Label>
            <Select name="specialty" required>
              <SelectTrigger id="specialty">
                <SelectValue placeholder={t('specialtyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Idioma preferido */}
          <div className="space-y-1">
            <Label htmlFor="language">{t('language')}</Label>
            <Select name="language" defaultValue={locale}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t('languagePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">{t('submit')}</Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-neutral-500">
        {t('hasAccount')}&nbsp;
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          {t('signIn')}
        </Link>
      </CardFooter>
    </Card>
  )
}
