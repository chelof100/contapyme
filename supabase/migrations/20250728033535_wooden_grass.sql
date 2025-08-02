/*
  # Sistema de Gestión de Configuraciones

  1. Nuevas Tablas
    - `endpoint_configurations_history` - Historial de cambios de endpoints
    - `configuration_backups` - Backups automáticos de configuraciones
    - `configuration_tests` - Resultados de tests de conectividad

  2. Funciones
    - Backup automático antes de cambios
    - Rollback a configuración anterior
    - Test de conectividad automático
    - Limpieza de historial antiguo

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas por empresa
    - Auditoría completa de cambios
*/

-- Tabla para historial de configuraciones de endpoints
CREATE TABLE IF NOT EXISTS endpoint_configurations_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  configuration_type text NOT NULL, -- 'n8n', 'afip', 'webhook_endpoints'
  configuration_name text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  is_rollback boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabla para backups de configuraciones
CREATE TABLE IF NOT EXISTS configuration_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  backup_name text NOT NULL,
  backup_type text NOT NULL, -- 'manual', 'automatic', 'pre_change'
  configuration_data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabla para resultados de tests de conectividad
CREATE TABLE IF NOT EXISTS configuration_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  test_type text NOT NULL, -- 'n8n_health', 'afip_connection', 'webhook_endpoint'
  endpoint_url text NOT NULL,
  test_status text NOT NULL, -- 'success', 'failure', 'timeout'
  response_time_ms integer,
  status_code integer,
  response_data jsonb,
  error_message text,
  tested_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE endpoint_configurations_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_tests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para endpoint_configurations_history
CREATE POLICY "Users can view config history for their company" ON endpoint_configurations_history
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert config history for their company" ON endpoint_configurations_history
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para configuration_backups
CREATE POLICY "Users can view backups for their company" ON configuration_backups
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert backups for their company" ON configuration_backups
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update backups for their company" ON configuration_backups
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para configuration_tests
CREATE POLICY "Users can view tests for their company" ON configuration_tests
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert tests for their company" ON configuration_tests
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Función para crear backup automático antes de cambios
CREATE OR REPLACE FUNCTION create_configuration_backup(
  p_empresa_id uuid,
  p_backup_name text,
  p_backup_type text,
  p_configuration_data jsonb,
  p_created_by uuid,
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  backup_id uuid;
BEGIN
  -- Desactivar backups anteriores del mismo tipo si es automático
  IF p_backup_type = 'automatic' THEN
    UPDATE configuration_backups 
    SET is_active = false 
    WHERE empresa_id = p_empresa_id 
      AND backup_type = 'automatic';
  END IF;

  -- Crear nuevo backup
  INSERT INTO configuration_backups (
    empresa_id,
    backup_name,
    backup_type,
    configuration_data,
    created_by,
    description,
    is_active
  ) VALUES (
    p_empresa_id,
    p_backup_name,
    p_backup_type,
    p_configuration_data,
    p_created_by,
    p_description,
    true
  ) RETURNING id INTO backup_id;

  RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar cambio de configuración
CREATE OR REPLACE FUNCTION log_configuration_change(
  p_empresa_id uuid,
  p_configuration_type text,
  p_configuration_name text,
  p_old_value jsonb,
  p_new_value jsonb,
  p_changed_by uuid,
  p_change_reason text DEFAULT NULL,
  p_is_rollback boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  change_id uuid;
BEGIN
  INSERT INTO endpoint_configurations_history (
    empresa_id,
    configuration_type,
    configuration_name,
    old_value,
    new_value,
    changed_by,
    change_reason,
    is_rollback
  ) VALUES (
    p_empresa_id,
    p_configuration_type,
    p_configuration_name,
    p_old_value,
    p_new_value,
    p_changed_by,
    p_change_reason,
    p_is_rollback
  ) RETURNING id INTO change_id;

  RETURN change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar test de conectividad
CREATE OR REPLACE FUNCTION log_connectivity_test(
  p_empresa_id uuid,
  p_test_type text,
  p_endpoint_url text,
  p_test_status text,
  p_response_time_ms integer DEFAULT NULL,
  p_status_code integer DEFAULT NULL,
  p_response_data jsonb DEFAULT '{}',
  p_error_message text DEFAULT NULL,
  p_tested_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  test_id uuid;
BEGIN
  INSERT INTO configuration_tests (
    empresa_id,
    test_type,
    endpoint_url,
    test_status,
    response_time_ms,
    status_code,
    response_data,
    error_message,
    tested_by
  ) VALUES (
    p_empresa_id,
    p_test_type,
    p_endpoint_url,
    p_test_status,
    p_response_time_ms,
    p_status_code,
    p_response_data,
    p_error_message,
    p_tested_by
  ) RETURNING id INTO test_id;

  RETURN test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener último backup activo
CREATE OR REPLACE FUNCTION get_latest_configuration_backup(
  p_empresa_id uuid,
  p_backup_type text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  backup_name text,
  backup_type text,
  configuration_data jsonb,
  created_at timestamptz,
  description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cb.id,
    cb.backup_name,
    cb.backup_type,
    cb.configuration_data,
    cb.created_at,
    cb.description
  FROM configuration_backups cb
  WHERE cb.empresa_id = p_empresa_id
    AND cb.is_active = true
    AND (p_backup_type IS NULL OR cb.backup_type = p_backup_type)
  ORDER BY cb.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de tests
CREATE OR REPLACE FUNCTION get_connectivity_test_stats(
  p_empresa_id uuid,
  p_hours integer DEFAULT 24
)
RETURNS TABLE(
  test_type text,
  total_tests bigint,
  successful_tests bigint,
  failed_tests bigint,
  avg_response_time numeric,
  success_rate numeric,
  last_test_time timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.test_type,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE ct.test_status = 'success') as successful_tests,
    COUNT(*) FILTER (WHERE ct.test_status != 'success') as failed_tests,
    AVG(ct.response_time_ms) as avg_response_time,
    ROUND(
      (COUNT(*) FILTER (WHERE ct.test_status = 'success')::numeric / COUNT(*)::numeric) * 100, 
      2
    ) as success_rate,
    MAX(ct.created_at) as last_test_time
  FROM configuration_tests ct
  WHERE ct.empresa_id = p_empresa_id
    AND ct.created_at >= (now() - (p_hours || ' hours')::interval)
  GROUP BY ct.test_type
  ORDER BY ct.test_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_configuration_data()
RETURNS void AS $$
BEGIN
  -- Limpiar historial de configuraciones mayor a 90 días
  DELETE FROM endpoint_configurations_history
  WHERE created_at < now() - interval '90 days';

  -- Limpiar tests de conectividad mayor a 30 días
  DELETE FROM configuration_tests
  WHERE created_at < now() - interval '30 days';

  -- Limpiar backups manuales mayor a 180 días (mantener automáticos)
  DELETE FROM configuration_backups
  WHERE backup_type = 'manual'
    AND created_at < now() - interval '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_config_history_empresa_type 
  ON endpoint_configurations_history(empresa_id, configuration_type, created_at);

CREATE INDEX IF NOT EXISTS idx_config_backups_empresa_active 
  ON configuration_backups(empresa_id, is_active, created_at);

CREATE INDEX IF NOT EXISTS idx_config_tests_empresa_type 
  ON configuration_tests(empresa_id, test_type, created_at);

-- Insertar configuración de ejemplo para testing
DO $$
DECLARE
  empresa_id_var uuid;
BEGIN
  -- Obtener primera empresa disponible
  SELECT id INTO empresa_id_var FROM empresas LIMIT 1;
  
  IF empresa_id_var IS NOT NULL THEN
    -- Crear backup inicial de ejemplo
    PERFORM create_configuration_backup(
      empresa_id_var,
      'Configuración Inicial',
      'manual',
      '{"n8n_url": "https://n8n.n8ncloud.top", "endpoints": {"health_check": "/webhook/health-check"}}',
      NULL,
      'Backup inicial del sistema'
    );
  END IF;
END $$;