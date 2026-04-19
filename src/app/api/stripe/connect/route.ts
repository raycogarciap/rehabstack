// src/app/api/stripe/connect/route.ts
// POST /api/stripe/connect
//
// Inicia el proceso de onboarding de Stripe Connect Express para creadores.
//
// Seguridad:
//   - Requiere autenticación. Cualquier usuario autenticado puede iniciar
//     el onboarding de Stripe Connect y convertirse en creator.
//   - Genera un token de estado (CSRF) guardado en cookie httpOnly. El callback
//     valida este token antes de promover el rol del usuario a 'creator'.
//
// Response: { url: string } — URL de onboarding de Stripe (redirect desde el cliente)

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createConnectAccount, createConnectAccountLink } from "@/lib/stripe";

// Nombre de la cookie de estado CSRF — debe coincidir con el callback
const STATE_COOKIE = "stripe_connect_state";

export async function POST(req: NextRequest) {
  void req;

  // ── 1. Verificar autenticación ────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // ── 2. Obtener perfil del usuario ─────────────────────────────────────────
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

  // ── 4. Generar token de estado (CSRF) ─────────────────────────────────────
  // crypto.randomUUID() está disponible en Node.js 15+ y en el Edge Runtime.
  // El token se guarda en cookie httpOnly y se incluye en el return_url de Stripe.
  // El callback valida que ambos coincidan antes de promover el rol.
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutos — suficiente para completar el onboarding
    path: "/",
  });

  // ── 5. Crear o reutilizar cuenta Connect Express ───────────────────────────
  try {
    if (profile.stripe_connect_id) {
      // Cuenta ya creada pero onboarding incompleto — generar nuevo enlace
      const onboardingUrl = await createConnectAccountLink(
        profile.stripe_connect_id,
        state,
      );
      return NextResponse.json({ url: onboardingUrl });
    }

    // ── 6. Crear cuenta Express nueva ─────────────────────────────────────
    const { accountId, onboardingUrl } = await createConnectAccount({
      email: profile.email ?? user.email ?? "",
      name:  profile.name  ?? user.email ?? "Creador RehabStack",
      state,
    });

    // ── 7. Guardar stripe_connect_id en Supabase ───────────────────────────
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
    const message =
      err instanceof Error ? err.message : "Error al crear la cuenta de creador.";
    console.error("[connect] Error de Stripe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
