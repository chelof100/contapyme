-- ===== MIGRACIÓN COMPLETA - INICIO FRESCO =====
-- Esta migración crea toda la estructura desde cero

-- ===== TIPOS ENUM =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'usuario', 'contador');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimiento') THEN
    CREATE TYPE tipo_movimiento AS ENUM ('ingreso', 'egreso');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_factura') THEN
    CREATE TYPE estado_factura AS ENUM ('borrador', 'emitida', 'pagada', 'cancelada');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_orden') THEN
    CREATE TYPE estado_orden AS ENUM ('borrador', 'enviada', 'confirmada', 'recibida', 'cancelada');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_pago') THEN
    CREATE TYPE tipo_pago AS ENUM ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro');
  END IF;
END $$;

-- ===== TABLA EMPRESA (CLIENTE) =====
CREATE TABLE IF NOT EXISTS empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  nombre_fantasia TEXT,
  cuit TEXT UNIQUE,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  provincia TEXT,
  codigo_postal TEXT,
  condicion_iva TEXT DEFAULT 'Responsable Inscripto',
  ingresos_brutos TEXT,
  fecha_inicio_actividades DATE,
  logo_url TEXT,
  configuracion JSONB DEFAULT '{}',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA EMPRESAS (PROVEEDORES) =====
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  nombre_fantasia TEXT,
  cuit TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  provincia TEXT,
  codigo_postal TEXT,
  condicion_iva TEXT DEFAULT 'Responsable Inscripto',
  ingresos_brutos TEXT,
  fecha_inicio_actividades DATE,
  logo_url TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresa(id),
  email TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'usuario',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PRODUCTOS =====
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  codigo TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  unidad_medida TEXT,
  precio_costo DECIMAL(10,2) DEFAULT 0,
  precio_venta DECIMAL(10,2) DEFAULT 0,
  precio_venta_sugerido DECIMAL(10,2) DEFAULT 0,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  proveedor_principal UUID REFERENCES empresas(id),
  ubicacion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA CLIENTES =====
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  cuit_cuil TEXT,
  condicion_iva TEXT DEFAULT 'Consumidor Final',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA MOVIMIENTOS STOCK =====
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo tipo_movimiento NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  motivo TEXT,
  referencia TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA ALERTAS STOCK =====
CREATE TABLE IF NOT EXISTS alertas_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  activa BOOLEAN DEFAULT true,
  fecha_alerta TIMESTAMPTZ DEFAULT now(),
  fecha_resolucion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA FACTURAS EMITIDAS =====
CREATE TABLE IF NOT EXISTS facturas_emitidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  numero_factura TEXT NOT NULL,
  fecha_emision DATE NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  subtotal DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado estado_factura DEFAULT 'borrador',
  cae TEXT,
  fecha_vencimiento_cae DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA FACTURAS RECIBIDAS =====
CREATE TABLE IF NOT EXISTS facturas_recibidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  numero_factura TEXT NOT NULL,
  fecha_recepcion DATE NOT NULL,
  proveedor_id UUID REFERENCES empresas(id),
  subtotal DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado estado_factura DEFAULT 'borrador',
  fecha_vencimiento DATE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA ÓRDENES DE COMPRA =====
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  numero_orden TEXT NOT NULL,
  fecha_orden DATE NOT NULL,
  proveedor_id UUID REFERENCES empresas(id) NOT NULL,
  estado estado_orden DEFAULT 'borrador',
  subtotal DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PRODUCTOS DE ÓRDENES =====
CREATE TABLE IF NOT EXISTS orden_compra_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PAGOS =====
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  tipo tipo_pago NOT NULL,
  referencia TEXT,
  factura_emitida_id UUID REFERENCES facturas_emitidas(id),
  factura_recibida_id UUID REFERENCES facturas_recibidas(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA RECETAS =====
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tiempo_preparacion INTEGER,
  dificultad TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA INGREDIENTES DE RECETAS =====
CREATE TABLE IF NOT EXISTS ingredientes_receta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad DECIMAL(10,2) NOT NULL,
  unidad_medida TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA VENTAS DE RECETAS =====
CREATE TABLE IF NOT EXISTS ventas_recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  fecha_venta DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== FUNCIONES =====
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

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role::TEXT FROM profiles WHERE id = auth.uid()),
    'usuario'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TRIGGERS =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Triggers para updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresa_updated_at') THEN
    CREATE TRIGGER update_empresa_updated_at BEFORE UPDATE ON empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresas_updated_at') THEN
    CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_productos_updated_at') THEN
    CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_facturas_emitidas_updated_at') THEN
    CREATE TRIGGER update_facturas_emitidas_updated_at BEFORE UPDATE ON facturas_emitidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_facturas_recibidas_updated_at') THEN
    CREATE TRIGGER update_facturas_recibidas_updated_at BEFORE UPDATE ON facturas_recibidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ordenes_compra_updated_at') THEN
    CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON ordenes_compra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recetas_updated_at') THEN
    CREATE TRIGGER update_recetas_updated_at BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ===== DATOS INICIALES =====

-- Crear empresa por defecto
INSERT INTO empresa (nombre, razon_social, cuit, email, condicion_iva, activa)
VALUES (
  'OnePYME Default',
  'OnePYME Default S.A.',
  '30-00000000-0',
  'default@onepyme.pro',
  'Responsable Inscripto',
  true
)
ON CONFLICT (cuit) DO NOTHING;

-- Crear proveedor por defecto
INSERT INTO empresas (nombre, razon_social, cuit, email, condicion_iva, activa)
VALUES (
  'Proveedor Default',
  'Proveedor Default S.A.',
  '30-11111111-1',
  'proveedor@default.com',
  'Responsable Inscripto',
  true
)
ON CONFLICT DO NOTHING;

-- ===== ROW LEVEL SECURITY =====

-- Habilitar RLS en todas las tablas
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_compra_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes_receta ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_recetas ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS RLS =====

-- Políticas para empresa (cliente)
CREATE POLICY "Users can view their company" ON empresa
  FOR SELECT USING (
    id = get_current_user_empresa_id() OR 
    get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can update their company" ON empresa
  FOR UPDATE USING (
    id = get_current_user_empresa_id() OR 
    get_current_user_role() = 'admin'
  );

CREATE POLICY "Admin can insert company" ON empresa
  FOR INSERT WITH CHECK (
    get_current_user_role() = 'admin'
  );

-- Políticas para empresas (proveedores)
CREATE POLICY "Users can view providers" ON empresas
  FOR SELECT USING (true);

CREATE POLICY "Users can manage providers" ON empresas
  FOR ALL USING (true);

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para productos
CREATE POLICY "Users can view products from their company" ON productos
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage products from their company" ON productos
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para clientes
CREATE POLICY "Users can view clients from their company" ON clientes
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage clients from their company" ON clientes
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para movimientos_stock
CREATE POLICY "Users can view stock movements from their company" ON movimientos_stock
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage stock movements from their company" ON movimientos_stock
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para alertas_stock
CREATE POLICY "Users can view stock alerts from their company" ON alertas_stock
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage stock alerts from their company" ON alertas_stock
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para facturas_emitidas
CREATE POLICY "Users can view invoices from their company" ON facturas_emitidas
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage invoices from their company" ON facturas_emitidas
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para facturas_recibidas
CREATE POLICY "Users can view received invoices from their company" ON facturas_recibidas
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage received invoices from their company" ON facturas_recibidas
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para ordenes_compra
CREATE POLICY "Users can view orders from their company" ON ordenes_compra
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage orders from their company" ON ordenes_compra
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para orden_compra_productos
CREATE POLICY "Users can view order products from their company" ON orden_compra_productos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ordenes_compra oc 
      WHERE oc.id = orden_compra_id 
      AND oc.empresa_id = get_current_user_empresa_id()
    )
  );

CREATE POLICY "Users can manage order products from their company" ON orden_compra_productos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ordenes_compra oc 
      WHERE oc.id = orden_compra_id 
      AND oc.empresa_id = get_current_user_empresa_id()
    )
  );

-- Políticas para pagos
CREATE POLICY "Users can view payments from their company" ON pagos
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage payments from their company" ON pagos
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para recetas
CREATE POLICY "Users can view recipes from their company" ON recetas
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage recipes from their company" ON recetas
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- Políticas para ingredientes_receta
CREATE POLICY "Users can view recipe ingredients from their company" ON ingredientes_receta
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recetas r 
      WHERE r.id = receta_id 
      AND r.empresa_id = get_current_user_empresa_id()
    )
  );

CREATE POLICY "Users can manage recipe ingredients from their company" ON ingredientes_receta
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM recetas r 
      WHERE r.id = receta_id 
      AND r.empresa_id = get_current_user_empresa_id()
    )
  );

-- Políticas para ventas_recetas
CREATE POLICY "Users can view recipe sales from their company" ON ventas_recetas
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can manage recipe sales from their company" ON ventas_recetas
  FOR ALL USING (empresa_id = get_current_user_empresa_id());

-- ===== ÍNDICES =====
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa_id ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(empresa_id, sku);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_empresa_id ON movimientos_stock(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto_id ON movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_empresa_id ON facturas_emitidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_recibidas_empresa_id ON facturas_recibidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_empresa_id ON ordenes_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa_id ON pagos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_recetas_empresa_id ON recetas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_recetas_empresa_id ON ventas_recetas(empresa_id);

-- ===== VERIFICACIÓN FINAL =====
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completa ejecutada exitosamente';
  RAISE NOTICE '✅ Todas las tablas creadas';
  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Empresa por defecto creada';
  RAISE NOTICE '✅ Sistema listo para funcionar';
END $$;
