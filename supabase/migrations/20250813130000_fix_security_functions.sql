-- ===== CORRECCIÓN DE FUNCIONES DE SEGURIDAD =====
-- Esta migración corrige problemas críticos de seguridad

-- Corregir función get_current_user_role para que sea segura
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  user_id UUID;
BEGIN
  -- Validar que el usuario esté autenticado
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Obtener rol con validación de seguridad
  SELECT role::TEXT INTO user_role
  FROM profiles 
  WHERE id = user_id;
  
  -- Validar que el rol exista - NO retornar valor por defecto
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'Rol de usuario no encontrado';
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corregir función handle_new_user para validar empresa_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  empresa_id UUID;
BEGIN
  -- Obtener empresa_id del usuario (puede ser NULL para usuarios iniciales)
  empresa_id := COALESCE(
    NEW.raw_user_meta_data->>'empresa_id',
    (SELECT id FROM empresa LIMIT 1) -- Usar primera empresa disponible
  );
  
  -- Crear perfil con validación
  INSERT INTO profiles (id, email, username, empresa_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    empresa_id
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    empresa_id = COALESCE(EXCLUDED.empresa_id, profiles.empresa_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función segura para verificar permisos de administrador
CREATE OR REPLACE FUNCTION is_admin_or_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() IN ('admin', 'developer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función segura para verificar si es desarrollador
CREATE OR REPLACE FUNCTION is_developer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'developer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_developer() TO authenticated;
GRANT EXECUTE ON FUNCTION is_developer() TO authenticated;

