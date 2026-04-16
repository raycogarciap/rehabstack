-- Migración 004: Trigger para crear perfil en public.users al registrarse
-- Garantiza que cada usuario de Supabase Auth tenga automáticamente
-- una fila correspondiente en public.users.
-- Ejecutar después de 003_stripe_columns.sql

-- ============================================================
-- 1. FUNCIÓN handle_new_user()
-- ============================================================

-- Inserta una fila en public.users usando los datos del nuevo auth.users.
-- Se ejecuta con SECURITY DEFINER para tener acceso a auth.users desde
-- el contexto de una función de trigger (que normalmente corre como el usuario invoker).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Fija el search_path para evitar ataques de sustitución de esquema
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    language,
    role,
    subscription_tier
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- El nombre puede venir del proveedor OAuth o del formulario de registro
    NEW.raw_user_meta_data->>'name',
    'en',
    'user',
    'free'
  )
  -- Si por algún motivo ya existe la fila (ej: race condition), no fallar
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. TRIGGER en auth.users
-- ============================================================

-- Elimina el trigger si ya existía para que esta migración sea idempotente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Se dispara AFTER INSERT para que NEW.id y NEW.email ya estén disponibles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. BACKFILL — usuarios registrados antes del trigger
-- ============================================================

-- Inserta en public.users todos los auth.users que aún no tienen perfil.
-- ON CONFLICT DO NOTHING protege contra duplicados.
INSERT INTO public.users (
  id,
  email,
  name,
  language,
  role,
  subscription_tier
)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'name',
  'en',
  'user',
  'free'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users pu
  WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;
