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
//   account.updated (Connect)         → actualizar stripe_connect_id del creador

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ── Forzar lectura dinámica (no cachear este endpoint) ────────
export const dynamic = "force-dynamic";

// ── Cliente Supabase con service_role (bypassa RLS) ───────────
// No usa cookies — las operaciones son del sistema, no de un usuario.
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── Cliente Stripe ────────────────────────────────────────────
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

// ============================================================
// HANDLER PRINCIPAL
// Firma: POST(request: Request) — requerida por Next.js App Router
// ============================================================
export async function POST(request: Request) {
  // ── 1. Leer body crudo para verificar firma ───────────────
  // DEBE ser request.text() — si se parsea con .json() la firma falla
  // porque Stripe verifica el payload exactamente como llega por la red.
  const body = await request.text();
  const sig  = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("[webhook] Falta el header stripe-signature.");
    return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET no está configurado.");
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  // ── 2. Verificar firma criptográfica ──────────────────────
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firma inválida.";
    console.error("[webhook] Verificación de firma fallida:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── 3. Procesar evento y responder ────────────────────────
  // IMPORTANTE: se AWAITA handleEvent antes de devolver 200.
  // En Vercel (serverless), el proceso termina al devolver la respuesta —
  // un fire-and-forget mataría los handlers de Supabase antes de que completen.
  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`[webhook] Error no capturado en ${event.type}:`, err);
    // Devolver 500 para que Stripe reintente el evento
    return NextResponse.json({ error: "Error interno procesando el evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ============================================================
// ROUTER DE EVENTOS
// ============================================================
async function handleEvent(event: Stripe.Event): Promise<void> {
  console.info(`[webhook] Procesando evento: ${event.type} (${event.id})`);

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
      console.info(`[webhook] Evento no manejado: ${event.type}`);
      break;
  }
}

// ============================================================
// HANDLERS POR EVENTO
// ============================================================

/**
 * checkout.session.completed
 * Se dispara cuando el usuario completa el pago en Stripe Checkout.
 * Crea el registro de suscripción en Supabase y actualiza stripe_customer_id
 * en la tabla users para reutilizarlo en futuros checkouts y el portal.
 */
async function onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // ── Log completo de todos los valores extraídos ───────────
  // Imprime todo para que podamos diagnosticar qué llega del webhook.
  console.info("[webhook] checkout.session.completed — session.id:", session.id);
  console.info("[webhook] session.metadata:", JSON.stringify(session.metadata));
  console.info("[webhook] session.customer (raw):", session.customer);
  console.info("[webhook] session.subscription (raw):", session.subscription);

  // Verificar service role key
  console.info("[webhook] SUPABASE_SERVICE_ROLE_KEY configurado:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { userId, agentId, priceId } = session.metadata ?? {};

  // ── Validar metadata ──────────────────────────────────────
  console.info("[webhook] metadata extraída — userId:", userId, "| agentId:", agentId, "| priceId:", priceId);

  if (!userId || !priceId) {
    console.error("[webhook] metadata incompleta: falta userId o priceId.", session.metadata);
    return;
  }

  // Extraer IDs con tipos correctos del SDK v22
  const stripeSubscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;

  const stripeCustomerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id ?? null;

  console.info("[webhook] stripeSubscriptionId resuelto:", stripeSubscriptionId);
  console.info("[webhook] stripeCustomerId resuelto:", stripeCustomerId);

  const supabase = getServiceClient();
  const tier     = resolveTier(priceId);

  console.info("[webhook] tier resuelto:", tier, "para priceId:", priceId);

  // ── Upsert de suscripción ─────────────────────────────────
  // agent_id es NULL cuando agentId es "marketplace" (suscripción de plataforma)
  // para evitar FK violations — la columna agent_id referencia agents(id) UUID.
  const agentIdValue = (agentId && agentId !== "marketplace") ? agentId : null;

  const upsertPayload = {
    user_id:                userId,
    agent_id:               agentIdValue,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id:     stripeCustomerId,
    status:                 "active",
    tier,
  };

  console.info("[webhook] Intentando upsert en subscriptions:", JSON.stringify(upsertPayload));

  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .upsert(upsertPayload, { onConflict: "stripe_subscription_id" })
    .select();

  if (subError) {
    // Logear todos los campos del error de Supabase para diagnóstico completo
    console.error("[webhook] FALLO upsert en subscriptions:", {
      code:    subError.code,
      message: subError.message,
      details: subError.details,
      hint:    subError.hint,
      userId,
      stripeSubscriptionId,
    });
  } else {
    console.info("[webhook] Suscripción insertada/actualizada:", JSON.stringify(subData));
  }

  // ── Actualizar stripe_customer_id en users ────────────────
  if (stripeCustomerId) {
    const { error: userError } = await supabase
      .from("users")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);

    if (userError) {
      console.error("[webhook] Error al guardar stripe_customer_id en users:", {
        code:    userError.code,
        message: userError.message,
        details: userError.details,
        userId,
      });
    } else {
      console.info("[webhook] stripe_customer_id actualizado en users para userId:", userId);
    }
  }
}

/**
 * customer.subscription.updated
 * Se dispara en renovaciones, cambios de plan y cancelaciones programadas.
 * Actualiza el status en Supabase para reflejar el estado real en Stripe.
 */
async function onSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: subscription.status })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("[webhook] Error al actualizar suscripción:", {
      subscriptionId: subscription.id,
      status:         subscription.status,
      error:          error.message,
    });
  } else {
    console.info("[webhook] Suscripción actualizada:", subscription.id, "→", subscription.status);
  }
}

/**
 * customer.subscription.deleted
 * Se dispara cuando la suscripción termina definitivamente.
 * Marca la suscripción como "cancelled" en Supabase.
 */
async function onSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("[webhook] Error al cancelar suscripción:", {
      subscriptionId: subscription.id,
      error:          error.message,
    });
  } else {
    console.info("[webhook] Suscripción cancelada:", subscription.id);
  }
}

/**
 * account.updated (Connect)
 * Se dispara cuando el estado de una cuenta Express cambia.
 * Guarda el stripe_connect_id en la tabla users si aún no está.
 */
async function onConnectAccountUpdated(account: Stripe.Account): Promise<void> {
  if (account.charges_enabled) {
    console.info("[webhook] Connect account completó onboarding:", account.id);
  }

  // Solo actualizar si la cuenta tiene email y el usuario aún no tiene connect_id guardado
  const email = account.email;
  if (!email) return;

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("users")
    .update({ stripe_connect_id: account.id })
    .eq("email", email)
    .is("stripe_connect_id", null);

  if (error) {
    console.error("[webhook] Error al guardar stripe_connect_id:", error.message);
  }
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Resuelve el tier a partir del priceId usando variables de entorno.
 * No hardcodea IDs de Stripe en el código.
 */
function resolveTier(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER)      return "starter";
  if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL) return "professional";
  if (priceId === process.env.STRIPE_PRICE_CLINIC)       return "clinic";
  return "unknown";
}
