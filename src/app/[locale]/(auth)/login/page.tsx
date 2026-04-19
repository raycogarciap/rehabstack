// Página de inicio de sesión — /[locale]/login
// Server Component con Server Actions para email+contraseña y magic link.
// Los redirects usan getLocale() para construir rutas locale-aware.

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

// ── Metadata ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string; magic?: string; redirectTo?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

// ── Server Actions ─────────────────────────────────────────────────────────────

async function loginWithPassword(formData: FormData) {
  'use server'
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = await getLocale()
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Tras login exitoso va al dashboard (aún no migrado — middleware maneja la ruta)
  redirect('/dashboard')
}

async function loginWithMagicLink(formData: FormData) {
  'use server'
  const email = formData.get('magic-email') as string
  const locale = await getLocale()
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/${locale}/login?magic=sent`)
}

// ── Componente de página ───────────────────────────────────────────────────────

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const errorMessage = params.error
  const magicSent = params.magic === 'sent'
  const t = await getTranslations('auth.login')

  return (
    <>
      {/* Formulario principal: email + contraseña */}
      <Card className="mb-4">
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

          <form action={loginWithPassword} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email" name="email" type="email"
                placeholder={t('emailPlaceholder')}
                required autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password" name="password" type="password"
                placeholder={t('passwordPlaceholder')}
                required autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full">{t('submit')}</Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-neutral-500">
          {t('noAccount')}&nbsp;
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            {t('createOne')}
          </Link>
        </CardFooter>
      </Card>

      {/* Separador */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs text-neutral-400">
          <span className="bg-neutral-50 px-2">{t('or')}</span>
        </div>
      </div>

      {/* Formulario de magic link */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">{t('magicLink')}</CardTitle>
          <CardDescription className="text-sm">{t('magicLinkSubtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          {magicSent && (
            <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
              {t('checkEmail')}
            </div>
          )}

          <form action={loginWithMagicLink} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="magic-email">{t('email')}</Label>
              <Input
                id="magic-email" name="magic-email" type="email"
                placeholder={t('magicEmailPlaceholder')}
                required autoComplete="email"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              {t('sendMagicLink')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
