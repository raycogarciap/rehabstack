// Client Component: selector de idioma para el navbar y el sidebar.
// Usa useRouter + usePathname de next-intl para cambiar el locale
// sin perder la ruta actual.

'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value as Locale })
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      aria-label="Select language"
      className={
        className ??
        'rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-400/20 cursor-pointer'
      }
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeFlags[l]} {localeNames[l]}
        </option>
      ))}
    </select>
  )
}
