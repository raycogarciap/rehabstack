-- =================================================================
-- RehabStack — Migración inicial del esquema
-- Archivo: 001_initial_schema.sql
-- Descripción: Crea todas las tablas, índices y políticas RLS
--              para el marketplace de agentes IA de fisioterapia.
-- =================================================================


-- =================================================================
-- EXTENSIONES
-- =================================================================

-- Habilita la generación de UUIDs con gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =================================================================
-- TABLA: users
-- Perfil público de cada profesional registrado.
-- La columna id referencia al usuario autenticado en auth.users.
-- =================================================================
CREATE TABLE public.users (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text        UNIQUE NOT NULL,
  name              text,
  specialty         text,
  location          text,
  language          text        NOT NULL DEFAULT 'en',
  subscription_tier text        NOT NULL DEFAULT 'free',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsquedas y validaciones por email
CREATE INDEX idx_users_email ON public.users (email);

-- Activa Row Level Security en la tabla
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede leer su propio perfil
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Política: cada usuario solo puede actualizar su propio perfil
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Política: el trigger de registro puede insertar el perfil inicial
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);


-- =================================================================
-- TABLA: agents
-- Agentes de IA publicados en el marketplace.
-- =================================================================
CREATE TABLE public.agents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  description          text,
  tier                 text        NOT NULL,
  pricing_usd          numeric,
  creator_id           uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  compliance_badge     boolean     NOT NULL DEFAULT false,
  languages            text[],
  category             text,
  model_provider       text,
  supported_models     text[],
  min_model_capability text,
  status               text        NOT NULL DEFAULT 'draft',
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Índices para filtrado en el marketplace
CREATE INDEX idx_agents_category   ON public.agents (category);
CREATE INDEX idx_agents_status     ON public.agents (status);
CREATE INDEX idx_agents_creator_id ON public.agents (creator_id);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Política: cualquier visitante puede leer agentes activos
CREATE POLICY "agents_select_active_public"
  ON public.agents FOR SELECT
  USING (status = 'active');

-- Política: el creador puede leer todos sus propios agentes (incluso borradores)
CREATE POLICY "agents_select_own_creator"
  ON public.agents FOR SELECT
  USING (auth.uid() = creator_id);

-- Política: solo el creador puede actualizar su agente
CREATE POLICY "agents_update_own"
  ON public.agents FOR UPDATE
  USING (auth.uid() = creator_id);

-- Política: solo el creador puede insertar un agente
CREATE POLICY "agents_insert_own"
  ON public.agents FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Política: solo el creador puede eliminar su agente
CREATE POLICY "agents_delete_own"
  ON public.agents FOR DELETE
  USING (auth.uid() = creator_id);


-- =================================================================
-- TABLA: subscriptions
-- Relación entre un usuario y el agente al que está suscrito.
-- Vinculada con Stripe para la gestión de pagos recurrentes.
-- =================================================================
CREATE TABLE public.subscriptions (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id               uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id     text,
  status                 text        NOT NULL,
  tier                   text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes por usuario y agente
CREATE INDEX idx_subscriptions_user_id  ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_agent_id ON public.subscriptions (agent_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede ver sus propias suscripciones
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: solo service_role puede insertar/actualizar (desde Stripe webhooks)
-- Los inserts/updates se hacen desde el servidor con service_role key,
-- por lo que no se necesita política adicional para usuarios normales.


-- =================================================================
-- TABLA: sessions
-- Registro de cada sesión de conversación con un agente de IA.
-- managed_agent_session_id referencia la sesión en la API de Anthropic.
-- =================================================================
CREATE TABLE public.sessions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id                 uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  managed_agent_session_id text,
  status                   text        NOT NULL DEFAULT 'active',
  token_usage              integer     NOT NULL DEFAULT 0,
  provider                 text,
  created_at               timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas de historial por usuario y agente
CREATE INDEX idx_sessions_user_id  ON public.sessions (user_id);
CREATE INDEX idx_sessions_agent_id ON public.sessions (agent_id);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo puede ver sus propias sesiones
CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Política: el usuario puede crear sus propias sesiones
CREATE POLICY "sessions_insert_own"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: el usuario puede actualizar sus propias sesiones (p.ej. cerrarlas)
CREATE POLICY "sessions_update_own"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);


-- =================================================================
-- TABLA: showcases
-- Casos de éxito y testimonios de profesionales que usan el marketplace.
-- Solo los showcases aprobados son visibles públicamente.
-- =================================================================
CREATE TABLE public.showcases (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  agent_id              uuid        REFERENCES public.agents(id) ON DELETE SET NULL,
  photo_url             text,
  practitioner_name     text        NOT NULL,
  specialty             text,
  location              text,
  social_links          jsonb       NOT NULL DEFAULT '{}',
  testimonial_text      text,
  testimonial_video_url text,
  metrics               jsonb       NOT NULL DEFAULT '{}',
  featured              boolean     NOT NULL DEFAULT false,
  approved              boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Índices para filtrado en la página pública de showcases
CREATE INDEX idx_showcases_approved ON public.showcases (approved);
CREATE INDEX idx_showcases_featured ON public.showcases (featured);

ALTER TABLE public.showcases ENABLE ROW LEVEL SECURITY;

-- Política: cualquier visitante puede ver showcases aprobados
CREATE POLICY "showcases_select_approved_public"
  ON public.showcases FOR SELECT
  USING (approved = true);

-- Política: el propietario puede ver su propio showcase (incluso pendiente)
CREATE POLICY "showcases_select_own"
  ON public.showcases FOR SELECT
  USING (auth.uid() = user_id);

-- Política: cualquier usuario autenticado puede enviar un showcase
CREATE POLICY "showcases_insert_authenticated"
  ON public.showcases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: solo service_role puede aprobar o destacar showcases
-- (la aprobación se gestiona desde el panel de admin con service_role key)


-- =================================================================
-- TABLA: courses
-- Cursos de educación continua (CE) para profesionales de salud.
-- Solo service_role puede crear o modificar cursos.
-- =================================================================
CREATE TABLE public.courses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name    text        NOT NULL,
  title            text        NOT NULL,
  specialty        text,
  location         text,
  dates            text,
  seats_total      integer,
  seats_remaining  integer,
  language         text        NOT NULL DEFAULT 'en',
  url              text,
  affiliate_link   text,
  price_usd        numeric,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Política: acceso de lectura público para todos
CREATE POLICY "courses_select_public"
  ON public.courses FOR SELECT
  USING (true);

-- Sin políticas de INSERT/UPDATE/DELETE para usuarios normales:
-- solo service_role (usado desde el servidor) puede escribir cursos.


-- =================================================================
-- TABLA: reviews
-- Reseñas de usuarios sobre agentes. Solo las verificadas son públicas.
-- =================================================================
CREATE TABLE public.reviews (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id   uuid        NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  rating     integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text       text,
  verified   boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para cargar reseñas de un agente eficientemente
CREATE INDEX idx_reviews_agent_id ON public.reviews (agent_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Política: cualquier visitante puede leer reseñas verificadas
CREATE POLICY "reviews_select_verified_public"
  ON public.reviews FOR SELECT
  USING (verified = true);

-- Política: el autor puede leer su propia reseña (incluso no verificada)
CREATE POLICY "reviews_select_own"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Política: un usuario autenticado puede insertar su propia reseña
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- =================================================================
-- TABLA: creator_applications
-- Solicitudes de personas que quieren publicar agentes en el marketplace.
-- Solo service_role puede leer las solicitudes (panel de admin).
-- =================================================================
CREATE TABLE public.creator_applications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  email          text        NOT NULL,
  background     text,
  agent_proposal text,
  status         text        NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- Política: cualquier usuario autenticado puede enviar una solicitud
CREATE POLICY "creator_applications_insert_authenticated"
  ON public.creator_applications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Sin política SELECT para usuarios normales:
-- solo service_role (admin) puede leer las solicitudes.
