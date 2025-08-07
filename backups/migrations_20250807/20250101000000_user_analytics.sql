-- Crear tabla para tracking de acciones del usuario
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('page_view', 'create', 'edit', 'delete', 'export', 'import')),
  module TEXT NOT NULL,
  page TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_timestamp ON user_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_actions_module ON user_actions(module);
CREATE INDEX IF NOT EXISTS idx_user_actions_page ON user_actions(page);
CREATE INDEX IF NOT EXISTS idx_user_actions_session ON user_actions(session_id);

-- Crear tabla para preferencias del usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  page TEXT NOT NULL,
  frequency INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module, page)
);

-- Crear índices para preferencias
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_frequency ON user_preferences(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_last_used ON user_preferences(last_used DESC);

-- Función para actualizar preferencias automáticamente
CREATE OR REPLACE FUNCTION update_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, module, page, frequency, last_used)
  VALUES (NEW.user_id, NEW.module, NEW.page, 1, NEW.timestamp)
  ON CONFLICT (user_id, module, page)
  DO UPDATE SET
    frequency = user_preferences.frequency + 1,
    last_used = NEW.timestamp,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar preferencias cuando se registra una acción
CREATE TRIGGER trigger_update_user_preferences
  AFTER INSERT ON user_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences();

-- Función para obtener estadísticas de uso del usuario
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH user_stats AS (
    SELECT
      COUNT(*) as total_actions,
      COUNT(*) FILTER (WHERE action_type = 'page_view') as page_views,
      COUNT(*) FILTER (WHERE action_type = 'create') as creates,
      COUNT(*) FILTER (WHERE action_type = 'edit') as edits,
      COUNT(*) FILTER (WHERE action_type = 'delete') as deletes,
      COUNT(*) FILTER (WHERE action_type = 'export') as exports,
      COUNT(*) FILTER (WHERE action_type = 'import') as imports
    FROM user_actions
    WHERE user_id = p_user_id
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days
  ),
  module_stats AS (
    SELECT
      module,
      COUNT(*) as count
    FROM user_actions
    WHERE user_id = p_user_id
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY module
    ORDER BY count DESC
  ),
  page_stats AS (
    SELECT
      page,
      COUNT(*) as count
    FROM user_actions
    WHERE user_id = p_user_id
      AND action_type = 'page_view'
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY page
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT json_build_object(
    'total_actions', us.total_actions,
    'page_views', us.page_views,
    'creates', us.creates,
    'edits', us.edits,
    'deletes', us.deletes,
    'exports', us.exports,
    'imports', us.imports,
    'modules', json_agg(ms.*),
    'pages', json_agg(ps.*)
  ) INTO result
  FROM user_stats us
  CROSS JOIN LATERAL (
    SELECT json_agg(module_stats.*) as modules
  ) ms
  CROSS JOIN LATERAL (
    SELECT json_agg(page_stats.*) as pages
  ) ps;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_user_actions(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_actions
  WHERE timestamp < NOW() - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para user_actions
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own actions"
  ON user_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions"
  ON user_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own actions"
  ON user_actions FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE user_actions IS 'Registro de acciones del usuario para análisis de comportamiento';
COMMENT ON TABLE user_preferences IS 'Preferencias y patrones de uso del usuario';
COMMENT ON FUNCTION get_user_stats IS 'Obtiene estadísticas de uso del usuario para los últimos N días';
COMMENT ON FUNCTION cleanup_old_user_actions IS 'Limpia datos antiguos de analytics para mantener rendimiento'; 