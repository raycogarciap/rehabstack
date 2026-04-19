// src/app/api/stripe/connect/login-link/route.ts
// POST /api/stripe/connect/login-link
//
// Genera un login link de Stripe Connect Express para que el creador acceda
// a su dashboard de payouts directamente en Stripe.
//
// Este es el endpoint correcto para creadores — NO el Billing Portal
// (que es para que suscriptores gestionen sus suscripciones).
//
// Requiere autenticación y rol 'creator'.
// El link generado expira en ~5 minutos y es de uso único.
//
// Response: redirige directamente al dashboard de Stripe Connect.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConnectLoginLink } from "@/lib/stripe";

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

  // ── 2. Verificar rol de creador ───────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, stripe_connect_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Perfil de usuario no encontrado." },
      { status: 403 }
    );
  }

  if (profile.role !== "creator" && profile.role !== "admin") {
    return NextResponse.json(
      { error: "Acceso denegado. Se requiere rol de creador." },
      { status: 403 }
    );
  }

  // ── 3. Verificar que tiene una cuenta Connect activa ──────────────────────
  if (!profile.stripe_connect_id) {
    return NextResponse.json(
      {
        error:
          "No tienes una cuenta de pagos configurada. " +
          "Completa el onboarding de Stripe Connect primero.",
      },
      { status: 404 }
    );
  }

  // ── 4. Generar login link de Connect Express ──────────────────────────────
  try {
    const loginUrl = await createConnectLoginLink(profile.stripe_connect_id);
    // Redirigir directamente — el link es de uso único y expira pronto
    return NextResponse.redirect(loginUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar el enlace de acceso.";
    console.error("[connect/login-link] Error de Stripe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
