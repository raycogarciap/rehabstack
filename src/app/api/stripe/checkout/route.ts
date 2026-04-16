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
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // ── 1. Verificar autenticación ────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const userId = user.id;

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
  // Si la fila en public.users aún no existe (ej: registro reciente sin trigger),
  // usamos el email del token de auth como fallback en lugar de bloquear el checkout.
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    // PGRST116 = no rows — fila no creada aún, no es un error fatal
    if (profileError.code !== "PGRST116") {
      console.error("[checkout] Error al leer public.users:", {
        code:    profileError.code,
        message: profileError.message,
        userId:  user.id,
      });
    } else {
      console.warn("[checkout] Sin fila en public.users para userId:", user.id, "— usando email del token de auth.");
    }
  }

  // ── 4. Garantizar Stripe Customer ID (requerido por Accounts V2) ──
  // Accounts V2 no permite customer_email inline — el customer debe existir.
  let stripeCustomerId = profile?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    try {
      const email = profile?.email ?? user.email ?? "";
      stripeCustomerId = await createStripeCustomer({ email, userId });

      // Persistir para no crear duplicados en futuros checkouts
      await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);

      console.info("[checkout] Customer de Stripe creado:", stripeCustomerId, "para userId:", userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creando customer de Stripe.";
      console.error("[checkout] No se pudo crear el customer:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ── 5. Crear Checkout Session en Stripe ───────────────────
  try {
    const checkoutUrl = await createCheckoutSession({
      userId,
      priceId,
      agentId,
      stripeCustomerId,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la sesión de pago.";
    console.error("[checkout] Error de Stripe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
