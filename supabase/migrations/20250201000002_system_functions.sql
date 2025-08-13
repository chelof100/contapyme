-- =====================================================
-- FUNCIONES DEL SISTEMA PARA MANEJO DE EMPRESA_ID
-- =====================================================

-- Función para obtener el ID de la empresa activa
CREATE OR REPLACE FUNCTION get_active_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM empresa 
    WHERE activa = true 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$$
-- Función para actualizar empresa_id de todos los usuarios
CREATE OR REPLACE FUNCTION update_global_empresa_id(new_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar profiles
  UPDATE profiles 
  SET empresa_id = new_empresa_id, updated_at = now()
  WHERE empresa_id IS NOT NULL;
  
  -- Actualizar usuarios
  UPDATE usuarios 
  SET empresa_id = new_empresa_id, updated_at = now()
  WHERE empresa_id IS NOT NULL;
  
  -- Log de la actualización
  INSERT INTO user_actions (user_id, action, details, created_at)
  VALUES (
    auth.uid(),
    'update_global_empresa_id',
    jsonb_build_object('new_empresa_id', new_empresa_id, 'affected_users', (SELECT COUNT(*) FROM profiles WHERE empresa_id = new_empresa_id)),
    now()
  );
END;
$$
-- Función para asignar empresa_id a usuario nuevo
CREATE OR REPLACE FUNCTION assign_empresa_to_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_empresa_id uuid;
BEGIN
  -- Obtener empresa activa
  active_empresa_id := get_active_empresa_id();
  
  IF active_empresa_id IS NULL THEN
    RAISE EXCEPTION 'No hay empresa activa en el sistema';
  END IF;
  
  -- Asignar empresa_id al usuario en profiles
  UPDATE profiles 
  SET empresa_id = active_empresa_id, updated_at = now()
  WHERE id = user_id;
  
  -- Asignar empresa_id al usuario en usuarios
  UPDATE usuarios 
  SET empresa_id = active_empresa_id, updated_at = now()
  WHERE id = user_id;
  
  -- Log de la asignación
  INSERT INTO user_actions (user_id, action, details, created_at)
  VALUES (
    user_id,
    'assign_empresa_to_user',
    jsonb_build_object('empresa_id', active_empresa_id),
    now()
  );
END;
$$
-- Función para verificar si usuario es developer
CREATE OR REPLACE FUNCTION is_developer(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role = 'developer'::user_role
    FROM profiles 
    WHERE id = user_id
  );
END;
$$
-- Función para verificar si usuario es admin o developer
CREATE OR REPLACE FUNCTION is_admin_or_developer(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'developer')::boolean
    FROM profiles 
    WHERE id = user_id
  );
END;
$$
-- =====================================================
-- MODIFICACIÓN DE handle_new_user
-- =====================================================

-- Primero eliminar el trigger que depende de la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users
-- Luego eliminar función anterior
DROP FUNCTION IF EXISTS handle_new_user()
-- Nueva función handle_new_user mejorada
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_empresa_id uuid;
  default_role user_role := 'usuario';
BEGIN
  -- Obtener empresa activa
  active_empresa_id := get_active_empresa_id();
  
  -- Insertar en profiles con empresa_id y role
  INSERT INTO profiles (
    id, 
    email, 
    username, 
    empresa_id, 
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    active_empresa_id,
    default_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    empresa_id = COALESCE(profiles.empresa_id, EXCLUDED.empresa_id),
    updated_at = now();
  
  -- Insertar en usuarios con empresa_id
  INSERT INTO usuarios (
    id,
    email,
    empresa_id,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    active_empresa_id,
    default_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    empresa_id = COALESCE(usuarios.empresa_id, EXCLUDED.empresa_id),
    updated_at = now();
  
  -- Log de creación de usuario
  INSERT INTO user_actions (user_id, action, details, created_at)
  VALUES (
    NEW.id,
    'user_created',
    jsonb_build_object('email', NEW.email, 'empresa_id', active_empresa_id, 'role', default_role),
    now()
  );
  
  RETURN NEW;
END;
$$
-- =====================================================
-- POLÍTICAS RLS SIMPLIFICADAS
-- =====================================================

-- Habilitar RLS en tablas principales
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY
-- Política para profiles: Developer ve todo, usuarios ven solo su empresa
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL USING (
    is_developer() OR 
    empresa_id = get_current_user_empresa_id()
  )
-- Política para usuarios: Developer ve todo, usuarios ven solo su empresa
CREATE POLICY "usuarios_policy" ON usuarios
  FOR ALL USING (
    is_developer() OR 
    empresa_id = get_current_user_empresa_id()
  )
-- Política para empresa: Solo developer puede modificar
CREATE POLICY "empresa_policy" ON empresa
  FOR ALL USING (is_developer())
-- =====================================================
-- PERMISOS Y GRANTS
-- =====================================================

-- Otorgar permisos a las funciones
GRANT EXECUTE ON FUNCTION get_active_empresa_id() TO authenticated
GRANT EXECUTE ON FUNCTION update_global_empresa_id(uuid) TO authenticated
GRANT EXECUTE ON FUNCTION assign_empresa_to_user(uuid) TO authenticated
GRANT EXECUTE ON FUNCTION is_developer(uuid) TO authenticated
GRANT EXECUTE ON FUNCTION is_admin_or_developer(uuid) TO authenticated
-- Otorgar permisos a las tablas
GRANT ALL ON profiles TO authenticated
GRANT ALL ON usuarios TO authenticated
GRANT ALL ON empresa TO authenticated
GRANT ALL ON user_actions TO authenticated
-- =====================================================
-- TRIGGERS
-- =====================================================

-- Crear trigger para handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user()
-- Trigger para actualizar updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
CREATE OR REPLACE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
CREATE OR REPLACE TRIGGER update_empresa_updated_at
  BEFORE UPDATE ON empresa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()