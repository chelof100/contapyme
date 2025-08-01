/*
  # Sistema de Validación AFIP

  1. Nuevas Tablas
    - `afip_puntos_venta_cache` - Cache de puntos de venta autorizados
    - `afip_validaciones_log` - Log de validaciones AFIP realizadas

  2. Funciones
    - Cache inteligente con expiración de 1 hora
    - Validación de puntos de venta
    - Consulta de último número de comprobante

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas por empresa
*/

-- Tabla para cache de puntos de venta AFIP
CREATE TABLE IF NOT EXISTS afip_puntos_venta_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  cuit text NOT NULL,
  punto_venta text NOT NULL,
  tipo_comprobante text NOT NULL,
  autorizado boolean DEFAULT false,
  ultimo_numero bigint DEFAULT 0,
  fecha_consulta timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, cuit, punto_venta, tipo_comprobante)
);

-- Tabla para log de validaciones AFIP
CREATE TABLE IF NOT EXISTS afip_validaciones_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  cuit text NOT NULL,
  punto_venta text NOT NULL,
  tipo_comprobante text NOT NULL,
  tipo_validacion text NOT NULL, -- 'punto_venta', 'ultimo_numero', 'cae'
  resultado boolean DEFAULT false,
  datos_enviados jsonb DEFAULT '{}',
  datos_recibidos jsonb DEFAULT '{}',
  tiempo_respuesta_ms integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE afip_puntos_venta_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE afip_validaciones_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para afip_puntos_venta_cache
CREATE POLICY "Users can view cache for their company" ON afip_puntos_venta_cache
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert cache for their company" ON afip_puntos_venta_cache
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update cache for their company" ON afip_puntos_venta_cache
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para afip_validaciones_log
CREATE POLICY "Users can view validations for their company" ON afip_validaciones_log
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert validations for their company" ON afip_validaciones_log
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Función para obtener cache válido de punto de venta
CREATE OR REPLACE FUNCTION get_afip_cache(
  p_empresa_id uuid,
  p_cuit text,
  p_punto_venta text,
  p_tipo_comprobante text
)
RETURNS TABLE(
  autorizado boolean,
  ultimo_numero bigint,
  cache_valido boolean,
  expires_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.autorizado,
    c.ultimo_numero,
    (c.expires_at > now()) as cache_valido,
    c.expires_at
  FROM afip_puntos_venta_cache c
  WHERE c.empresa_id = p_empresa_id
    AND c.cuit = p_cuit
    AND c.punto_venta = p_punto_venta
    AND c.tipo_comprobante = p_tipo_comprobante;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar cache de AFIP
CREATE OR REPLACE FUNCTION update_afip_cache(
  p_empresa_id uuid,
  p_cuit text,
  p_punto_venta text,
  p_tipo_comprobante text,
  p_autorizado boolean,
  p_ultimo_numero bigint,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO afip_puntos_venta_cache (
    empresa_id,
    cuit,
    punto_venta,
    tipo_comprobante,
    autorizado,
    ultimo_numero,
    fecha_consulta,
    expires_at,
    metadata
  ) VALUES (
    p_empresa_id,
    p_cuit,
    p_punto_venta,
    p_tipo_comprobante,
    p_autorizado,
    p_ultimo_numero,
    now(),
    now() + interval '1 hour',
    p_metadata
  )
  ON CONFLICT (empresa_id, cuit, punto_venta, tipo_comprobante)
  DO UPDATE SET
    autorizado = p_autorizado,
    ultimo_numero = p_ultimo_numero,
    fecha_consulta = now(),
    expires_at = now() + interval '1 hour',
    metadata = p_metadata,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_afip_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM afip_puntos_venta_cache
  WHERE expires_at < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar validación AFIP
CREATE OR REPLACE FUNCTION log_afip_validation(
  p_empresa_id uuid,
  p_cuit text,
  p_punto_venta text,
  p_tipo_comprobante text,
  p_tipo_validacion text,
  p_resultado boolean,
  p_datos_enviados jsonb DEFAULT '{}',
  p_datos_recibidos jsonb DEFAULT '{}',
  p_tiempo_respuesta_ms integer DEFAULT 0,
  p_error_message text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  validation_id uuid;
BEGIN
  INSERT INTO afip_validaciones_log (
    empresa_id,
    cuit,
    punto_venta,
    tipo_comprobante,
    tipo_validacion,
    resultado,
    datos_enviados,
    datos_recibidos,
    tiempo_respuesta_ms,
    error_message
  ) VALUES (
    p_empresa_id,
    p_cuit,
    p_punto_venta,
    p_tipo_comprobante,
    p_tipo_validacion,
    p_resultado,
    p_datos_enviados,
    p_datos_recibidos,
    p_tiempo_respuesta_ms,
    p_error_message
  ) RETURNING id INTO validation_id;
  
  RETURN validation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_afip_cache_empresa_expires 
  ON afip_puntos_venta_cache(empresa_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_afip_cache_lookup 
  ON afip_puntos_venta_cache(empresa_id, cuit, punto_venta, tipo_comprobante);

CREATE INDEX IF NOT EXISTS idx_afip_validations_empresa_fecha 
  ON afip_validaciones_log(empresa_id, created_at);

-- Triggers para updated_at
CREATE TRIGGER update_afip_cache_updated_at
  BEFORE UPDATE ON afip_puntos_venta_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo para testing
INSERT INTO afip_puntos_venta_cache (
  empresa_id,
  cuit,
  punto_venta,
  tipo_comprobante,
  autorizado,
  ultimo_numero,
  metadata
) VALUES (
  (SELECT id FROM empresas LIMIT 1),
  '20304050607',
  '0001',
  'Factura A',
  true,
  1000,
  '{"testing": true, "ambiente": "desarrollo"}'
) ON CONFLICT DO NOTHING;

INSERT INTO afip_puntos_venta_cache (
  empresa_id,
  cuit,
  punto_venta,
  tipo_comprobante,
  autorizado,
  ultimo_numero,
  metadata
) VALUES (
  (SELECT id FROM empresas LIMIT 1),
  '20304050607',
  '0001',
  'Factura B',
  true,
  500,
  '{"testing": true, "ambiente": "desarrollo"}'
) ON CONFLICT DO NOTHING;