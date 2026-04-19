# i18n Architecture Design — RehabStack

**Date:** 2026-04-16  
**Status:** Approved  
**Author:** Claude Code + User  

---

## Overview

Full internationalization of the RehabStack Next.js app using next-intl v4.
Goal: adding a new language in the future = adding ONE JSON file only, zero code changes.

---

## Locales

| Code | Name | Direction |
|------|------|-----------|
| `en` | English | LTR (default) |
| `es` | Español | LTR |
| `pt` | Português | LTR |
| `fr` | Français | LTR |
| `de` | Deutsch | LTR |
| `ar` | العربية | RTL |

Default locale: `en`  
Default detection: `Accept-Language` header → fallback to `en`

---

## URL Structure

```
localePrefix: 'always'

/ → redirect → /[detected-locale]/
/en/agents
/es/agents
/ar/agents   (RTL layout)
```

API routes (`/api/*`) are excluded from locale routing entirely.

---

## File Architecture

### i18n Config Layer (`src/i18n/`)

| File | Purpose |
|------|---------|
| `config.ts` | Exports: `locales[]`, `defaultLocale`, `localeNames{}`, `rtlLocales[]`, type `Locale` |
| `routing.ts` | `defineRouting()` — next-intl routing config (locales + prefix) |
| `navigation.ts` | `createNavigation()` — type-safe `Link`, `useRouter`, `redirect`, `usePathname` |
| `request.ts` | `getRequestConfig()` — server-side message loading from JSON files |

### Messages (`src/messages/`)

One JSON file per locale: `en.json`, `es.json`, `pt.json`, `fr.json`, `de.json`, `ar.json`

Namespace structure:
```
nav.*          — navigation links
home.*         — homepage sections (hero, trustBadges, featuredAgents, etc.)
agents.*       — marketplace + agent detail page
pricing.*      — pricing plans, features, FAQ
auth.*         — login, register, specialties
dashboard.*    — nav, overview, agents, workspace
common.*       — shared: loading, error, save, cancel, etc.
```

### App Directory Structure

```
src/app/
  [locale]/                              ← NEW top-level locale segment
    layout.tsx                           ← html[lang] + html[dir] + NextIntlClientProvider
    page.tsx                             ← homepage placeholder
    (auth)/
      login/page.tsx                     ← MOVED + i18n applied
      register/page.tsx                  ← MOVED + i18n applied
    agents/
      layout.tsx                         ← MOVED
      page.tsx                           ← MOVED + i18n applied
      [category]/
        page.tsx                         ← MOVED + i18n applied
        [slug]/page.tsx                  ← MOVED + i18n applied
    pricing/
      layout.tsx                         ← MOVED
      page.tsx                           ← MOVED + i18n applied
    (dashboard)/
      dashboard/
        layout.tsx                       ← MOVED + i18n applied
        page.tsx                         ← MOVED + i18n applied
        agents/page.tsx                  ← MOVED + i18n applied
    (workspace)/
      dashboard/agents/[id]/
        layout.tsx                       ← MOVED + i18n applied
        page.tsx                         ← MOVED + i18n applied
        [...section]/page.tsx            ← MOVED + i18n applied
  api/                                   ← UNCHANGED (no locale prefix)
  layout.tsx                             ← REPLACED by [locale]/layout.tsx (keep root minimal)
  page.tsx                               ← REPLACED by [locale]/page.tsx
```

### Middleware (`src/middleware.ts`)

Combined middleware: next-intl locale routing + Supabase auth protection.

Logic:
1. `createMiddleware(routing)` handles locale detection + redirect
2. After locale resolution, check if route is protected (`/[locale]/dashboard/*`, `/[locale]/admin/*`)
3. If protected and no user → redirect to `/[locale]/login?redirectTo=...`
4. Pass through to next-intl response (which refreshes Supabase session)

Matcher: all routes except `_next/static`, `_next/image`, `favicon.ico`, static assets.

### Locale Switcher (`src/components/locale-switcher.tsx`)

Client Component. Dropdown showing current language name + flag emoji.
Switches locale while keeping current path (uses `useRouter` + `usePathname` from `src/i18n/navigation.ts`).

Flags: 🇬🇧 EN · 🇪🇸 ES · 🇧🇷 PT · 🇫🇷 FR · 🇩🇪 DE · 🇸🇦 AR

Integration points: PublicNav + dashboard sidebar (added in this task as placeholder wiring).

---

## Translation Usage Pattern

```tsx
// Server Component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('agents')
<h1>{t('title')}</h1>

// Client Component
import { useTranslations } from 'next-intl'
const t = useTranslations('nav')
<span>{t('agents')}</span>
```

---

## next.config.ts

Wrap with `createNextIntlPlugin`:
```ts
import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
export default withNextIntl(nextConfig)
```

---

## RTL Support

`src/app/[locale]/layout.tsx` dynamically sets:
```tsx
<html lang={locale} dir={rtlLocales.includes(locale) ? 'rtl' : 'ltr'}>
```

No additional CSS needed — Tailwind's logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) should be used for any directional spacing added during this task.

---

## Scope of This Task

**In scope:**
- All 13 files listed in app directory (create + move + apply i18n)
- All 4 i18n config files
- All 6 message JSON files (complete translations)
- `next.config.ts` update
- `middleware.ts` rewrite
- `locale-switcher.tsx` component
- `src/i18n/navigation.ts` (addition to user spec — required by next-intl v4)

**Out of scope:**
- Adding LocaleSwitcher to existing nav components (those components don't exist yet)
- Blog, community, docs, about, contact pages (not yet built)
- Creator/admin dashboard pages (not yet built)

---

## "One JSON File" Constraint

next-intl requires a static `locales` array for TypeScript types and routing.
True zero-code additions are not possible with this library.

**Practical implementation:** `src/i18n/config.ts` reads the locales array from a
single source of truth. Adding a language requires:
1. Add `src/messages/[locale].json`
2. Add the locale code to the `locales` array in `src/i18n/config.ts` (one-line change)

This is the minimum achievable with next-intl. All routing, types, RTL detection,
and message loading auto-derive from that single array. The design doc in CLAUDE.md
will be updated to reflect "adding locale = 1 JSON + 1 line in config.ts".

## Middleware Combination (next-intl v4 + Supabase)

next-intl v4 does NOT support arbitrary chaining. The correct pattern:

```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Let next-intl handle locale routing first
  const intlResponse = intlMiddleware(request)
  
  // 2. If it's a redirect (locale normalization), return it immediately
  if (intlResponse.status !== 200) return intlResponse

  // 3. Run Supabase session refresh on the resolved URL
  const { supabaseResponse, user } = await updateSession(request)

  // 4. Protect locale-prefixed dashboard/admin routes
  const pathname = request.nextUrl.pathname
  const isProtected = /^\/[a-z]{2}(-[A-Z]{2})?\/(dashboard|admin)/.test(pathname)
  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
```

## Success Criteria

1. `npm run build` passes with no TypeScript errors
2. Navigating to `/` redirects to `/en/` (or detected locale)
3. Navigating to `/es/agents` shows Spanish text
4. Navigating to `/ar/agents` shows Arabic text with `dir="rtl"` on `<html>`
5. `/api/*` routes work without locale prefix
6. Unauthenticated user visiting `/en/dashboard` redirects to `/en/login`
7. Adding a new locale requires: 1 JSON file + 1 line in `src/i18n/config.ts`
