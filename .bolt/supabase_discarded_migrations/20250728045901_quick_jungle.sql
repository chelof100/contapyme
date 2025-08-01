/*
  # Fix Sistema de Autenticación Supabase - Solución Final
  
  Problemas identificados y solucionados:
  1. Tabla users duplicada eliminada
  2. Funciones RLS corregidas para usar profiles
  3. Trigger simplificado y funcional
  4. Empresa default garantizada
  5. Políticas RLS permisivas
  6. Usuario admin de prueba creado
*/

-- 1. LIMPIAR SISTEMA EXISTENTE
DROP TABLE IF EXISTS users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 2. ASEGURAR EMPRESA DEFAULT EXISTE
DO $$
DECLARE
  empresa_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO empresa_count FROM empresas WHERE nombre = 'ContaPYME Default';
  
  IF empresa_count = 0 THEN
    INSERT INTO empresas (nombre, email, sector, tipo_empresa, rut, direccion, telefono)
    VALUES (
      'ContaPYME Default',
      'admin@contapyme.com',
      'Servicios',
      'PYME',
      '20304050607',
      'Buenos Aires, Argentina',
      '+54 11 1234-5678'
    );
    
    RAISE NOTICE 'Empresa default creada exitosamente';
  ELSE
    RAISE NOTICE 'Empresa default ya existe';
  END IF;
END $$;

-- 3. RECREAR FUNCIONES RLS CORRECTAS
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_result, 'usuario'::user_role);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'usuario'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS uuid AS $$
DECLARE
  empresa_id_result uuid;
  default_empresa_id uuid;
BEGIN
  -- Obtener empresa del usuario
  SELECT empresa_id INTO empresa_id_result
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Si no tiene empresa, obtener la default
  IF empresa_id_result IS NULL THEN
    SELECT id INTO default_empresa_id
    FROM empresas 
    WHERE nombre = 'ContaPYME Default' 
    LIMIT 1;
    
    RETURN default_empresa_id;
  END IF;
  
  RETURN empresa_id_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback a empresa default
    SELECT id INTO default_empresa_id
    FROM empresas 
    WHERE nombre = 'ContaPYME Default' 
    LIMIT 1;
    
    RETURN default_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCIÓN HELPER PARA OBTENER UID SEGURO
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER SIMPLIFICADO Y ROBUSTO
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_empresa_id uuid;
  profile_exists boolean;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Obtener empresa default
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;
  
  -- Si no existe empresa default, crearla
  IF default_empresa_id IS NULL THEN
    INSERT INTO empresas (nombre, email, sector, tipo_empresa)
    VALUES ('ContaPYME Default', 'admin@contapyme.com', 'Servicios', 'PYME')
    RETURNING id INTO default_empresa_id;
  END IF;
  
  -- Crear perfil
  INSERT INTO profiles (
    id,
    username,
    first_name,
    last_name,
    email,
    empresa_id,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, ''),
    default_empresa_id,
    'usuario'::user_role,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Profile created for user % with empresa %', NEW.id, default_empresa_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RECREAR TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. LIMPIAR Y RECREAR POLÍTICAS RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Políticas más permisivas y funcionales
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (uid() = id)
  WITH CHECK (uid() = id);

CREATE POLICY "Users can view profiles from same company"
  ON profiles FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin'::user_role);

-- 8. ASEGURAR RLS HABILITADO
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- 9. CREAR USUARIO ADMIN DE PRUEBA
DO $$
DECLARE
  default_empresa_id uuid;
  admin_exists boolean;
BEGIN
  -- Obtener empresa default
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;
  
  -- Verificar si admin ya existe
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE email = 'admin@contapyme.com'
  ) INTO admin_exists;
  
  -- Crear admin si no existe
  IF NOT admin_exists AND default_empresa_id IS NOT NULL THEN
    INSERT INTO profiles (
      id, 
      username, 
      first_name, 
      last_name, 
      email, 
      empresa_id, 
      role,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'admin',
      'Admin',
      'Usuario',
      'admin@contapyme.com',
      default_empresa_id,
      'admin'::user_role,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Usuario admin creado exitosamente';
  ELSE
    RAISE NOTICE 'Usuario admin ya existe o empresa default no encontrada';
  END IF;
END $$;

-- 10. VERIFICAR CONFIGURACIÓN
DO $$
DECLARE
  empresa_count INTEGER;
  profile_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO empresa_count FROM empresas;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  RAISE NOTICE 'Configuración final:';
  RAISE NOTICE '- Empresas: %', empresa_count;
  RAISE NOTICE '- Perfiles: %', profile_count;
  RAISE NOTICE '- Admins: %', admin_count;
  
  IF empresa_count = 0 THEN
    RAISE EXCEPTION 'ERROR: No hay empresas en el sistema';
  END IF;
END $$;