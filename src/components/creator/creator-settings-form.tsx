// Client Component: formulario de configuración del creador.
// Maneja tres secciones:
//   1. Perfil del creador (nombre, bio, sitio web)
//   2. Stripe Connect (estado de conexión y gestión de pagos)
//   3. Zona de peligro (pausar todos los agentes activos)

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// ── Props del componente ──────────────────────────────────────────────────────

interface Props {
  initialName: string
  initialEmail: string
  stripeConnectId: string | null
}

// ── Tipo interno para los agentes del creador ─────────────────────────────────

interface AgentItem {
  id: string
  status: string
}

// ── Componente principal ──────────────────────────────────────────────────────

export function CreatorSettingsForm({
  initialName,
  initialEmail,
  stripeConnectId,
}: Props) {
  const t = useTranslations('creator.settings')

  // ── Estado del formulario de perfil ─────────────────────────────────────
  // displayName se guarda en la tabla users; bio y website son solo UI local
  // (requieren migración de la base de datos para persistirse).
  const [displayName, setDisplayName] = useState(initialName)
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // ── Estado de la zona de peligro ─────────────────────────────────────────
  const [pausingAll, setPausingAll] = useState(false)
  const [pauseError, setPauseError] = useState<string | null>(null)
  const [pauseDone, setPauseDone] = useState(false)

  // ── Handler: guardar perfil ───────────────────────────────────────────────
  // Actualiza 'name' a través del API route del servidor en lugar de
  // escribir directamente con el cliente de Supabase del browser.
  // Esto garantiza que la actualización pase por verificación explícita
  // de user.id en el servidor, independiente de la configuración de RLS.
  async function handleSaveProfile() {
    setSavingProfile(true)
    setProfileSaved(false)
    setProfileError(null)

    try {
      const res = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(error ?? `Error ${res.status}`)
      }

      setProfileSaved(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setProfileError(message)
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Handler: pausar todos los agentes ────────────────────────────────────
  // Confirma con el usuario, luego obtiene todos los agentes del creador
  // y pausa los que están activos.
  async function handlePauseAll() {
    const confirmed = window.confirm(t('pauseAllConfirm'))
    if (!confirmed) return

    setPausingAll(true)
    setPauseError(null)
    setPauseDone(false)

    try {
      // Obtener todos los agentes del creador
      const res = await fetch('/api/creator/agents')
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { agents } = (await res.json()) as { agents: AgentItem[] }

      // Pausar solo los que están activos en paralelo
      await Promise.all(
        agents
          .filter((a) => a.status === 'active')
          .map((a) =>
            fetch(`/api/creator/agents/${a.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'paused' }),
            })
          )
      )

      setPauseDone(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setPauseError(message)
    } finally {
      setPausingAll(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ================================================================
          SECCIÓN 1: Perfil del Creador
          ================================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profileSection')}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Campo: Nombre para mostrar */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={initialEmail}
            />
          </div>

          {/* Campo: Biografía
              Nota: este campo es solo UI por ahora. Para persistirlo se necesita
              agregar la columna 'bio' a la tabla users mediante una migración. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">{t('bio')}</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder={t('bioHint')}
            />
            <p className="text-xs text-muted-foreground">{t('bioHint')}</p>
          </div>

          {/* Campo: URL del sitio web
              Nota: igual que bio, requiere migración para persistir en la DB. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="website">{t('website')}</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Mensaje de error al guardar */}
          {profileError && (
            <p className="text-sm text-destructive">{profileError}</p>
          )}

          {/* Confirmación de guardado exitoso */}
          {profileSaved && !savingProfile && (
            <p className="text-sm text-green-600">&#10003; Guardado</p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? t('saving') : t('saveProfile')}
          </Button>
        </CardFooter>
      </Card>

      {/* ================================================================
          SECCIÓN 2: Stripe Connect
          ================================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>{t('stripeSection')}</CardTitle>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-4 flex-wrap">
          {/* Badge de estado de conexión */}
          {stripeConnectId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              {/* Punto verde de estado */}
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {t('stripeConnected')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600">
              {/* Punto gris de estado */}
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              {t('stripeNotConnected')}
            </span>
          )}

          {/* Botón de acción según estado */}
          {stripeConnectId ? (
            /* Acceder al dashboard de payouts en Stripe Connect Express.
               Usa /api/stripe/connect/login-link (no /api/stripe/portal,
               que es para suscriptores, no para creadores). */
            <form action="/api/stripe/connect/login-link" method="POST">
              <Button type="submit" variant="outline">
                {t('managePayouts')}
              </Button>
            </form>
          ) : (
            /* Iniciar flujo de conexión con Stripe */
            <form action="/api/stripe/connect" method="POST">
              {/* "Connect with Stripe" es una frase de marca — Stripe la usa en inglés globalmente */}
              <Button type="submit">Connect with Stripe</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          SECCIÓN 3: Zona de Peligro
          Borde rojo para indicar acciones destructivas/irreversibles.
          ================================================================ */}
      <Card className="border-2 border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/* Descripción de la acción */}
          <p className="text-sm text-muted-foreground">{t('pauseAllDesc')}</p>

          {/* Mensaje de error si la operación falla */}
          {pauseError && (
            <p className="text-sm text-destructive">{pauseError}</p>
          )}

          {/* Confirmación de éxito */}
          {pauseDone && !pausingAll && (
            <p className="text-sm text-green-600">
              &#10003; Todos los agentes activos han sido pausados.
            </p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            variant="destructive"
            onClick={handlePauseAll}
            disabled={pausingAll}
          >
            {pausingAll ? '...' : t('pauseAll')}
          </Button>
        </CardFooter>
      </Card>

    </div>
  )
}
