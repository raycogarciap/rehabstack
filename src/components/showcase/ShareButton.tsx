// src/components/showcase/ShareButton.tsx
// Botón de compartir link — Client Component.
// Copia window.location.href al portapapeles y muestra "✓ Copied!" por 2 segundos.

'use client'

import { useState } from 'react'
import { Link as LinkIcon } from 'lucide-react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores sin soporte de clipboard API
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="bg-white border border-gray-200 text-sm px-4 py-2 rounded-lg hover:border-[#4F46E5] flex items-center gap-2 inline-flex transition-colors"
    >
      <LinkIcon className="size-4 text-[#64748B]" aria-hidden="true" />
      {copied ? '✓ Copied!' : 'Copy link'}
    </button>
  )
}
