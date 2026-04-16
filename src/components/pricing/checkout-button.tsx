"use client";

// src/components/pricing/checkout-button.tsx
// Botón de inicio de suscripción — Client Component.
//
// Flujo:
//   1. Usuario hace clic
//   2. POST a /api/stripe/checkout con { priceId, agentId: "marketplace" }
//   3. Si 401 (no autenticado) → redirige a /register?redirect=/pricing
//   4. Si éxito → redirige a la URL de Stripe Checkout
//
// El agentId "marketplace" indica que es una suscripción de plataforma,
// no de un agente específico. El webhook lo interpreta correctamente.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CheckoutButtonProps {
  priceId: string;
  label?: string;
  className?: string;
}

export function CheckoutButton({
  priceId,
  label = "Get Started",
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          agentId: "marketplace", // suscripción de plataforma
        }),
      });

      // Usuario no autenticado → redirigir a registro con redirect de vuelta
      if (res.status === 401) {
        router.push("/register?redirect=/pricing");
        return;
      }

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "No se pudo iniciar el pago. Intenta de nuevo.");
        return;
      }

      // Redirigir al Checkout de Stripe (URL externa)
      window.location.href = data.url;
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? "Redirecting…" : label}
      </Button>

      {/* Mensaje de error inline — solo visible si la API falla */}
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
