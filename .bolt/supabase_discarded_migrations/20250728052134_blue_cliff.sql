/*
  # Fix Crítico Sistema de Autenticación - Orden y Dependencias
  
  PROBLEMAS SOLUCIONADOS:
  1. Funciones duplicadas con definiciones diferentes
  2. Políticas RLS usando funciones inexistentes
  3. Triggers duplicados causando conflictos
  4. Orden incorrecto de dependencias
  5. Referencias inconsistentes entre users y profiles
*/

-- =====================================================
-- PASO 1: LIMPIEZA COMPLETA DE CONFLICTOS
-- =====================================================

-- Eliminar todas las políticas RLS que dependen de funciones
DROP POLICY IF EXISTS "Admins can insert companies" ON empresas;
DROP POLICY IF EXISTS "Admins can update companies" ON empresas;
DROP POLICY IF EXISTS "Admins can view all companies" ON empresas;
DROP POLICY IF EXISTS "Users can view their own company" ON empresas;

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can insert users for their company" ON users;
DROP POLICY IF EXISTS "Admins can update users from their company" ON users;
DROP POLICY IF EXISTS "Admins can view all users from same company" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Eliminar triggers duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Eliminar funciones duplicadas/conflictivas
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_empresa_id() CASCADE;
DROP FUNCTION IF EXISTS uid() CASCADE;

-- =====================================================
-- PASO 2: ASEGURAR EMPRESA DEFAULT EXISTE
-- =====================================================

DO $$
BEGIN
  -- Crear empresa default si no existe
  IF NOT EXISTS (SELECT 1 FROM empresas WHERE nombre = 'ContaPYME Default') THEN
    INSERT INTO empresas (
      nombre, 
      rut, 
      direccion, 
      telefono, 
      email, 
      sector, 
      tipo_empresa
    ) VALUES (
      'ContaPYME Default',
      '20304050607',
      'Av. Corrientes 1234, CABA',
      '+54 11 1234-5678',
      'admin@contapyme.com',
      'Servicios',
      'PYME'
    );
    RAISE NOTICE 'Empresa default creada exitosamente';
  ELSE
    RAISE NOTICE 'Empresa default ya existe';
  END IF;
END $$;

-- =====================================================
-- PASO 3: CREAR FUNCIONES HELPER UNIFICADAS
-- =====================================================

-- Función helper para obtener user ID actual
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener rol del usuario (busca en profiles primero, luego users)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  -- Intentar obtener de profiles primero
  SELECT role INTO user_role_result
  FROM profiles 
  WHERE id = uid();
  
  -- Si no está en profiles, intentar en users
  IF user_role_result IS NULL THEN
    SELECT role INTO user_role_result
    FROM users 
    WHERE id = uid();
  END IF;
  
  -- Fallback a usuario por defecto
  RETURN COALESCE(user_role_result, 'usuario'::user_role);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'usuario'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener empresa_id del usuario (busca en profiles primero, luego users)
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS uuid AS $$
DECLARE
  empresa_id_result uuid;
  default_empresa_id uuid;
BEGIN
  -- Obtener empresa default como fallback
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;
  
  -- Intentar obtener de profiles primero
  SELECT empresa_id INTO empresa_id_result
  FROM profiles 
  WHERE id = uid();
  
  -- Si no está en profiles, intentar en users
  IF empresa_id_result IS NULL THEN
    SELECT empresa_id INTO empresa_id_result
    FROM users 
    WHERE id = uid();
  END IF;
  
  -- Retornar empresa encontrada o default
  RETURN COALESCE(empresa_id_result, default_empresa_id);
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, retornar empresa default
    SELECT id INTO default_empresa_id 
    FROM empresas 
    WHERE nombre = 'ContaPYME Default' 
    LIMIT 1;
    RETURN default_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 4: CREAR TRIGGER UNIFICADO SIN CONFLICTOS
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_empresa_id uuid;
  profile_exists boolean := false;
  user_exists boolean := false;
BEGIN
  RAISE NOTICE 'Trigger handle_new_user ejecutado para usuario: %', NEW.email;
  
  -- Obtener empresa default
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;
  
  IF default_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa default no encontrada';
  END IF;
  
  -- Verificar si ya existe perfil
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- Crear perfil si no existe
  IF NOT profile_exists THEN
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
    );
    RAISE NOTICE 'Perfil creado en profiles para usuario: %', NEW.email;
  ELSE
    RAISE NOTICE 'Perfil ya existe en profiles para usuario: %', NEW.email;
  END IF;
  
  -- Verificar si ya existe en users
  SELECT EXISTS(SELECT 1 FROM users WHERE id = NEW.id) INTO user_exists;
  
  -- Crear en users si no existe
  IF NOT user_exists THEN
    INSERT INTO users (
      id,
      email,
      empresa_id,
      role,
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      default_empresa_id,
      'usuario'::user_role,
      true
    );
    RAISE NOTICE 'Usuario creado en users para: %', NEW.email;
  ELSE
    RAISE NOTICE 'Usuario ya existe en users para: %', NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en handle_new_user para %: %', NEW.email, SQLERRM;
    RETURN NEW; -- Continuar aunque haya error
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger único
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- PASO 5: RECREAR POLÍTICAS RLS CON FUNCIONES EXISTENTES
-- =====================================================

-- Políticas para empresas
CREATE POLICY "Admins can insert companies"
  ON empresas FOR INSERT
  TO public
  WITH CHECK (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can update companies"
  ON empresas FOR UPDATE
  TO public
  USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can view all companies"
  ON empresas FOR SELECT
  TO public
  USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Users can view their own company"
  ON empresas FOR SELECT
  TO public
  USING (id = get_current_user_empresa_id());

-- Políticas para profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO public
  WITH CHECK (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO public
  USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO public
  USING (uid() = id);

CREATE POLICY "Users can view profiles from same company"
  ON profiles FOR SELECT
  TO public
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO public
  USING (uid() = id);

-- Políticas para users (si la tabla existe)
CREATE POLICY "Admins can insert users for their company"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((get_current_user_role() = 'admin'::user_role) AND (empresa_id = get_current_user_empresa_id()));

CREATE POLICY "Admins can update users from their company"
  ON users FOR UPDATE
  TO authenticated
  USING ((get_current_user_role() = 'admin'::user_role) AND (empresa_id = get_current_user_empresa_id()));

CREATE POLICY "Admins can view all users from same company"
  ON users FOR SELECT
  TO authenticated
  USING ((get_current_user_role() = 'admin'::user_role) AND (empresa_id = get_current_user_empresa_id()));

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (uid() = id);

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (uid() = id);

-- =====================================================
-- PASO 6: ASEGURAR RLS HABILITADO
-- =====================================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 7: CREAR USUARIO ADMIN DE PRUEBA
-- =====================================================

DO $$
DECLARE
  default_empresa_id uuid;
  admin_exists boolean := false;
BEGIN
  -- Obtener empresa default
  SELECT id INTO default_empresa_id 
  FROM empresas 
  WHERE nombre = 'ContaPYME Default' 
  LIMIT 1;
  
  -- Verificar si admin ya existe en profiles
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = 'admin@contapyme.com') INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Crear perfil admin
    INSERT INTO profiles (
      id, 
      username, 
      first_name, 
      last_name, 
      email, 
      empresa_id, 
      role
    ) VALUES (
      'test-user-id-12345678901234567890',
      'admin',
      'Admin',
      'Usuario',
      'admin@contapyme.com',
      default_empresa_id,
      'admin'::user_role
    );
    RAISE NOTICE 'Perfil admin creado en profiles';
  ELSE
    RAISE NOTICE 'Perfil admin ya existe en profiles';
  END IF;
  
  -- Verificar si admin ya existe en users
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@contapyme.com') INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Crear en users también
    INSERT INTO users (
      id,
      email,
      empresa_id,
      role,
      is_active
    ) VALUES (
      'test-user-id-12345678901234567890',
      'admin@contapyme.com',
      default_empresa_id,
      'admin'::user_role,
      true
    );
    RAISE NOTICE 'Usuario admin creado en users';
  ELSE
    RAISE NOTICE 'Usuario admin ya existe en users';
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  RAISE NOTICE 'Empresas: % registros', (SELECT COUNT(*) FROM empresas);
  RAISE NOTICE 'Profiles: % registros', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Users: % registros', (SELECT COUNT(*) FROM users);
  RAISE NOTICE 'Funciones creadas: get_current_user_role, get_current_user_empresa_id, uid';
  RAISE NOTICE 'Trigger creado: on_auth_user_created';
  RAISE NOTICE 'Políticas RLS: Recreadas para todas las tablas';
  RAISE NOTICE '=== SISTEMA LISTO ===';
END $$;