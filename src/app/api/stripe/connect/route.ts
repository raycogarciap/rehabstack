// src/app/api/stripe/connect/route.ts
// POST /api/stripe/connect
//
// Inicia el proceso de onboarding de Stripe Connect Express para creadores.
// Crea la cuenta Express en Stripe, guarda el stripe_connect_id en Supabase
// y devuelve la URL de onboarding para redirigir al usuario.
//
// Requiere autenticación.
// Response: { url: string }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConnectAccount, createConnectAccountLink } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  void req;

  // ── 1. Verificar autenticación ────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // ── 2. Obtener perfil del usuario ─────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("email, name, stripe_connect_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "No se pudo obtener el perfil del usuario." },
      { status: 500 }
    );
  }

  // ── 3. Reutilizar cuenta existente o crear una nueva ──────
  // Si ya existe un stripe_connect_id, el onboarding quedó incompleto.
  // Generamos un nuevo enlace para que pueda retomarlo.
  try {
    if (profile.stripe_connect_id) {
      const onboardingUrl = await createConnectAccountLink(profile.stripe_connect_id);
      return NextResponse.json({ url: onboardingUrl });
    }

    // ── 4. Crear cuenta Express nueva ────────────────────────
    const { accountId, onboardingUrl } = await createConnectAccount({
      email: profile.email ?? user.email ?? "",
      name:  profile.name  ?? user.email ?? "Creador RehabStack",
    });

    // ── 5. Guardar stripe_connect_id en Supabase ──────────────
    const { error: updateError } = await supabase
      .from("users")
      .update({ stripe_connect_id: accountId })
      .eq("id", user.id);

    if (updateError) {
      console.error("[connect] Error al guardar stripe_connect_id:", updateError.message);
      // No bloqueamos — el webhook account.updated puede recuperarlo
    }

    return NextResponse.json({ url: onboardingUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la cuenta de creador.";
    console.error("[connect] Error de Stripe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
