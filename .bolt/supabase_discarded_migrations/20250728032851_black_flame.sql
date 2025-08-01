/*
  # Sistema de Monitoreo Completo

  1. Nuevas Tablas
    - `workflow_metrics` - Métricas de workflows en tiempo real
    - `error_logs_detailed` - Log detallado de errores del sistema
    - `integration_status` - Estado de integraciones externas
    - `alert_configurations` - Configuración de alertas personalizables

  2. Views Agregadas
    - `workflow_performance_24h` - Rendimiento últimas 24 horas
    - `error_summary_hourly` - Resumen de errores por hora
    - `integration_health_summary` - Resumen de salud de integraciones

  3. Funciones
    - Cálculo automático de métricas
    - Limpieza automática de logs antiguos
    - Generación de alertas

  4. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas por empresa
*/

-- Tabla para métricas de workflows
CREATE TABLE IF NOT EXISTS workflow_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  workflow_name text NOT NULL,
  workflow_type text NOT NULL, -- 'factura', 'orden', 'pago', 'stock', etc.
  execution_id text,
  status text NOT NULL, -- 'success', 'error', 'timeout', 'running'
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_ms integer,
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  error_details jsonb DEFAULT '{}',
  retry_count integer DEFAULT 0,
  priority text DEFAULT 'medium', -- 'high', 'medium', 'low'
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Tabla para logs detallados de errores
CREATE TABLE IF NOT EXISTS error_logs_detailed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  error_type text NOT NULL, -- 'network', 'validation', 'business_logic', etc.
  error_severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
  error_code text,
  error_message text NOT NULL,
  error_stack text,
  context_data jsonb DEFAULT '{}',
  user_id uuid,
  session_id text,
  request_id text,
  component text, -- 'frontend', 'webhook', 'database', 'external_api'
  endpoint text,
  user_agent text,
  ip_address inet,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabla para estado de integraciones externas
CREATE TABLE IF NOT EXISTS integration_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  integration_name text NOT NULL, -- 'n8n', 'afip', 'mercadopago', 'email', etc.
  integration_type text NOT NULL, -- 'webhook', 'api', 'service'
  endpoint_url text,
  status text NOT NULL, -- 'healthy', 'degraded', 'down', 'maintenance'
  last_check_time timestamptz DEFAULT now(),
  last_success_time timestamptz,
  last_error_time timestamptz,
  response_time_ms integer,
  error_count_24h integer DEFAULT 0,
  success_count_24h integer DEFAULT 0,
  uptime_percentage numeric(5,2) DEFAULT 100.00,
  configuration jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, integration_name)
);

-- Tabla para configuración de alertas
CREATE TABLE IF NOT EXISTS alert_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  alert_name text NOT NULL,
  alert_type text NOT NULL, -- 'error_threshold', 'response_time', 'uptime', 'workflow_failure'
  conditions jsonb NOT NULL, -- Condiciones para disparar la alerta
  notification_channels jsonb DEFAULT '[]', -- ['email', 'webhook', 'ui']
  enabled boolean DEFAULT true,
  cooldown_minutes integer DEFAULT 15, -- Tiempo mínimo entre alertas del mismo tipo
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE workflow_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workflow_metrics
CREATE POLICY "Users can view workflow metrics for their company" ON workflow_metrics
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert workflow metrics for their company" ON workflow_metrics
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para error_logs_detailed
CREATE POLICY "Users can view error logs for their company" ON error_logs_detailed
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert error logs for their company" ON error_logs_detailed
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update error logs for their company" ON error_logs_detailed
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para integration_status
CREATE POLICY "Users can view integration status for their company" ON integration_status
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage integration status for their company" ON integration_status
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para alert_configurations
CREATE POLICY "Users can manage alerts for their company" ON alert_configurations
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Vista para rendimiento de workflows últimas 24h
CREATE OR REPLACE VIEW workflow_performance_24h AS
SELECT 
  empresa_id,
  workflow_type,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
  COUNT(*) FILTER (WHERE status = 'error') as failed_executions,
  COUNT(*) FILTER (WHERE status = 'timeout') as timeout_executions,
  ROUND(AVG(duration_ms), 2) as avg_duration_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms), 2) as p95_duration_ms,
  MIN(start_time) as first_execution,
  MAX(start_time) as last_execution,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*)) * 100, 
    2
  ) as success_rate_percentage
FROM workflow_metrics 
WHERE start_time >= now() - interval '24 hours'
GROUP BY empresa_id, workflow_type;

-- Vista para resumen de errores por hora
CREATE OR REPLACE VIEW error_summary_hourly AS
SELECT 
  empresa_id,
  date_trunc('hour', created_at) as hour,
  error_type,
  error_severity,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT session_id) as affected_sessions
FROM error_logs_detailed 
WHERE created_at >= now() - interval '24 hours'
GROUP BY empresa_id, date_trunc('hour', created_at), error_type, error_severity
ORDER BY hour DESC;

-- Vista para resumen de salud de integraciones
CREATE OR REPLACE VIEW integration_health_summary AS
SELECT 
  empresa_id,
  integration_name,
  integration_type,
  status,
  uptime_percentage,
  response_time_ms,
  error_count_24h,
  success_count_24h,
  CASE 
    WHEN uptime_percentage >= 99 THEN 'excellent'
    WHEN uptime_percentage >= 95 THEN 'good'
    WHEN uptime_percentage >= 90 THEN 'fair'
    ELSE 'poor'
  END as health_grade,
  last_check_time,
  last_success_time,
  last_error_time
FROM integration_status;

-- Función para registrar métricas de workflow
CREATE OR REPLACE FUNCTION log_workflow_metric(
  p_empresa_id uuid,
  p_workflow_name text,
  p_workflow_type text,
  p_execution_id text,
  p_status text,
  p_start_time timestamptz,
  p_end_time timestamptz DEFAULT NULL,
  p_input_data jsonb DEFAULT '{}',
  p_output_data jsonb DEFAULT '{}',
  p_error_details jsonb DEFAULT '{}',
  p_retry_count integer DEFAULT 0,
  p_priority text DEFAULT 'medium',
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  metric_id uuid;
  calculated_duration integer;
BEGIN
  -- Calcular duración si hay end_time
  IF p_end_time IS NOT NULL THEN
    calculated_duration := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) * 1000;
  END IF;

  INSERT INTO workflow_metrics (
    empresa_id,
    workflow_name,
    workflow_type,
    execution_id,
    status,
    start_time,
    end_time,
    duration_ms,
    input_data,
    output_data,
    error_details,
    retry_count,
    priority,
    user_id
  ) VALUES (
    p_empresa_id,
    p_workflow_name,
    p_workflow_type,
    p_execution_id,
    p_status,
    p_start_time,
    p_end_time,
    calculated_duration,
    p_input_data,
    p_output_data,
    p_error_details,
    p_retry_count,
    p_priority,
    p_user_id
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar error detallado
CREATE OR REPLACE FUNCTION log_detailed_error(
  p_empresa_id uuid,
  p_error_type text,
  p_error_severity text,
  p_error_message text,
  p_error_code text DEFAULT NULL,
  p_error_stack text DEFAULT NULL,
  p_context_data jsonb DEFAULT '{}',
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_request_id text DEFAULT NULL,
  p_component text DEFAULT NULL,
  p_endpoint text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  error_id uuid;
BEGIN
  INSERT INTO error_logs_detailed (
    empresa_id,
    error_type,
    error_severity,
    error_message,
    error_code,
    error_stack,
    context_data,
    user_id,
    session_id,
    request_id,
    component,
    endpoint
  ) VALUES (
    p_empresa_id,
    p_error_type,
    p_error_severity,
    p_error_message,
    p_error_code,
    p_error_stack,
    p_context_data,
    p_user_id,
    p_session_id,
    p_request_id,
    p_component,
    p_endpoint
  ) RETURNING id INTO error_id;
  
  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar estado de integración
CREATE OR REPLACE FUNCTION update_integration_status(
  p_empresa_id uuid,
  p_integration_name text,
  p_integration_type text,
  p_endpoint_url text,
  p_status text,
  p_response_time_ms integer DEFAULT NULL,
  p_error_details jsonb DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_hour timestamptz := date_trunc('hour', now());
BEGIN
  INSERT INTO integration_status (
    empresa_id,
    integration_name,
    integration_type,
    endpoint_url,
    status,
    last_check_time,
    response_time_ms
  ) VALUES (
    p_empresa_id,
    p_integration_name,
    p_integration_type,
    p_endpoint_url,
    p_status,
    now(),
    p_response_time_ms
  )
  ON CONFLICT (empresa_id, integration_name)
  DO UPDATE SET
    status = p_status,
    last_check_time = now(),
    response_time_ms = p_response_time_ms,
    last_success_time = CASE 
      WHEN p_status = 'healthy' THEN now() 
      ELSE integration_status.last_success_time 
    END,
    last_error_time = CASE 
      WHEN p_status != 'healthy' THEN now() 
      ELSE integration_status.last_error_time 
    END,
    success_count_24h = CASE 
      WHEN p_status = 'healthy' THEN integration_status.success_count_24h + 1
      ELSE integration_status.success_count_24h
    END,
    error_count_24h = CASE 
      WHEN p_status != 'healthy' THEN integration_status.error_count_24h + 1
      ELSE integration_status.error_count_24h
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular métricas del sistema
CREATE OR REPLACE FUNCTION calculate_system_metrics(p_empresa_id uuid)
RETURNS TABLE(
  total_workflows_24h bigint,
  successful_workflows_24h bigint,
  failed_workflows_24h bigint,
  avg_response_time_ms numeric,
  total_errors_24h bigint,
  critical_errors_24h bigint,
  integrations_healthy bigint,
  integrations_total bigint,
  system_health_score numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH workflow_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as successful,
      COUNT(*) FILTER (WHERE status = 'error') as failed,
      AVG(duration_ms) as avg_duration
    FROM workflow_metrics 
    WHERE empresa_id = p_empresa_id 
      AND start_time >= now() - interval '24 hours'
  ),
  error_stats AS (
    SELECT 
      COUNT(*) as total_errors,
      COUNT(*) FILTER (WHERE error_severity = 'critical') as critical_errors
    FROM error_logs_detailed 
    WHERE empresa_id = p_empresa_id 
      AND created_at >= now() - interval '24 hours'
  ),
  integration_stats AS (
    SELECT 
      COUNT(*) as total_integrations,
      COUNT(*) FILTER (WHERE status = 'healthy') as healthy_integrations
    FROM integration_status 
    WHERE empresa_id = p_empresa_id
  )
  SELECT 
    COALESCE(w.total, 0),
    COALESCE(w.successful, 0),
    COALESCE(w.failed, 0),
    COALESCE(w.avg_duration, 0),
    COALESCE(e.total_errors, 0),
    COALESCE(e.critical_errors, 0),
    COALESCE(i.healthy_integrations, 0),
    COALESCE(i.total_integrations, 0),
    -- Calcular score de salud del sistema (0-100)
    CASE 
      WHEN COALESCE(i.total_integrations, 0) = 0 THEN 50
      ELSE ROUND(
        (COALESCE(i.healthy_integrations, 0)::numeric / i.total_integrations) * 100, 2
      )
    END
  FROM workflow_stats w
  CROSS JOIN error_stats e
  CROSS JOIN integration_stats i;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpieza automática de logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Limpiar métricas de workflows mayores a 7 días
  DELETE FROM workflow_metrics 
  WHERE created_at < now() - interval '7 days';
  
  -- Limpiar logs de errores mayores a 30 días (excepto críticos)
  DELETE FROM error_logs_detailed 
  WHERE created_at < now() - interval '30 days'
    AND error_severity != 'critical';
  
  -- Limpiar errores críticos mayores a 90 días
  DELETE FROM error_logs_detailed 
  WHERE created_at < now() - interval '90 days'
    AND error_severity = 'critical';
    
  -- Resetear contadores de 24h en integration_status
  UPDATE integration_status 
  SET 
    error_count_24h = 0,
    success_count_24h = 0
  WHERE last_check_time < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_empresa_time 
  ON workflow_metrics(empresa_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_metrics_type_status 
  ON workflow_metrics(workflow_type, status);

CREATE INDEX IF NOT EXISTS idx_error_logs_empresa_time 
  ON error_logs_detailed(empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity_type 
  ON error_logs_detailed(error_severity, error_type);

CREATE INDEX IF NOT EXISTS idx_integration_status_empresa 
  ON integration_status(empresa_id, status);

-- Triggers para updated_at
CREATE TRIGGER update_integration_status_updated_at
  BEFORE UPDATE ON integration_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configurations_updated_at
  BEFORE UPDATE ON alert_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuraciones de alerta por defecto
INSERT INTO alert_configurations (
  empresa_id,
  alert_name,
  alert_type,
  conditions,
  notification_channels
) 
SELECT 
  id as empresa_id,
  'Error Rate High',
  'error_threshold',
  '{"threshold": 10, "timeframe_minutes": 60, "error_types": ["critical", "high"]}'::jsonb,
  '["ui", "email"]'::jsonb
FROM empresas
ON CONFLICT DO NOTHING;

INSERT INTO alert_configurations (
  empresa_id,
  alert_name,
  alert_type,
  conditions,
  notification_channels
) 
SELECT 
  id as empresa_id,
  'Integration Down',
  'uptime',
  '{"threshold": 95, "critical_integrations": ["n8n", "afip"]}'::jsonb,
  '["ui", "email"]'::jsonb
FROM empresas
ON CONFLICT DO NOTHING;

-- Insertar estados iniciales de integraciones
INSERT INTO integration_status (
  empresa_id,
  integration_name,
  integration_type,
  endpoint_url,
  status,
  configuration
) 
SELECT 
  id as empresa_id,
  'n8n',
  'webhook',
  'https://your-n8n-instance.com',
  'healthy',
  '{"timeout": 30000, "retry_attempts": 3}'::jsonb
FROM empresas
ON CONFLICT (empresa_id, integration_name) DO NOTHING;

INSERT INTO integration_status (
  empresa_id,
  integration_name,
  integration_type,
  endpoint_url,
  status,
  configuration
) 
SELECT 
  id as empresa_id,
  'afip',
  'api',
  'https://servicios1.afip.gov.ar',
  'healthy',
  '{"timeout": 15000, "cache_duration": 3600}'::jsonb
FROM empresas
ON CONFLICT (empresa_id, integration_name) DO NOTHING;

INSERT INTO integration_status (
  empresa_id,
  integration_name,
  integration_type,
  endpoint_url,
  status,
  configuration
) 
SELECT 
  id as empresa_id,
  'supabase',
  'database',
  'https://supabase.co',
  'healthy',
  '{"connection_pool": 10, "timeout": 10000}'::jsonb
FROM empresas
ON CONFLICT (empresa_id, integration_name) DO NOTHING;