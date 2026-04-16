// src/lib/stripe.ts
// Cliente singleton de Stripe (solo servidor) y funciones helper para:
//   - Crear Checkout Sessions (suscripciones)
//   - Crear cuentas Connect Express (creadores)
//   - Obtener / cancelar suscripciones
//   - Crear sesiones del Billing Portal
//
// IMPORTANTE: nunca importar este archivo desde componentes con "use client".

import Stripe from "stripe";

// ============================================================
// 1. SINGLETON DE STRIPE
// ============================================================

// Instancia única reutilizada en todo el servidor.
// La versión de API es la más reciente estable del SDK v22.
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY no está definido en las variables de entorno.");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
      // Identifica las llamadas de la plataforma en el dashboard de Stripe
      appInfo: {
        name: "RehabStack",
        version: "1.0.0",
      },
    });
  }
  return _stripe;
}

// ============================================================
// 2. IDs DE PRECIOS (exportados para la página de pricing)
// ============================================================

// Usados en /pricing para construir los botones de suscripción.
// Los valores vienen de las variables de entorno definidas en .env.local.
export const PRICE_IDS = {
  starter:      process.env.STRIPE_PRICE_STARTER      ?? "",
  professional: process.env.STRIPE_PRICE_PROFESSIONAL ?? "",
  clinic:       process.env.STRIPE_PRICE_CLINIC        ?? "",
} as const;

// IDs de productos (útiles para metadata y lógica de negocio)
export const PRODUCT_IDS = {
  starter:      process.env.STRIPE_PRODUCT_STARTER      ?? "",
  professional: process.env.STRIPE_PRODUCT_PROFESSIONAL ?? "",
  clinic:       process.env.STRIPE_PRODUCT_CLINIC        ?? "",
} as const;

// ============================================================
// 3. CHECKOUT SESSION
// ============================================================

/**
 * Crea una Stripe Checkout Session para suscripción.
 *
 * Si el usuario ya tiene stripe_customer_id en Supabase, lo reutiliza
 * para que Stripe pre-rellene datos y conserve el historial de pagos.
 *
 * @returns URL de redirección al Checkout de Stripe
 */
export async function createCheckoutSession({
  userId,
  priceId,
  agentId,
  customerEmail,
  stripeCustomerId,
}: {
  userId: string;
  priceId: string;
  agentId: string;
  customerEmail: string;
  stripeCustomerId?: string | null;
}): Promise<string> {
  const stripe = getStripe();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Redirige al dashboard con indicador de éxito para mostrar mensaje
    success_url: `${siteUrl}/dashboard/agents?success=true`,
    // Regresa al marketplace si el usuario cancela
    cancel_url: `${siteUrl}/agents`,
    // Metadata propagada al webhook checkout.session.completed
    metadata: { userId, agentId, priceId },
    // Permite al webhook recuperar la suscripción expandida
    subscription_data: {
      metadata: { userId, agentId },
    },
  };

  // Reutilizar customer existente o crear uno nuevo por email
  if (stripeCustomerId) {
    sessionParams.customer = stripeCustomerId;
  } else {
    sessionParams.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error("Stripe no devolvió una URL de Checkout.");
  }
  return session.url;
}

// ============================================================
// 4. CONNECT EXPRESS (creadores)
// ============================================================

/**
 * Crea una cuenta Stripe Connect Express para un creador
 * y devuelve la URL de onboarding.
 *
 * La cuenta Express permite a Stripe gestionar el KYC y los payouts,
 * RehabStack retiene solo el porcentaje de comisión.
 */
export async function createConnectAccount({
  email,
  name,
}: {
  email: string;
  name: string;
}): Promise<{ accountId: string; onboardingUrl: string }> {
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Crear cuenta Express con capabilities de transferencias
  const account = await stripe.accounts.create({
    type: "express",
    email,
    display_name: name,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { rehabstack_user_email: email },
  });

  // Generar enlace de onboarding (expira en ~10 min, Stripe lo gestiona)
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${siteUrl}/api/stripe/connect/callback?refresh=true`,
    return_url:  `${siteUrl}/api/stripe/connect/callback`,
    type: "account_onboarding",
  });

  return { accountId: account.id, onboardingUrl: accountLink.url };
}

/**
 * Genera un nuevo enlace de onboarding para una cuenta Connect
 * que ya existe pero no completó el proceso (ej: sesión expirada).
 */
export async function createConnectAccountLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/api/stripe/connect/callback?refresh=true`,
    return_url:  `${siteUrl}/api/stripe/connect/callback`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

// ============================================================
// 5. GESTIÓN DE SUSCRIPCIONES
// ============================================================

/**
 * Obtiene los detalles de una suscripción de Stripe.
 * Expande el precio para tener acceso al tier del producto.
 */
export async function getSubscription(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items.data.price.product"],
  });
}

/**
 * Cancela una suscripción al final del período de facturación actual.
 * No cancela inmediatamente — el usuario conserva el acceso hasta la fecha de renovación.
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

// ============================================================
// 6. BILLING PORTAL
// ============================================================

/**
 * Crea una sesión del Stripe Billing Portal para que el usuario
 * pueda gestionar su suscripción, cambiar de plan o actualizar
 * método de pago sin pasar por el código de la app.
 *
 * @returns URL de redirección al portal de Stripe
 */
export async function createPortalSession({
  stripeCustomerId,
  returnPath = "/dashboard/account",
}: {
  stripeCustomerId: string;
  returnPath?: string;
}): Promise<string> {
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${siteUrl}${returnPath}`,
  });

  return session.url;
}
