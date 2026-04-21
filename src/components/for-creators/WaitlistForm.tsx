// src/components/for-creators/WaitlistForm.tsx
// Formulario de waitlist inline para la sección "Managed Service" — Client Component.
// Muestra input de email + botón, y confirmación tras envío.

'use client'

import { useState } from 'react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <p className="text-sm text-[#4F46E5] font-semibold bg-[#EEF2FF] px-4 py-3 rounded-lg">
        ✓ You&apos;re on the waitlist. We&apos;ll be in touch.
      </p>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (email.trim()) setSubmitted(true)
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4F46E5] transition-colors"
        required
      />
      <button
        type="submit"
        className="bg-[#4F46E5] text-white hover:bg-[#3730A3] px-6 py-3 rounded-lg font-semibold text-sm transition-colors w-full"
      >
        Join the Waitlist →
      </button>
    </form>
  )
}
