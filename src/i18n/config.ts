// Configuración central de i18n.
// Para agregar un idioma: 1) añadir el código aquí, 2) crear src/messages/[locale].json
// Todo lo demás (routing, RTL, carga de mensajes) se deriva automáticamente.

export const locales = ['en', 'es', 'pt', 'fr', 'de', 'ar'] as const

export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

// Nombre legible de cada idioma — usado en el LocaleSwitcher
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ar: 'العربية',
}

// Flags emoji para el LocaleSwitcher
export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  pt: '🇧🇷',
  fr: '🇫🇷',
  de: '🇩🇪',
  ar: '🇸🇦',
}

// Idiomas con dirección de texto de derecha a izquierda
export const rtlLocales: Locale[] = ['ar']

// Devuelve 'rtl' o 'ltr' según el locale — usado en <html dir="...">
export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr'
}
