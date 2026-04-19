// src/app/api/stripe/connect/callback/route.ts
// GET /api/stripe/connect/callback
//
// Stripe redirige aquí cuando el creador termina (o abandona) el onboarding
// de Connect Express.
//
// Seguridad:
//   - Valida el token `state` contra la cookie httpOnly establecida en
//     POST /api/stripe/connect. Previene que usuarios no autorizados
//     promuevan su propio rol visitando esta URL directamente.
//   - Verifica con la API de Stripe que `details_submitted = true` antes
//     de promover el rol. Un callback sin onboarding real es ignorado.
//
// Dos casos de flujo:
//   ?refresh=true  → el enlace expiró, redirigir para reintentar
//   ?state=<token> → onboarding completado, validar y promover a 'creator'

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isConnectAccountOnboarded } from "@/lib/stripe";

// Nombre de la cookie de estado CSRF — debe coincidir con /api/stripe/connect
const STATE_COOKIE = "stripe_connect_state";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  // ── Caso: enlace de onboarding expirado ───────────────────────────────────
  if (searchParams.get("refresh") === "true") {
    return NextResponse.redirect(new URL("/for-creators?connect=expired", origin));
  }

  // ── 1. Verificar token de estado (CSRF) ───────────────────────────────────
  // El token fue generado en POST /api/stripe/connect y guardado en cookie.
  // Stripe lo devuelve como query param ?state= en el return_url.
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const providedState = searchParams.get("state");

  if (!expectedState || !providedState || expectedState !== providedState) {
    // Sin token válido: posible acceso directo a la URL o sesión expirada.
    // No promover rol — redirigir a página de error.
    console.warn("[connect/callback] Estado inválido o ausente. Posible acceso directo a URL.");
    return NextResponse.redirect(new URL("/for-creators?connect=invalid", origin));
  }

  // Consumir la cookie — un token solo es válido una vez
  cookieStore.delete(STATE_COOKIE);

  // ── 2. Verificar sesión del usuario ───────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", "/creator/onboarding");
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Obtener stripe_connect_id del perfil ───────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("stripe_connect_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.stripe_connect_id) {
    // El usuario no tiene cuenta Connect — onboarding incompleto o inválido
    console.error("[connect/callback] stripe_connect_id no encontrado para user:", user.id);
    return NextResponse.redirect(new URL("/creator/onboarding?connect=error", origin));
  }

  // Ya es creator o admin — no degradar permisos
  if (profile.role === "creator" || profile.role === "admin") {
    return NextResponse.redirect(new URL("/creator", origin));
  }

  // ── 4. Verificar con Stripe que el onboarding está realmente completo ─────
  // Stripe marca details_submitted = true solo cuando el creador completó
  // todos los pasos de KYC en su plataforma. Un callback manipulado sin
  // haber completado el onboarding real falla aquí.
  try {
    const onboarded = await isConnectAccountOnboarded(profile.stripe_connect_id);

    if (!onboarded) {
      // Onboarding iniciado pero no completado (ej: cerró la pestaña de Stripe)
      return NextResponse.redirect(
        new URL("/creator/onboarding?step=2&incomplete=true", origin)
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al verificar cuenta de Stripe";
    console.error("[connect/callback] Error al verificar cuenta Connect:", message);
    return NextResponse.redirect(new URL("/creator/onboarding?connect=error", origin));
  }

  // ── 5. Promover rol a 'creator' ───────────────────────────────────────────
  // Solo si: state válido + usuario autenticado + stripe_connect_id en DB
  //        + Stripe confirma details_submitted = true
  const { error } = await supabase
    .from("users")
    .update({ role: "creator" })
    .eq("id", user.id);

  if (error) {
    console.error("[connect/callback] Error al actualizar rol:", error.message);
    // No bloqueamos la redirección — el admin puede corregirlo manualmente
  }

  // ── 6. Redirigir al dashboard de creadores ────────────────────────────────
  return NextResponse.redirect(new URL("/creator?onboarded=true", origin));
}
