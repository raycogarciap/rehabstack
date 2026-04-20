-- Tabla de leads capturados por el asistente IA del sitio web.
-- Solo el service_role puede leer/insertar (RLS estricto).

CREATE TABLE IF NOT EXISTS public.leads (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 text          NOT NULL,
  locale                text          NOT NULL DEFAULT 'en',
  source                text          NOT NULL DEFAULT 'ai_assistant',
  conversation_summary  text,
  created_at            timestamptz   NOT NULL DEFAULT now()
);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Solo el service_role puede operar sobre leads (no acceso anónimo ni de usuario)
-- Las políticas permiten al service_role (usado en server-side) insertar y leer.
-- No se crean políticas permisivas para roles anon/authenticated — se deniega por defecto.
