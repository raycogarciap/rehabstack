-- Migración 005: Unique constraint en subscriptions.stripe_subscription_id
-- Requerido para que el upsert con onConflict: "stripe_subscription_id"
-- funcione correctamente (error 42P10 sin esta constraint).

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_stripe_subscription_id_key
  UNIQUE (stripe_subscription_id);
