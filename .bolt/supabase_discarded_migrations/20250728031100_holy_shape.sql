/*
  # Sistema de Health Check Automático

  1. Nuevas Tablas
    - `health_checks_log` - Registro de health checks
    - `system_metrics` - Métricas del sistema en tiempo real
  
  2. Funciones
    - Función para registrar health checks
    - Función para calcular métricas
  
  3. Triggers
    - Trigger automático para alertas
  
  4. Políticas RLS
    - Acceso por empresa para logs y métricas
*/

-- Tabla para registrar health checks
CREATE TABLE IF NOT EXISTS health_checks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  service_name text NOT NULL,
  endpoint_url text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'timeout', 'error')),
  response_time_ms integer,
  status_code integer,
  error_message text,
  metadata jsonb DEFAULT '{}',
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabla para métricas del sistema
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  metric_type text NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
  tags jsonb DEFAULT '{}',
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_health_checks_empresa_service ON health_checks_log(empresa_id, service_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status_time ON health_checks_log(status, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_empresa_name ON system_metrics(empresa_id, metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time ON system_metrics(metric_type, recorded_at DESC);

-- Habilitar RLS
ALTER TABLE health_checks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para health_checks_log
CREATE POLICY "Users can view health checks from their company"
  ON health_checks_log
  FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert health checks for their company"
  ON health_checks_log
  FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Admins can view all health checks"
  ON health_checks_log
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin'::user_role);

-- Políticas RLS para system_metrics
CREATE POLICY "Users can view metrics from their company"
  ON system_metrics
  FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert metrics for their company"
  ON system_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Admins can view all metrics"
  ON system_metrics
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin'::user_role);

-- Función para limpiar logs antiguos (mantener solo últimas 24 horas)
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM health_checks_log 
  WHERE checked_at < now() - interval '24 hours';
  
  DELETE FROM system_metrics 
  WHERE recorded_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular métricas de salud
CREATE OR REPLACE FUNCTION calculate_health_metrics(empresa_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_checks integer;
  healthy_checks integer;
  avg_response_time numeric;
  last_check_time timestamptz;
BEGIN
  -- Calcular métricas de las últimas 24 horas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'healthy'),
    AVG(response_time_ms),
    MAX(checked_at)
  INTO total_checks, healthy_checks, avg_response_time, last_check_time
  FROM health_checks_log 
  WHERE empresa_id = empresa_uuid 
    AND checked_at > now() - interval '24 hours';

  -- Construir resultado JSON
  result := jsonb_build_object(
    'total_checks', COALESCE(total_checks, 0),
    'healthy_checks', COALESCE(healthy_checks, 0),
    'unhealthy_checks', COALESCE(total_checks - healthy_checks, 0),
    'health_percentage', CASE 
      WHEN total_checks > 0 THEN ROUND((healthy_checks::numeric / total_checks::numeric) * 100, 2)
      ELSE 0
    END,
    'avg_response_time_ms', COALESCE(ROUND(avg_response_time, 2), 0),
    'last_check_time', last_check_time,
    'is_healthy', CASE 
      WHEN total_checks = 0 THEN false
      WHEN healthy_checks::numeric / total_checks::numeric >= 0.8 THEN true
      ELSE false
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para alertas automáticas
CREATE OR REPLACE FUNCTION check_health_alerts()
RETURNS trigger AS $$
DECLARE
  consecutive_failures integer;
  alert_threshold integer := 3;
BEGIN
  -- Solo procesar si el health check falló
  IF NEW.status != 'healthy' THEN
    -- Contar fallos consecutivos en los últimos 15 minutos
    SELECT COUNT(*)
    INTO consecutive_failures
    FROM health_checks_log
    WHERE empresa_id = NEW.empresa_id
      AND service_name = NEW.service_name
      AND status != 'healthy'
      AND checked_at > now() - interval '15 minutes'
      AND checked_at <= NEW.checked_at
    ORDER BY checked_at DESC
    LIMIT alert_threshold;

    -- Si hay suficientes fallos consecutivos, registrar métrica de alerta
    IF consecutive_failures >= alert_threshold THEN
      INSERT INTO system_metrics (
        empresa_id,
        metric_name,
        metric_value,
        metric_unit,
        metric_type,
        tags
      ) VALUES (
        NEW.empresa_id,
        'health_check_alert',
        1,
        'count',
        'counter',
        jsonb_build_object(
          'service_name', NEW.service_name,
          'consecutive_failures', consecutive_failures,
          'last_error', NEW.error_message,
          'alert_level', CASE 
            WHEN consecutive_failures >= 5 THEN 'critical'
            ELSE 'warning'
          END
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alertas automáticas
DROP TRIGGER IF EXISTS health_check_alert_trigger ON health_checks_log;
CREATE TRIGGER health_check_alert_trigger
  AFTER INSERT ON health_checks_log
  FOR EACH ROW
  EXECUTE FUNCTION check_health_alerts();

-- Insertar métricas iniciales para el sistema
INSERT INTO system_metrics (
  empresa_id,
  metric_name,
  metric_value,
  metric_unit,
  metric_type,
  tags
) VALUES 
(
  (SELECT id FROM empresas WHERE nombre = 'ContaPYME Default' LIMIT 1),
  'system_startup',
  1,
  'count',
  'counter',
  jsonb_build_object('version', '1.0.0', 'environment', 'development')
) ON CONFLICT DO NOTHING;