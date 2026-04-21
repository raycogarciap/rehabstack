"use client";

// Formulario de captura de email — Client Component separado
// Recibe todas las cadenas traducidas como props desde FinalCTA (Server Component)
import { useState } from "react";

interface Props {
  emailTeaser: string;
  emailSubtext: string;
  emailPlaceholder: string;
  emailButton: string;
}

export function EmailCaptureForm({ emailTeaser, emailSubtext, emailPlaceholder, emailButton }: Props) {
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
    <div className="mt-10">
      <p className="text-indigo-200 text-sm mb-3">{emailTeaser}</p>
      <p className="text-white text-sm font-medium mb-4">{emailSubtext}</p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          className="flex-1 px-4 py-3 rounded-lg text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <button
          onClick={() => { if (email) setSubmitted(true); }}
          className="bg-[#6B9E78] hover:bg-[#4A7A57] text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
        >
          {emailButton}
        </button>
      </div>
    </div>
  );
}
