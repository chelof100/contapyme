-- Crear tabla para logs de workflows de n8n
CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  factura_id TEXT,
  cae TEXT,
  cliente TEXT,
  total DECIMAL(10,2),
  email_sent BOOLEAN DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow_name ON workflow_logs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_status ON workflow_logs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_timestamp ON workflow_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_factura_id ON workflow_logs(factura_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution_id ON workflow_logs(execution_id);

-- Crear tabla para métricas de workflows
CREATE TABLE IF NOT EXISTS workflow_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  date DATE NOT NULL,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  average_response_time_ms INTEGER,
  total_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workflow_name, date)
);

-- Crear índices para métricas
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_name ON workflow_metrics(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_date ON workflow_metrics(date);

-- Función para actualizar métricas automáticamente
CREATE OR REPLACE FUNCTION update_workflow_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workflow_metrics (workflow_name, date, total_executions, successful_executions, failed_executions)
  VALUES (
    NEW.workflow_name,
    DATE(NEW.timestamp),
    1,
    CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END
  )
  ON CONFLICT (workflow_name, date)
  DO UPDATE SET
    total_executions = workflow_metrics.total_executions + 1,
    successful_executions = workflow_metrics.successful_executions + 
      CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    failed_executions = workflow_metrics.failed_executions + 
      CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar métricas cuando se inserta un log
CREATE TRIGGER trigger_update_workflow_metrics
  AFTER INSERT ON workflow_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_metrics();

-- Función para obtener estadísticas de workflows
CREATE OR REPLACE FUNCTION get_workflow_stats(p_workflow_name TEXT DEFAULT NULL, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH workflow_stats AS (
    SELECT
      workflow_name,
      COUNT(*) as total_executions,
      COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
      COUNT(*) FILTER (WHERE status = 'error') as failed_executions,
      AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (PARTITION BY workflow_name ORDER BY timestamp)))) as avg_time_between_executions
    FROM workflow_logs
    WHERE timestamp >= NOW() - INTERVAL '1 day' * p_days
      AND (p_workflow_name IS NULL OR workflow_name = p_workflow_name)
    GROUP BY workflow_name
  ),
  recent_errors AS (
    SELECT
      workflow_name,
      error_message,
      timestamp
    FROM workflow_logs
    WHERE status = 'error'
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days
      AND (p_workflow_name IS NULL OR workflow_name = p_workflow_name)
    ORDER BY timestamp DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'workflows', json_agg(ws.*),
    'recent_errors', json_agg(re.*),
    'summary', json_build_object(
      'total_workflows', COUNT(DISTINCT ws.workflow_name),
      'total_executions', COALESCE(SUM(ws.total_executions), 0),
      'success_rate', CASE 
        WHEN COALESCE(SUM(ws.total_executions), 0) > 0 
        THEN ROUND((COALESCE(SUM(ws.successful_executions), 0)::DECIMAL / COALESCE(SUM(ws.total_executions), 1)) * 100, 2)
        ELSE 0 
      END
    )
  ) INTO result
  FROM workflow_stats ws
  CROSS JOIN LATERAL (
    SELECT json_agg(recent_errors.*) as errors
  ) re;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_workflow_logs(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM workflow_logs
  WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para workflow_logs
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow logs"
  ON workflow_logs FOR SELECT
  USING (true);

CREATE POLICY "System can insert workflow logs"
  ON workflow_logs FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para workflow_metrics
ALTER TABLE workflow_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow metrics"
  ON workflow_metrics FOR SELECT
  USING (true);

CREATE POLICY "System can insert workflow metrics"
  ON workflow_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update workflow metrics"
  ON workflow_metrics FOR UPDATE
  USING (true);

-- Comentarios para documentación
COMMENT ON TABLE workflow_logs IS 'Logs de ejecución de workflows de n8n';
COMMENT ON TABLE workflow_metrics IS 'Métricas agregadas de workflows de n8n';
COMMENT ON FUNCTION get_workflow_stats IS 'Obtiene estadísticas de workflows para los últimos N días';
COMMENT ON FUNCTION cleanup_old_workflow_logs IS 'Limpia logs antiguos de workflows para mantener rendimiento'; 