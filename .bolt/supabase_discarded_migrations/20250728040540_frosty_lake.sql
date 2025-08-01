/*
  # Fix Sistema de Autenticación Completo
  
  Soluciona problemas críticos:
  1. Elimina tabla users duplicada
  2. Corrige funciones RLS
  3. Simplifica trigger de registro
  4. Asegura empresa default
*/

-- 1. Eliminar tabla users duplicada que causa conflictos
DROP TABLE IF EXISTS users CASCADE;

-- 2. Asegurar que empresa default existe
INSERT INTO empresas (nombre, email, sector, tipo_empresa)
SELECT 'ContaPYME Default', 'admin@contapyme.com', 'Servicios', 'PYME'
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE nombre = 'ContaPYME Default');

-- 3. Corregir función get_current_user_role (busca en profiles)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN COALESCE((
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  ), 'usuario'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Corregir función get_current_user_empresa_id
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      empresa_id, 
      (SELECT id FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1)
    )
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Simplificar trigger de nuevo usuario (solo crear en profiles)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_empresa_id uuid;
BEGIN
  -- Obtener empresa default
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;

  -- Crear solo perfil en profiles (NO en users)
  INSERT INTO profiles (
    id,
    username,
    first_name,
    last_name,
    email,
    empresa_id,
    role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    default_empresa_id,
    'usuario'::user_role
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recrear trigger limpio
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Políticas RLS más permisivas para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view profiles from same company"
  ON profiles FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- 8. Crear usuario admin de prueba si no existe
DO $$
DECLARE
  default_empresa_id uuid;
BEGIN
  SELECT id INTO default_empresa_id FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Crear perfil admin si no existe
  INSERT INTO profiles (
    id, 
    username, 
    first_name, 
    last_name, 
    email, 
    empresa_id, 
    role
  )
  SELECT 
    gen_random_uuid(),
    'admin',
    'Admin',
    'User',
    'admin@contapyme.com',
    default_empresa_id,
    'admin'::user_role
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'admin@contapyme.com'
  );
END $$;

-- 9. Asegurar RLS habilitado en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;