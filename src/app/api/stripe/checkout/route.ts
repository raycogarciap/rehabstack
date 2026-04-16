// src/app/api/stripe/checkout/route.ts
// POST /api/stripe/checkout
//
// Crea una Stripe Checkout Session para suscribir al usuario a un agente.
// Requiere autenticación — el usuario debe estar logueado en Supabase.
//
// Body: { priceId: string, agentId: string }
// Response: { url: string }  → el cliente redirige a esta URL

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // ── 1. Verificar autenticación ────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // ── 2. Validar body ───────────────────────────────────────
  const body = await req.json().catch(() => ({})) as {
    priceId?: string;
    agentId?: string;
  };

  const { priceId, agentId } = body;

  if (!priceId || !agentId) {
    return NextResponse.json(
      { error: "priceId y agentId son requeridos." },
      { status: 400 }
    );
  }

  // ── 3. Obtener datos del usuario desde Supabase ───────────
  // Incluye email y stripe_customer_id si ya existe de una sesión anterior.
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "No se pudo obtener el perfil del usuario." },
      { status: 500 }
    );
  }

  // ── 4. Crear Checkout Session en Stripe ───────────────────
  try {
    const checkoutUrl = await createCheckoutSession({
      userId:          user.id,
      priceId,
      agentId,
      customerEmail:   profile.email ?? user.email ?? "",
      stripeCustomerId: profile.stripe_customer_id,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la sesión de pago.";
    console.error("[checkout] Error de Stripe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
