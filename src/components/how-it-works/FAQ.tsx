"use client";

// components/how-it-works/FAQ.tsx
// Acordeón de preguntas frecuentes. Cada ítem puede abrirse/cerrarse
// de forma independiente usando useState.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQProps {
  items: FAQItem[];
}

export function FAQ({ items }: FAQProps) {
  // Índice del ítem abierto; null = todos cerrados
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <div className="max-w-3xl mx-auto divide-y divide-gray-100">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="py-6">
            {/* Fila de pregunta — hace de botón */}
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex justify-between items-center w-full text-left gap-4"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-[#1E293B] text-lg leading-snug">
                {item.q}
              </span>
              <ChevronDown
                size={20}
                className="flex-shrink-0 text-[#4F46E5] transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Respuesta — visible solo cuando está abierto */}
            {isOpen && (
              <p className="text-[#64748B] leading-relaxed mt-4 text-base">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
