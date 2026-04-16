// src/app/api/stripe/connect/callback/route.ts
// GET /api/stripe/connect/callback
//
// Stripe redirige aquí cuando el creador termina (o abandona) el onboarding
// de Connect Express.
//
// Dos casos:
//   ?refresh=true  → el enlace expiró, redirigir a /for-creators para reintentar
//   (sin parámetros) → onboarding completado, promover role a "creator" y redirigir
//
// No requiere parámetro de cuenta — Stripe no pasa el accountId en el return_url.
// La cuenta ya fue guardada en users.stripe_connect_id por /api/stripe/connect.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  // ── Caso: enlace de onboarding expirado ───────────────────
  // Stripe incluye refresh=true cuando el link ya no es válido.
  // Enviamos al usuario a la página de creadores para que reintente.
  if (searchParams.get("refresh") === "true") {
    return NextResponse.redirect(new URL("/for-creators?connect=expired", origin));
  }

  // ── Verificar sesión del usuario ──────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No hay sesión activa — redirigir al login y volver aquí después
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", "/api/stripe/connect/callback");
    return NextResponse.redirect(loginUrl);
  }

  // ── Promover rol a "creator" ───────────────────────────────
  // Solo actualizamos si el rol actual no es ya "creator" o "admin"
  // para no degradar permisos accidentalmente.
  const { error } = await supabase
    .from("users")
    .update({ role: "creator" })
    .eq("id", user.id)
    .not("role", "in", '("creator","admin")');

  if (error) {
    console.error("[connect/callback] Error al actualizar rol:", error.message);
    // No bloqueamos al usuario — redirigimos igual y el admin puede corregirlo
  }

  // ── Redirigir al dashboard de creadores ───────────────────
  // El parámetro ?onboarded=true permite mostrar un mensaje de bienvenida
  return NextResponse.redirect(new URL("/creator?onboarded=true", origin));
}
