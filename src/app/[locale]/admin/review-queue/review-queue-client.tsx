// src/app/[locale]/admin/review-queue/review-queue-client.tsx
// Client Component para la cola de revisión de agentes.
// Muestra tabla con botones de acción: aprobar o solicitar cambios.
// Se auto-refresca cada 30 segundos desde la API.

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { ReviewAgent } from './page'

// ─── Props del componente ─────────────────────────────────────────────────────

interface ReviewQueueClientProps {
  initialAgents: ReviewAgent[]
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ReviewQueueClient({ initialAgents }: ReviewQueueClientProps) {
  const t = useTranslations('admin.reviewQueue')

  // Estado de la lista de agentes
  const [agents, setAgents] = useState<ReviewAgent[]>(initialAgents)

  // Estado del modal de solicitud de cambios
  const [modalAgentId, setModalAgentId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  // Estado de carga por botón (agentId → 'approving' | 'requesting' | null)
  const [loadingStates, setLoadingStates] = useState<Record<string, string | null>>({})

  // ─── Función para re-obtener la cola desde la API ─────────────────────────

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/agents?status=in_review&limit=100')
      if (!res.ok) return
      const json = await res.json()
      // La API devuelve { agents: [...] } o directamente el array
      const list: ReviewAgent[] = Array.isArray(json) ? json : (json.agents ?? [])
      setAgents(list)
    } catch {
      // Silenciar errores de red en el auto-refresh
    }
  }, [])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchQueue, 30_000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  // ─── Aprobar un agente ────────────────────────────────────────────────────

  const handleApprove = async (agentId: string) => {
    setLoadingStates((prev) => ({ ...prev, [agentId]: 'approving' }))
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        // Eliminar el agente aprobado de la lista
        setAgents((prev) => prev.filter((a) => a.id !== agentId))
      }
    } catch {
      // Error silenciado — el botón volverá a su estado normal
    } finally {
      setLoadingStates((prev) => ({ ...prev, [agentId]: null }))
    }
  }

  // ─── Enviar solicitud de cambios ──────────────────────────────────────────

  const handleRequestChanges = async () => {
    if (!modalAgentId) return
    setLoadingStates((prev) => ({ ...prev, [modalAgentId]: 'requesting' }))
    try {
      const res = await fetch(`/api/admin/agents/${modalAgentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_changes', review_notes: reviewNotes }),
      })
      if (res.ok) {
        // Eliminar el agente de la lista y cerrar el modal
        setAgents((prev) => prev.filter((a) => a.id !== modalAgentId))
        setModalAgentId(null)
        setReviewNotes('')
      }
    } catch {
      // Error silenciado
    } finally {
      setLoadingStates((prev) => ({ ...prev, [modalAgentId]: null }))
    }
  }

  // ─── Cerrar modal ─────────────────────────────────────────────────────────

  const closeModal = () => {
    setModalAgentId(null)
    setReviewNotes('')
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>
      </div>

      {/* Estado vacío */}
      {agents.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-12 text-center">
          <p className="text-sm text-neutral-500">{t('empty')}</p>
        </div>
      ) : (
        /* Tabla de agentes pendientes */
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colAgent')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colCreator')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colSubmitted')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const isApproving = loadingStates[agent.id] === 'approving'
                  const isRequesting = loadingStates[agent.id] === 'requesting'
                  const isBusy = isApproving || isRequesting

                  return (
                    <tr key={agent.id} className="border-b border-neutral-50 last:border-b-0">
                      {/* Nombre + categoría */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{agent.name}</div>
                        {agent.category && (
                          <span className="inline-block mt-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {agent.category}
                          </span>
                        )}
                      </td>

                      {/* Nombre del creador */}
                      <td className="px-4 py-3 text-neutral-600">{agent.creator_name ?? '—'}</td>

                      {/* Fecha de envío */}
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </td>

                      {/* Botones de acción */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleApprove(agent.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            {isApproving ? t('approving') : t('approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => {
                              setModalAgentId(agent.id)
                              setReviewNotes('')
                            }}
                            className="text-xs"
                          >
                            {isRequesting ? t('requesting') : t('requestChanges')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal de solicitud de cambios ────────────────────────────────── */}
      {modalAgentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">{t('modalTitle')}</h2>

            {/* Etiqueta del textarea */}
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {t('modalLabel')}
            </label>

            {/* Área de texto para las notas de revisión */}
            <textarea
              className="w-full min-h-[120px] rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder={t('modalPlaceholder')}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />

            {/* Botones del modal */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={closeModal}>
                {t('modalCancel')}
              </Button>
              <Button
                size="sm"
                disabled={!reviewNotes.trim() || loadingStates[modalAgentId] === 'requesting'}
                onClick={handleRequestChanges}
              >
                {loadingStates[modalAgentId] === 'requesting' ? t('requesting') : t('modalSubmit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
