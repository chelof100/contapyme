/*
  # Arreglar Sistema de Autenticación

  1. Crear empresa por defecto con UUID válido
  2. Arreglar funciones de usuario
  3. Simplificar políticas RLS
  4. Crear perfiles automáticamente
  5. Datos de prueba
*/

-- Crear empresa por defecto con UUID válido
INSERT INTO empresas (id, nombre, rut, direccion, telefono, email, sector, tipo_empresa)
VALUES (
  gen_random_uuid(),
  'ContaPYME Default',
  '20000000001',
  'Dirección por defecto',
  '+54 11 0000-0000',
  'admin@contapyme.com',
  'Tecnología',
  'SRL'
) ON CONFLICT (nombre) DO UPDATE SET
  updated_at = now();

-- Obtener el ID de la empresa por defecto para usar en funciones
DO $$
DECLARE
  default_empresa_uuid uuid;
BEGIN
  SELECT id INTO default_empresa_uuid FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Guardar en una tabla temporal para las funciones
  CREATE TEMP TABLE IF NOT EXISTS temp_default_empresa (id uuid);
  DELETE FROM temp_default_empresa;
  INSERT INTO temp_default_empresa VALUES (default_empresa_uuid);
END $$;

-- Función para obtener rol del usuario actual (simplificada)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
  default_empresa_uuid uuid;
BEGIN
  -- Obtener empresa por defecto
  SELECT id INTO default_empresa_uuid FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Si no hay usuario autenticado, retornar rol por defecto
  IF auth.uid() IS NULL THEN
    RETURN 'usuario'::user_role;
  END IF;

  -- Intentar obtener el rol del perfil
  SELECT role INTO user_role_result
  FROM profiles
  WHERE id = auth.uid();

  -- Si no se encuentra el perfil, retornar rol por defecto
  IF user_role_result IS NULL THEN
    RETURN 'usuario'::user_role;
  END IF;

  RETURN user_role_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'usuario'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener empresa del usuario actual (simplificada)
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS uuid AS $$
DECLARE
  empresa_id_result uuid;
  default_empresa_uuid uuid;
BEGIN
  -- Obtener empresa por defecto
  SELECT id INTO default_empresa_uuid FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Si no hay usuario autenticado, retornar empresa por defecto
  IF auth.uid() IS NULL THEN
    RETURN default_empresa_uuid;
  END IF;

  -- Intentar obtener la empresa del perfil
  SELECT empresa_id INTO empresa_id_result
  FROM profiles
  WHERE id = auth.uid();

  -- Si no se encuentra el perfil o no tiene empresa, retornar empresa por defecto
  IF empresa_id_result IS NULL THEN
    RETURN default_empresa_uuid;
  END IF;

  RETURN empresa_id_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN default_empresa_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar nuevos usuarios (mejorada)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_empresa_uuid uuid;
BEGIN
  -- Obtener empresa por defecto
  SELECT id INTO default_empresa_uuid FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Crear perfil automáticamente para el nuevo usuario
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
    default_empresa_uuid,
    'usuario'::user_role
  ) ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no fallar la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Políticas RLS simplificadas para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Políticas más permisivas
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'contador')
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política simplificada para empresas
DROP POLICY IF EXISTS "Users can view their own company" ON empresas;
DROP POLICY IF EXISTS "Admins can view all companies" ON empresas;
DROP POLICY IF EXISTS "Admins can update companies" ON empresas;
DROP POLICY IF EXISTS "Admins can insert companies" ON empresas;

CREATE POLICY "Users can view their own company" ON empresas
  FOR SELECT USING (
    id = get_current_user_empresa_id() OR
    nombre = 'ContaPYME Default'
  );

CREATE POLICY "Admins can view all companies" ON empresas
  FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update companies" ON empresas
  FOR UPDATE USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert companies" ON empresas
  FOR INSERT WITH CHECK (get_current_user_role() = 'admin');

-- Asegurar que todos los usuarios existentes tengan perfil
DO $$
DECLARE
  user_record RECORD;
  default_empresa_uuid uuid;
BEGIN
  -- Obtener empresa por defecto
  SELECT id INTO default_empresa_uuid FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM profiles)
  LOOP
    INSERT INTO profiles (
      id,
      username,
      first_name,
      last_name,
      email,
      empresa_id,
      role
    ) VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'username', split_part(user_record.email, '@', 1)),
      COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
      COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
      user_record.email,
      default_empresa_uuid,
      'usuario'::user_role
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Crear usuario de prueba si no existe
DO $$
DECLARE
  default_empresa_uuid uuid;
  test_user_id uuid := 'test-user-id-12345678901234567890'::uuid;
BEGIN
  -- Obtener empresa por defecto
  SELECT id INTO default_empresa_uuid FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1;
  
  -- Crear perfil de prueba
  INSERT INTO profiles (
    id,
    username,
    first_name,
    last_name,
    email,
    empresa_id,
    role
  ) VALUES (
    test_user_id,
    'admin',
    'Admin',
    'Usuario',
    'admin@contapyme.com',
    default_empresa_uuid,
    'admin'::user_role
  ) ON CONFLICT (id) DO UPDATE SET
    email = 'admin@contapyme.com',
    role = 'admin'::user_role,
    empresa_id = default_empresa_uuid,
    updated_at = now();
END $$;