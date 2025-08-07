/*
  # Migración Limpia Consolidada - ContaPYME
  
  Esta migración contiene todo el esquema necesario para ContaPYME:
  - Tablas base (empresas, profiles, auth)
  - Tablas de facturación (facturas, pagos, órdenes)
  - Tablas de productos y stock
  - Tablas de CRM y ERP
  - Funciones y triggers automáticos
  - Políticas RLS de seguridad
*/

-- ===== ENUMS =====
CREATE TYPE user_role AS ENUM ('admin', 'usuario', 'contador');
CREATE TYPE factura_tipo AS ENUM ('A', 'B', 'C', 'E', 'M');
CREATE TYPE pago_metodo AS ENUM ('efectivo', 'transferencia', 'tarjeta', 'cheque', 'mercadopago');
CREATE TYPE stock_tipo AS ENUM ('entrada', 'salida', 'ajuste');
CREATE TYPE oportunidad_estado AS ENUM ('nuevo', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido');

-- ===== TABLAS BASE =====

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  cuit TEXT UNIQUE NOT NULL,
  domicilio TEXT,
  telefono TEXT,
  email TEXT,
  condicion_iva TEXT DEFAULT 'Responsable Inscripto',
  logo_url TEXT,
  configuracion JSONB DEFAULT '{}',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  empresa_id UUID REFERENCES empresas(id),
  role user_role DEFAULT 'usuario'::user_role NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== FUNCIONES AUXILIARES =====

-- Función para obtener empresa del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT empresa_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TABLAS DE FACTURACIÓN =====

-- Facturas emitidas
CREATE TABLE IF NOT EXISTS facturas_emitidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  numero_factura TEXT NOT NULL,
  tipo_factura factura_tipo NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  cliente_id UUID,
  cliente_nombre TEXT,
  cliente_cuit TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  iva DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  estado TEXT DEFAULT 'borrador',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Facturas recibidas
CREATE TABLE IF NOT EXISTS facturas_recibidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  numero_factura TEXT NOT NULL,
  fecha_factura DATE NOT NULL,
  proveedor_id UUID,
  proveedor_nombre TEXT,
  proveedor_cuit TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  iva DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  orden_compra_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Órdenes de compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  numero_orden TEXT NOT NULL,
  fecha_orden DATE NOT NULL,
  fecha_entrega_esperada DATE,
  proveedor_id UUID,
  proveedor_nombre TEXT,
  subtotal DECIMAL(15,2) DEFAULT 0,
  iva DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  estado TEXT DEFAULT 'borrador',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Órdenes de recepción
CREATE TABLE IF NOT EXISTS ordenes_recepcion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  factura_recibida_id UUID REFERENCES facturas_recibidas(id),
  orden_compra_id UUID REFERENCES ordenes_compra(id),
  fecha_recepcion DATE NOT NULL,
  estado TEXT DEFAULT 'recibido',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  factura_id UUID,
  factura_tipo TEXT, -- 'emitida' o 'recibida'
  fecha_pago DATE NOT NULL,
  monto DECIMAL(15,2) NOT NULL,
  metodo_pago pago_metodo NOT NULL,
  referencia TEXT,
  estado TEXT DEFAULT 'pendiente',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLAS DE PRODUCTOS Y STOCK =====

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_costo DECIMAL(15,2) DEFAULT 0,
  precio_venta DECIMAL(15,2) DEFAULT 0,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 10,
  categoria_id UUID,
  unidad_medida TEXT DEFAULT 'unidad',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  producto_id UUID REFERENCES productos(id) NOT NULL,
  tipo_movimiento stock_tipo NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  motivo TEXT,
  referencia_id UUID, -- ID de factura, orden, etc.
  referencia_tipo TEXT, -- 'factura', 'orden', 'ajuste'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alertas de stock
CREATE TABLE IF NOT EXISTS alertas_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  producto_id UUID REFERENCES productos(id) NOT NULL,
  tipo_alerta TEXT NOT NULL, -- 'bajo_stock', 'sin_stock', 'exceso_stock'
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLAS DE CRM =====

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  cuit TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  limite_credito DECIMAL(15,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  cuit TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Oportunidades
CREATE TABLE IF NOT EXISTS oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  cliente_id UUID REFERENCES clientes(id),
  valor_estimado DECIMAL(15,2),
  estado oportunidad_estado DEFAULT 'nuevo',
  probabilidad INTEGER DEFAULT 10,
  fecha_cierre_esperada DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLAS DE CONFIGURACIÓN =====

-- Configuraciones de endpoints
CREATE TABLE IF NOT EXISTS endpoint_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  endpoint_name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key TEXT,
  configuracion JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de workflows
CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  status TEXT NOT NULL, -- 'success', 'error', 'running'
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TRIGGERS AUTOMÁTICOS =====

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturas_emitidas_updated_at BEFORE UPDATE ON facturas_emitidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturas_recibidas_updated_at BEFORE UPDATE ON facturas_recibidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON ordenes_compra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordenes_recepcion_updated_at BEFORE UPDATE ON ordenes_recepcion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oportunidades_updated_at BEFORE UPDATE ON oportunidades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_endpoint_configurations_updated_at BEFORE UPDATE ON endpoint_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== POLÍTICAS RLS =====

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_recepcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoint_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para empresas (solo admin puede ver todas)
CREATE POLICY "Admin can view all empresas" ON empresas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Políticas para perfiles (usuarios ven solo su perfil)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para todas las demás tablas (usuarios ven solo datos de su empresa)
CREATE POLICY "Users can view own empresa data" ON facturas_emitidas FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON facturas_recibidas FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON ordenes_compra FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON ordenes_recepcion FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON pagos FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON productos FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON movimientos_stock FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON alertas_stock FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON clientes FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON proveedores FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON oportunidades FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON endpoint_configurations FOR ALL USING (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Users can view own empresa data" ON workflow_logs FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- ===== DATOS INICIALES =====

-- Insertar empresa por defecto
INSERT INTO empresas (id, razon_social, nombre_fantasia, cuit, email, activa) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ContaPYME Default',
  'ContaPYME',
  '20-00000000-0',
  'admin@contapyme.com',
  true
) ON CONFLICT (id) DO NOTHING;

-- ===== ÍNDICES PARA OPTIMIZACIÓN =====

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_empresa_fecha ON facturas_emitidas(empresa_id, fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_recibidas_empresa_fecha ON facturas_recibidas(empresa_id, fecha_factura);
CREATE INDEX IF NOT EXISTS idx_productos_empresa_codigo ON productos(empresa_id, codigo);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto_fecha ON movimientos_stock(producto_id, created_at);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_cuit ON clientes(empresa_id, cuit);
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa_cuit ON proveedores(empresa_id, cuit);

-- ===== LOG DE MIGRACIÓN =====
DO $$
BEGIN
  RAISE NOTICE 'Migración limpia completada exitosamente - ContaPYME v1.0';
END $$;
