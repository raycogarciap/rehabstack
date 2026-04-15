-- Migración v2: Arquitectura RehabStack v3.0
-- Añade columnas a tablas existentes y crea las nuevas tablas del sistema de agentes.
-- Ejecutar después de 001_initial_schema.sql

-- ============================================================
-- 1. ACTUALIZACIONES A TABLAS EXISTENTES
-- ============================================================

-- 1a. Tabla `users`: añadir columna `role`
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'creator', 'admin'));

-- 1b. Tabla `sessions`: migrar a esquema v3.0
-- Renombrar managed_agent_session_id → platform_session_id (si existe la columna antigua)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'managed_agent_session_id'
  ) THEN
    ALTER TABLE public.sessions
      RENAME COLUMN managed_agent_session_id TO platform_session_id;
  ELSE
    ALTER TABLE public.sessions
      ADD COLUMN IF NOT EXISTS platform_session_id TEXT;
  END IF;
END $$;

-- Añadir hosting_type a sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS hosting_type TEXT NOT NULL DEFAULT 'managed_anthropic'
    CHECK (hosting_type IN ('managed_anthropic', 'managed_openai', 'creator_hosted', 'self_hosted_package'));

-- Añadir token_usage_estimate si no existe (renombrar token_usage si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'token_usage'
  ) THEN
    ALTER TABLE public.sessions
      RENAME COLUMN token_usage TO token_usage_estimate;
  ELSE
    ALTER TABLE public.sessions
      ADD COLUMN IF NOT EXISTS token_usage_estimate INTEGER DEFAULT 0;
  END IF;
END $$;

-- 1c. Tabla `agents`: añadir columnas JSONB y hosting_type para arquitectura v3.0
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS hosting_type TEXT NOT NULL DEFAULT 'managed_anthropic'
    CHECK (hosting_type IN ('managed_anthropic', 'managed_openai', 'creator_hosted', 'self_hosted_package')),
  ADD COLUMN IF NOT EXISTS quick_actions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS connection_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS work_item_types JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS relevant_integrations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS staff_delegation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS platform_agent_id TEXT;  -- ID del agente en la plataforma (Anthropic, etc.)

-- ============================================================
-- 2. NUEVAS TABLAS
-- ============================================================

-- 2a. work_items: documentos y entregas producidos por los agentes
CREATE TABLE IF NOT EXISTS public.work_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id      UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  type          TEXT NOT NULL,               -- p.ej. 'Content Package', 'VA Brief', 'Curriculum Draft'
  title         TEXT NOT NULL,
  content       JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2b. notifications: notificaciones del sistema para usuarios
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id      UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  type          TEXT NOT NULL,               -- p.ej. 'work_item_ready', 'session_limit', 'new_review'
  message       TEXT NOT NULL,
  read          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2c. team_members: miembros del equipo delegados por un profesional
CREATE TABLE IF NOT EXISTS public.team_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  agent_id          UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('clinician', 'staff')),
  status            TEXT NOT NULL DEFAULT 'invited'
                      CHECK (status IN ('active', 'invited', 'disabled')),
  invite_email      TEXT,   -- email de invitación si member_user_id aún no está registrado
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_user_id, member_user_id, agent_id)
);

-- 2d. usage_counters: métricas de uso por usuario/agente/período
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id              UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  period                TEXT NOT NULL,   -- formato 'YYYY-MM' (mes) o 'YYYY-WW' (semana)
  message_count         INTEGER NOT NULL DEFAULT 0,
  content_generations   INTEGER NOT NULL DEFAULT 0,
  session_hours         NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, agent_id, period)
);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- work_items: el usuario ve/modifica los suyos; admins ven todo
CREATE POLICY "work_items: usuario ve los suyos"
  ON public.work_items FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "work_items: usuario crea los suyos"
  ON public.work_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "work_items: usuario actualiza los suyos"
  ON public.work_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "work_items: usuario elimina los suyos"
  ON public.work_items FOR DELETE
  USING (auth.uid() = user_id);

-- notifications: el usuario solo ve las suyas
CREATE POLICY "notifications: usuario ve las suyas"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: usuario actualiza las suyas (marcar leídas)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- team_members: el dueño gestiona; el miembro puede verse a sí mismo
CREATE POLICY "team_members: dueño ve y gestiona"
  ON public.team_members FOR ALL
  USING (auth.uid() = owner_user_id);

CREATE POLICY "team_members: miembro se ve a sí mismo"
  ON public.team_members FOR SELECT
  USING (auth.uid() = member_user_id);

-- usage_counters: el usuario ve los suyos; admins ven todo
CREATE POLICY "usage_counters: usuario ve los suyos"
  ON public.usage_counters FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 4. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_work_items_user_id    ON public.work_items(user_id);
CREATE INDEX IF NOT EXISTS idx_work_items_agent_id   ON public.work_items(agent_id);
CREATE INDEX IF NOT EXISTS idx_work_items_status     ON public.work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_items_type       ON public.work_items(type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON public.notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_team_members_owner    ON public.team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_agent    ON public.team_members(agent_id);

CREATE INDEX IF NOT EXISTS idx_usage_counters_user   ON public.usage_counters(user_id, period);
CREATE INDEX IF NOT EXISTS idx_usage_counters_agent  ON public.usage_counters(agent_id, period);

CREATE INDEX IF NOT EXISTS idx_sessions_hosting_type ON public.sessions(hosting_type);
CREATE INDEX IF NOT EXISTS idx_agents_hosting_type   ON public.agents(hosting_type);
