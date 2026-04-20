// src/app/[locale]/admin/users/users-admin-client.tsx
// Client Component para la gestión de usuarios del panel admin.
// Permite buscar, filtrar por rol y cambiar el rol de los usuarios.

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserRecord {
  id: string
  email: string
  name: string | null
  role: 'user' | 'creator' | 'admin'
  subscription_tier: string | null
  created_at: string
}

// Colores para los badges de rol
const ROLE_COLORS: Record<string, string> = {
  user: 'bg-neutral-100 text-neutral-600',
  creator: 'bg-blue-100 text-blue-700',
  admin: 'bg-red-100 text-red-700',
}

const PAGE_SIZE = 50

// ─── Componente principal ─────────────────────────────────────────────────────

export function UsersAdminPage() {
  const t = useTranslations('admin.users')

  // Estado de filtros
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  // Estado de datos
  const [users, setUsers] = useState<UserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado de carga por acción (userId_role)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // ─── Función de carga de usuarios desde la API ────────────────────────────

  const fetchUsers = useCallback(async (q: string, role: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      if (role) params.set('role', role)
      params.set('page', String(p))
      params.set('limit', String(PAGE_SIZE))

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) return

      const json = await res.json()
      setUsers(Array.isArray(json) ? json : (json.users ?? []))
      setTotal(json.total ?? 0)
    } catch {
      // Error silenciado
    } finally {
      setLoading(false)
    }
  }, [])

  // Recargar con debounce en búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search, roleFilter, page)
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, roleFilter, page, fetchUsers])

  // ─── Cambiar el rol de un usuario ─────────────────────────────────────────

  const handleRoleChange = async (userId: string, newRole: string) => {
    const key = `${userId}_${newRole}`
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (res.ok) {
        // Actualizar el usuario en la lista sin recargar todo
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: newRole as UserRecord['role'] } : u
          )
        )
      }
    } catch {
      // Error silenciado
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  // ─── Obtener acciones disponibles por rol ─────────────────────────────────

  const getActions = (role: string): { label: string; targetRole: string }[] => {
    if (role === 'user') {
      return [
        { label: t('makeCreator'), targetRole: 'creator' },
        { label: t('makeAdmin'), targetRole: 'admin' },
      ]
    }
    if (role === 'creator') {
      return [
        { label: t('makeUser'), targetRole: 'user' },
        { label: t('makeAdmin'), targetRole: 'admin' },
      ]
    }
    if (role === 'admin') {
      return [{ label: t('makeUser'), targetRole: 'user' }]
    }
    return []
  }

  // ─── Etiqueta de rol traducida ────────────────────────────────────────────

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      user: t('roleUser'),
      creator: t('roleCreator'),
      admin: t('roleAdmin'),
    }
    return map[role] ?? role
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
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          <option value="">{t('filterAll')}</option>
          <option value="user">{t('roleUser')}</option>
          <option value="creator">{t('roleCreator')}</option>
          <option value="admin">{t('roleAdmin')}</option>
        </select>
      </div>

      {/* Tabla de usuarios */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-neutral-400">Cargando…</div>
        ) : users.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-neutral-500">{t('empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colUser')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colRole')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colTier')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colJoined')}</th>
                  <th className="px-4 py-3 font-medium text-neutral-600">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const actions = getActions(user.role)
                  const colorClass = ROLE_COLORS[user.role] ?? 'bg-neutral-100 text-neutral-600'

                  return (
                    <tr key={user.id} className="border-b border-neutral-50 last:border-b-0">
                      {/* Email + nombre */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{user.email}</div>
                        {user.name && (
                          <div className="text-xs text-neutral-400 mt-0.5">{user.name}</div>
                        )}
                      </td>

                      {/* Badge de rol */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      {/* Tier de suscripción */}
                      <td className="px-4 py-3 text-neutral-600">
                        {user.subscription_tier ?? '—'}
                      </td>

                      {/* Fecha de registro */}
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      {/* Botones de cambio de rol */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {actions.map(({ label, targetRole }) => {
                            const key = `${user.id}_${targetRole}`
                            return (
                              <Button
                                key={targetRole}
                                size="sm"
                                variant="outline"
                                disabled={actionLoading[key]}
                                onClick={() => handleRoleChange(user.id, targetRole)}
                                className="text-xs h-7 px-2"
                              >
                                {actionLoading[key] ? '…' : label}
                              </Button>
                            )
                          })}
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
            Página {page} de {totalPages} ({total} usuarios)
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
