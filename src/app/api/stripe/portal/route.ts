// src/app/api/stripe/portal/route.ts
// POST /api/stripe/portal
//
// Crea una sesión del Stripe Billing Portal para que el usuario gestione
// su suscripción: cambiar plan, actualizar tarjeta, ver historial, cancelar.
//
// Requiere autenticación. El usuario debe tener al menos una suscripción
// activa para tener un stripe_customer_id asociado.
//
// Response: { url: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  // Evitar warning de "req" no usado — el body es opcional (no se necesita)
  void req;

  // ── 1. Verificar autenticación ────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // ── 2. Obtener stripe_customer_id del usuario ─────────────
  // La fuente de verdad es la columna users.stripe_customer_id,
  // guardada por el webhook checkout.session.completed.
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: "No se pudo obtener el perfil del usuario." },
      { status: 500 }
    );
  }

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "El usuario no tiene una suscripción activa." },
      { status: 404 }
    );
  }

  // ── 3. Crear sesión del Billing Portal ────────────────────
  try {
    const portalUrl = await createPortalSession({
      stripeCustomerId: profile.stripe_customer_id,
      returnPath: "/dashboard/account",
    });

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear el portal de facturación.";
    console.error("[portal] Error de Stripe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
