// src/components/agents/NewsletterForm.tsx
// Formulario de suscripción al newsletter — Client Component.
// Muestra confirmación inline tras envío (sin API real por ahora).

'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    // TODO: conectar con Resend o la API de newsletters
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p className="text-sm text-[#4F46E5] font-semibold">
        You&apos;re on the list! We&apos;ll be in touch.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-3 outline-none focus:border-[#4F46E5] transition-colors"
        required
      />
      <button
        type="submit"
        className="bg-[#4F46E5] text-white rounded-lg px-4 py-2 text-sm font-semibold w-full hover:bg-[#3730A3] transition-colors"
      >
        Subscribe
      </button>
    </form>
  )
}
