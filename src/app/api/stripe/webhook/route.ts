// src/app/api/stripe/webhook/route.ts
// POST /api/stripe/webhook
//
// Endpoint público — Stripe llama aquí directamente, SIN autenticación de usuario.
// Verifica la firma del webhook con STRIPE_WEBHOOK_SECRET para garantizar
// que el evento viene de Stripe y no de un tercero.
//
// Usa el cliente de Supabase con service_role para bypassear RLS,
// ya que las operaciones se hacen en nombre del sistema, no de un usuario.
//
// Eventos manejados:
//   checkout.session.completed        → crear registro en subscriptions + guardar stripe_customer_id
//   customer.subscription.updated     → actualizar status de la suscripción
//   customer.subscription.deleted     → marcar suscripción como cancelled
//   account.updated (Connect)         → actualizar estado de la cuenta Connect del creador

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ── Cliente Supabase con service_role (bypassa RLS) ───────────
// Se instancia aquí, no en lib/supabase/server, porque ese usa cookies
// de sesión del usuario. El webhook no tiene usuario — es el sistema.
function getServiceClient() {
  const url   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ── Singleton de Stripe ───────────────────────────────────────
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-03-31.basil",
  });
}

// ── Forzar lectura dinámica (no cachear este endpoint) ────────
export const dynamic = "force-dynamic";

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function POST(req: NextRequest) {
  // ── 1. Leer body crudo para verificar firma ───────────────
  // En App Router el body NO tiene bodyParser automático —
  // req.text() devuelve el payload tal como llega de Stripe.
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET no configurado.");
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  // ── 2. Verificar firma criptográfica ──────────────────────
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firma inválida.";
    console.error("[webhook] Verificación fallida:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── 3. Responder 200 rápido; Stripe reintenta si no recibe respuesta ──
  // El trabajo pesado se hace en la misma llamada (no hay fondo/queue todavía),
  // pero la respuesta ya se envió — Stripe no esperará el resultado async.
  handleEvent(event).catch((err) =>
    console.error(`[webhook] Error procesando ${event.type}:`, err)
  );

  return NextResponse.json({ received: true });
}

// ============================================================
// ROUTER DE EVENTOS
// ============================================================
async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "account.updated":
      await onConnectAccountUpdated(event.data.object as Stripe.Account);
      break;

    default:
      // Evento no manejado — ignorar silenciosamente
      break;
  }
}

// ============================================================
// HANDLERS POR EVENTO
// ============================================================

/**
 * checkout.session.completed
 * Se dispara cuando el usuario completa el pago en Stripe Checkout.
 * Crea el registro de suscripción en Supabase y guarda el stripe_customer_id
 * en la tabla users para reutilizarlo en futuros checkouts y el portal.
 */
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, agentId, priceId } = session.metadata ?? {};

  if (!userId || !agentId || !priceId) {
    console.error("[webhook] checkout.session.completed: metadata incompleta.", session.metadata);
    return;
  }

  const stripeSubscriptionId = session.subscription as string | null;
  const stripeCustomerId     = session.customer     as string | null;

  const supabase = getServiceClient();

  // Determinar el tier a partir del priceId
  const tier = resolveTier(priceId);

  // Insertar o actualizar suscripción (upsert por stripe_subscription_id)
  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      user_id:                userId,
      agent_id:               agentId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id:     stripeCustomerId,
      status:                 "active",
      tier,
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (subError) {
    console.error("[webhook] Error al crear subscripción:", subError.message);
  }

  // Guardar stripe_customer_id en users para futuras sesiones
  if (stripeCustomerId) {
    const { error: userError } = await supabase
      .from("users")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);

    if (userError) {
      console.error("[webhook] Error al guardar stripe_customer_id:", userError.message);
    }
  }
}

/**
 * customer.subscription.updated
 * Stripe envía este evento en renovaciones, cambios de plan,
 * cancelaciones programadas (cancel_at_period_end = true), etc.
 * Actualiza el status en Supabase para reflejar el estado real.
 */
async function onSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: subscription.status })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("[webhook] Error al actualizar suscripción:", error.message);
  }
}

/**
 * customer.subscription.deleted
 * Se dispara cuando la suscripción termina definitivamente
 * (fin del período si cancel_at_period_end, o cancelación inmediata).
 * Marca la suscripción como cancelled.
 */
async function onSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("[webhook] Error al cancelar suscripción:", error.message);
  }
}

/**
 * account.updated (Connect)
 * Stripe envía este evento cuando el estado de la cuenta Express cambia.
 * Útil para detectar cuando el creador completa el onboarding
 * (charges_enabled = true) o cuando hay restricciones.
 */
async function onConnectAccountUpdated(account: Stripe.Account) {
  // Buscar el usuario por stripe_connect_id para actualizarlo
  const supabase = getServiceClient();

  // Solo loguear por ahora — la columna connect ya fue guardada al crear la cuenta.
  // En el futuro: actualizar un campo connect_status si se añade a la tabla.
  if (account.charges_enabled) {
    console.info(`[webhook] Connect account ${account.id} completó onboarding.`);
  }

  // Actualizar stripe_connect_id si por algún motivo no se guardó antes
  const email = account.email;
  if (email) {
    await supabase
      .from("users")
      .update({ stripe_connect_id: account.id })
      .eq("email", email)
      .is("stripe_connect_id", null); // Solo actualiza si aún no tiene ID
  }
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Resuelve el tier de suscripción a partir del priceId.
 * Usa las variables de entorno para no hardcodear IDs.
 */
function resolveTier(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER)      return "starter";
  if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL) return "professional";
  if (priceId === process.env.STRIPE_PRICE_CLINIC)       return "clinic";
  return "unknown";
}
