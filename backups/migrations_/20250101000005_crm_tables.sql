/*
  # CRM Base Tables Creation

  1. New Tables
    - `clientes` - Customer management with CUIT validation
    - `contactos` - Customer contacts and relationships
    - `interacciones` - Customer interaction history
    - `etapas_pipeline` - Sales pipeline stages configuration
    - `oportunidades` - Sales opportunities management
    - `actividades` - Tasks and activities tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for company-based data isolation
    - Ensure proper foreign key relationships

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints for business rules
*/

-- Clientes y contactos
CREATE TABLE IF NOT EXISTS clientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  cuit varchar(11) UNIQUE NOT NULL,
  razon_social varchar(255) NOT NULL,
  nombre_fantasia varchar(255),
  email varchar(255),
  telefono varchar(50),
  direccion text,
  ciudad varchar(100),
  provincia varchar(100),
  codigo_postal varchar(10),
  condicion_iva varchar(50) DEFAULT 'Responsable Inscripto',
  categoria varchar(100), -- VIP, Regular, Nuevo, etc.
  estado varchar(20) DEFAULT 'activo', -- activo, inactivo, prospecto
  notas text,
  fecha_primera_compra date,
  monto_total_compras decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contactos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  nombre varchar(255) NOT NULL,
  apellido varchar(255) NOT NULL,
  cargo varchar(100),
  email varchar(255),
  telefono varchar(50),
  es_principal boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interacciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES auth.users(id),
  tipo varchar(50) NOT NULL, -- llamada, email, reunion, whatsapp, visita
  descripcion text NOT NULL,
  resultado varchar(100), -- exitoso, pendiente, sin_respuesta, interesado
  fecha_interaccion timestamptz DEFAULT now(),
  fecha_seguimiento timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Pipeline de ventas
CREATE TABLE IF NOT EXISTS etapas_pipeline (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  nombre varchar(100) NOT NULL,
  descripcion text,
  orden integer NOT NULL,
  color varchar(7) DEFAULT '#3B82F6', -- hex color
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oportunidades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  cliente_id uuid REFERENCES clientes(id) NOT NULL,
  etapa_id uuid REFERENCES etapas_pipeline(id),
  titulo varchar(255) NOT NULL,
  descripcion text,
  valor_estimado decimal(12,2),
  probabilidad integer CHECK (probabilidad >= 0 AND probabilidad <= 100),
  fecha_creacion date DEFAULT CURRENT_DATE,
  fecha_cierre_estimada date,
  fecha_cierre_real date,
  estado varchar(20) DEFAULT 'abierta', -- abierta, ganada, perdida, cancelada
  motivo_perdida text,
  fuente varchar(100), -- web, telefono, referencia, marketing, etc.
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actividades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oportunidad_id uuid REFERENCES oportunidades(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id),
  tipo varchar(50) NOT NULL, -- tarea, llamada, reunion, email, demo
  titulo varchar(255) NOT NULL,
  descripcion text,
  fecha_vencimiento timestamptz,
  completada boolean DEFAULT false,
  fecha_completada timestamptz,
  prioridad varchar(20) DEFAULT 'media', -- alta, media, baja
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_estado ON clientes(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_clientes_cuit ON clientes(cuit);
CREATE INDEX IF NOT EXISTS idx_contactos_cliente ON contactos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_cliente_fecha ON interacciones(cliente_id, fecha_interaccion);
CREATE INDEX IF NOT EXISTS idx_oportunidades_empresa_estado ON oportunidades(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa ON oportunidades(etapa_id);
CREATE INDEX IF NOT EXISTS idx_actividades_assigned_fecha ON actividades(assigned_to, fecha_vencimiento);

-- Enable RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clientes
CREATE POLICY "Users can view clientes from their company"
  ON clientes FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert clientes for their company"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update clientes from their company"
  ON clientes FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- RLS Policies for contactos
CREATE POLICY "Users can view contactos from their company"
  ON contactos FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = contactos.cliente_id 
    AND c.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can insert contactos for their company"
  ON contactos FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = contactos.cliente_id 
    AND c.empresa_id = get_current_user_empresa_id()
  ));

-- RLS Policies for interacciones
CREATE POLICY "Users can view interacciones from their company"
  ON interacciones FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = interacciones.cliente_id 
    AND c.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can insert interacciones for their company"
  ON interacciones FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = interacciones.cliente_id 
    AND c.empresa_id = get_current_user_empresa_id()
  ));

-- RLS Policies for etapas_pipeline
CREATE POLICY "Users can view etapas from their company"
  ON etapas_pipeline FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage etapas for their company"
  ON etapas_pipeline FOR ALL
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id())
  WITH CHECK (empresa_id = get_current_user_empresa_id());

-- RLS Policies for oportunidades
CREATE POLICY "Users can view oportunidades from their company"
  ON oportunidades FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage oportunidades for their company"
  ON oportunidades FOR ALL
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id())
  WITH CHECK (empresa_id = get_current_user_empresa_id());

-- RLS Policies for actividades
CREATE POLICY "Users can view actividades from their company"
  ON actividades FOR SELECT
  TO authenticated
  USING (
    (assigned_to = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM oportunidades o 
      WHERE o.id = actividades.oportunidad_id 
      AND o.empresa_id = get_current_user_empresa_id()
    )) OR
    (EXISTS (
      SELECT 1 FROM clientes c 
      WHERE c.id = actividades.cliente_id 
      AND c.empresa_id = get_current_user_empresa_id()
    ))
  );

CREATE POLICY "Users can manage actividades for their company"
  ON actividades FOR ALL
  TO authenticated
  USING (
    (assigned_to = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM oportunidades o 
      WHERE o.id = actividades.oportunidad_id 
      AND o.empresa_id = get_current_user_empresa_id()
    )) OR
    (EXISTS (
      SELECT 1 FROM clientes c 
      WHERE c.id = actividades.cliente_id 
      AND c.empresa_id = get_current_user_empresa_id()
    ))
  )
  WITH CHECK (
    (assigned_to = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM oportunidades o 
      WHERE o.id = actividades.oportunidad_id 
      AND o.empresa_id = get_current_user_empresa_id()
    )) OR
    (EXISTS (
      SELECT 1 FROM clientes c 
      WHERE c.id = actividades.cliente_id 
      AND c.empresa_id = get_current_user_empresa_id()
    ))
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oportunidades_updated_at BEFORE UPDATE ON oportunidades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default pipeline stages for existing companies
INSERT INTO etapas_pipeline (empresa_id, nombre, descripcion, orden, color)
SELECT 
  e.id,
  stage.nombre,
  stage.descripcion,
  stage.orden,
  stage.color
FROM empresas e
CROSS JOIN (
  VALUES 
    ('Prospecto', 'Cliente potencial identificado', 1, '#6B7280'),
    ('Contacto Inicial', 'Primera comunicación establecida', 2, '#3B82F6'),
    ('Calificado', 'Necesidad y presupuesto confirmados', 3, '#F59E0B'),
    ('Propuesta', 'Propuesta comercial enviada', 4, '#8B5CF6'),
    ('Negociación', 'En proceso de negociación', 5, '#EF4444'),
    ('Cierre', 'Listo para cerrar la venta', 6, '#10B981')
) AS stage(nombre, descripcion, orden, color)
WHERE NOT EXISTS (
  SELECT 1 FROM etapas_pipeline ep WHERE ep.empresa_id = e.id
);