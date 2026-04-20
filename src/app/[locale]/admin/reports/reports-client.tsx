// src/app/[locale]/admin/reports/reports-client.tsx
// Client Component para el botón de exportación CSV del panel de reportes.
// Genera un archivo CSV a partir de los datos de agentes con necesidad de cambios.

'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

// ─── Tipo de agente "marcado" (needs_changes) ─────────────────────────────────

interface FlaggedAgent {
  id: string
  name: string
  creator_name: string | null
  status: string
  review_notes: string | null
  created_at: string
}

interface ExportCsvButtonProps {
  agents: FlaggedAgent[]
}

// ─── Componente del botón de exportación ─────────────────────────────────────

export function ExportCsvButton({ agents }: ExportCsvButtonProps) {
  const t = useTranslations('admin.reports')

  const handleExport = () => {
    // Construir encabezados del CSV
    const headers = ['ID', 'Name', 'Creator', 'Status', 'Review Notes', 'Created At']

    // Convertir cada agente a una fila CSV (escapar comas y comillas)
    const rows = agents.map((agent) => [
      agent.id,
      `"${(agent.name ?? '').replace(/"/g, '""')}"`,
      `"${(agent.creator_name ?? '').replace(/"/g, '""')}"`,
      agent.status,
      `"${(agent.review_notes ?? '').replace(/"/g, '""')}"`,
      agent.created_at,
    ])

    // Unir todas las filas en el contenido CSV
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    // Crear un enlace de descarga temporal y activarlo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `flagged-agents-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button size="sm" variant="outline" onClick={handleExport}>
      {t('exportCsv')}
    </Button>
  )
}
