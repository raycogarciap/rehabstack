// Navegación tipada para next-intl.
// Exporta Link, redirect, useRouter y usePathname con tipos seguros para los locales.
// SIEMPRE importar Link y redirect desde aquí — nunca de 'next/link' o 'next/navigation'
// cuando se trabaja dentro de rutas [locale].

import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
