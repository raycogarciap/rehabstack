// src/app/[locale]/admin/agents/agents-admin-client.tsx
// Client Component para la gestión de todos los agentes del panel admin.
// Permite buscar, filtrar por estado y paginar. Acciones: pausar, activar, delistar, aprobar.

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  name: string
  short_description: string | null
  category: string | null
  status: string
  creator_name: string | null
  pricing_usd: number | null
  created_at: string
}

// Mapa de colores para los badges de estado
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  in_review: 'bg-yellow-100 text-yellow-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-orange-100 text-orange-700',
  delisted: 'bg-red-100 text-red-700',
  needs_changes: 'bg-purple-100 text-purple-700',
}

// Acciones disponibles según el estado del agente
const STATUS_ACTIONS: Record<string, string[]> = {
  draft: [],
  in_review: ['approve'],
  active: ['pause', 'delist'],
  paused: ['activate', 'delist'],
  delisted: ['activate'],
  needs_changes: ['approve'],
}

const PAGE_SIZE = 20

// ─── Componente principal ─────────────────────────────────────────────────────

export function AgentsAdminPage() {
  const t = useTranslations('admin.agents')

  // Estado de la búsqueda y filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Estado de los datos
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado de carga por acción (agentId_action)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // ─── Función de carga de agentes desde la API ─────────────────────────────

  const fetchAgents = useCallback(async (q: string, status: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      if (status) params.set('status', status)
      params.set('page', String(p))
      params.set('limit', String(PAGE_SIZE))

      const res = await fetch(`/api/admin/agents?${params.toString()}`)
      if (!res.ok) return

      const json = await res.json()
      setAgents(Array.isArray(json) ? json : (json.agents ?? []))
      setTotal(json.total ?? 0)
    } catch {
      // Error silenciado — se muestra estado vacío
    } finally {
      setLoading(false)
    }
  }, [])

  // Recargar al cambiar filtros (con debounce en la búsqueda)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgents(search, statusFilter, page)
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, statusFilter, page, fetchAgents])

  // ─── Ejecutar acción sobre un agente ─────────────────────────────────────

  const handleAction = async (agentId: string, action: string) => {
    const key = `${agentId}_${action}`
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        // Recargar la lista para reflejar el nuevo estado
        await fetchAgents(search, statusFilter, page)
      }
    } catch {
      // Error silenciado
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  // ─── Etiqueta de estado traducida ────────────────────────────────────────

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: t('statusDraft'),
      in_review: t('statusInReview'),
      active: t('statusActive'),
      paused: t('statusPaused'),
      delisted: t('statusDelisted'),
      needs_changes: t('statusNeedsChanges'),
    }
    return map[status] ?? status
  }

  // ─── Etiqueta de acción traducida ────────────────────────────────────────

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      approve: t('actionApprove'),
      pause: t('actionPause'),
      activate: t('actionActivate'),
      delist: t('actionDelist'),
    }
    return map[action] ?? action
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Título */}
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          <option value="">{t('filterAll')}</option>
          <option value="draft">{t('statusDraft')}</option>
          <option value="in_review">{t('statusInReview')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="paused">{t('statusPaused')}</option>
          <option value="delisted">{t('statusDelisted')}</option>
          <option value="needs_changes">{t('statusNeedsChanges')}</option>
        </select>
      </div>

      {/* Tabla de agentes */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-neutral-400">Cargando…</div>
        ) : agents.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-neutral-500">{t('empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colAgent')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colCreator')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colStatus')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const actions = STATUS_ACTIONS[agent.status] ?? []
                  const colorClass = STATUS_COLORS[agent.status] ?? 'bg-neutral-100 text-neutral-600'

                  return (
                    <tr key={agent.id} className="border-b border-neutral-50 last:border-b-0">
                      {/* Nombre + descripción */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{agent.name}</div>
                        {agent.short_description && (
                          <div className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                            {agent.short_description}
                          </div>
                        )}
                        {agent.category && (
                          <span className="inline-block mt-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                            {agent.category}
                          </span>
                        )}
                      </td>

                      {/* Creador */}
                      <td className="px-4 py-3 text-neutral-600">{agent.creator_name ?? '—'}</td>

                      {/* Badge de estado */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                          {getStatusLabel(agent.status)}
                        </span>
                      </td>

                      {/* Botones de acción */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {actions.length === 0 ? (
                            <span className="text-xs text-neutral-400">—</span>
                          ) : (
                            actions.map((action) => {
                              const key = `${agent.id}_${action}`
                              return (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading[key]}
                                  onClick={() => handleAction(agent.id, action)}
                                  className="text-xs h-7 px-2"
                                >
                                  {actionLoading[key] ? '…' : getActionLabel(action)}
                                </Button>
                              )
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Página {page} de {totalPages} ({total} agentes)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
