-- Migración 003: Columnas de Stripe en la tabla users
-- Añade stripe_connect_id (para creadores con Connect Express)
-- y stripe_customer_id (para usuarios con suscripción activa).
-- Ejecutar después de 002_v2_schema.sql

-- ============================================================
-- 1. TABLA users — columnas Stripe
-- ============================================================

-- ID de cuenta Stripe Connect Express del creador.
-- Nulo hasta que el usuario complete el onboarding de Connect.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- ID de cliente Stripe del usuario suscriptor.
-- Se asigna al crear el primer Checkout Session y persiste
-- para reutilizarse en sesiones futuras y en el Billing Portal.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
