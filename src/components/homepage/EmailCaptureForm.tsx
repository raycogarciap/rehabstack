"use client";

// Formulario de captura de email — Client Component separado
// FinalCTA.tsx (Server Component) lo importa para mantener el límite cliente/servidor correcto
import { useState } from "react";

export function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-indigo-200 text-sm">
        ✓ You&apos;re on the list. We&apos;ll send weekly insights.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 px-4 py-3 rounded-lg text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
      />
      <button
        onClick={() => { if (email) setSubmitted(true); }}
        className="bg-[#6B9E78] hover:bg-[#4A7A57] text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </div>
  );
}
