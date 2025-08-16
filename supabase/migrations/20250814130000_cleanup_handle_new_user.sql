-- ========================================
-- LIMPIEZA TOTAL Y RECREACIÓN DESDE CERO
-- ========================================

-- 1. ELIMINAR TODO LO VIEJO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. VERIFICAR/CREAR EMPRESA POR DEFECTO
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM empresa WHERE activa = true) THEN
    INSERT INTO empresa (nombre, email, activa)
    VALUES ('OnePYME System', 'admin@onepyme.com', true);
  END IF;
END $$;

-- 3. CREAR FUNCIÓN DEFINITIVA Y CORRECTA
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_empresa_id UUID;
  default_role TEXT;
BEGIN
  -- Obtener empresa por defecto
  SELECT id INTO default_empresa_id
  FROM empresa
  WHERE activa = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si no hay empresa, crear una
  IF default_empresa_id IS NULL THEN
    INSERT INTO empresa (nombre, email, activa)
    VALUES ('OnePYME Default', 'system@onepyme.com', true)
    RETURNING id INTO default_empresa_id;
  END IF;
  
  -- Obtener rol del metadata o usar 'usuario' por defecto
  default_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'usuario'
  );
  
  -- Insertar perfil del usuario
  INSERT INTO profiles (
    id,
    email,
    username,
    empresa_id,
    role,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    default_empresa_id,
    default_role::user_role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    empresa_id = COALESCE(profiles.empresa_id, EXCLUDED.empresa_id),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Loggear error pero no fallar la creación del usuario
    RAISE WARNING 'Error en handle_new_user para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. CREAR TRIGGER DEFINITIVO
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. ASEGURAR POLÍTICAS RLS PARA INSERCIÓN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. GRANTS NECESARIOS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated;

-- 7. VERIFICACIÓN FINAL
SELECT 
  'Empresa activa' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK' 
    ELSE '❌ FALTA' 
  END as status,
  COUNT(*) as count
FROM empresa WHERE activa = true

UNION ALL

SELECT 
  'Función handle_new_user' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK' 
    ELSE '❌ FALTA' 
  END as status,
  COUNT(*) as count
FROM pg_proc WHERE proname = 'handle_new_user'

UNION ALL

SELECT 
  'Trigger on_auth_user_created' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK' 
    ELSE '❌ FALTA' 
  END as status,
  COUNT(*) as count
FROM pg_trigger WHERE tgname = 'on_auth_user_created';

