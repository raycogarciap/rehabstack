-- Migración 006: Hacer agent_id nullable en subscriptions
-- Permite suscripciones de plataforma (Starter/Professional/Clinic)
-- que no están asociadas a un agente específico.

ALTER TABLE public.subscriptions
  ALTER COLUMN agent_id DROP NOT NULL;
