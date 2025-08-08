/*
  # Migración Final - Esquema Limpio y Unificado - ContaPYME
  
  Esta migración contiene el esquema final y limpio de la base de datos
  después de todas las correcciones y verificaciones realizadas.
*/

-- ===== TIPOS ENUMERADOS =====

-- Crear tipos si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'contador', 'usuario');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimiento') THEN
    CREATE TYPE tipo_movimiento AS ENUM ('ingreso', 'egreso', 'ajuste');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_factura') THEN
    CREATE TYPE estado_factura AS ENUM ('borrador', 'emitida', 'pagada', 'anulada');
  END IF;
END $$;

-- ===== TABLA EMPRESAS =====
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rut TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  sector TEXT,
  tipo_empresa TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  razon_social TEXT,
  nombre_fantasia TEXT,
  cuit TEXT,
  domicilio TEXT,
  condicion_iva TEXT DEFAULT 'Responsable Inscripto',
  logo_url TEXT,
  configuracion JSONB DEFAULT '{}',
  activa BOOLEAN DEFAULT true
);

-- ===== TABLA PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'usuario',
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PRODUCTOS =====
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  sku TEXT NOT NULL,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_costo DECIMAL(10,2) DEFAULT 0,
  precio_venta_sugerido DECIMAL(10,2) DEFAULT 0,
  precio_compra DECIMAL(10,2) DEFAULT 0,
  precio_venta DECIMAL(10,2) DEFAULT 0,
  stock_actual INTEGER DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  categoria TEXT,
  proveedor_principal TEXT,
  ubicacion TEXT,
  unidad_medida TEXT DEFAULT 'unidad',
  activo BOOLEAN DEFAULT true,
  codigo_barras VARCHAR(50),
  imagen_url TEXT,
  peso_kg DECIMAL(8,3),
  volumen_l DECIMAL(8,3),
  fecha_vencimiento DATE,
  numero_lote VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, sku),
  UNIQUE(empresa_id, codigo)
);

-- ===== TABLA CLIENTES =====
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
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

-- ===== TABLA PROVEEDORES =====
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  razon_social TEXT NOT NULL,
  cuit TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA MOVIMIENTOS STOCK =====
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  sku TEXT NOT NULL,
  tipo_movimiento tipo_movimiento NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  tipo_egreso TEXT,
  referencia TEXT,
  observaciones TEXT,
  usuario_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA FACTURAS EMITIDAS =====
CREATE TABLE IF NOT EXISTS facturas_emitidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  numero_factura TEXT NOT NULL,
  punto_venta TEXT NOT NULL,
  tipo_comprobante TEXT NOT NULL,
  fecha_emision DATE NOT NULL,
  cuit_cliente TEXT NOT NULL,
  nombre_cliente TEXT NOT NULL,
  email_cliente TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  iva DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  condicion_iva TEXT NOT NULL,
  estado estado_factura DEFAULT 'borrador',
  afip_cae TEXT,
  afip_vto_cae DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, numero_factura)
);

-- ===== TABLA FACTURA PRODUCTOS =====
CREATE TABLE IF NOT EXISTS factura_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  factura_id UUID REFERENCES facturas_emitidas(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES productos(id),
  sku TEXT NOT NULL,
  nombre_producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA PAGOS =====
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  factura_id UUID REFERENCES facturas_emitidas(id) ON DELETE CASCADE NOT NULL,
  numero_factura TEXT NOT NULL,
  tipo_factura TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL,
  transaccion_id TEXT,
  fecha_pago DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA ORDENES COMPRA =====
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  numero_orden TEXT NOT NULL,
  cuit_proveedor TEXT NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  fecha_orden DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, numero_orden)
);

-- ===== TABLA RECETAS =====
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  id_producto_venta_final TEXT NOT NULL,
  nombre_receta TEXT NOT NULL,
  descripcion TEXT,
  precio_venta_sugerido DECIMAL(10,2) DEFAULT 0,
  costo_total DECIMAL(10,2) DEFAULT 0,
  ingredientes JSONB,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABLA ALERTAS STOCK =====
CREATE TABLE IF NOT EXISTS alertas_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  sku TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  stock_actual INTEGER NOT NULL,
  stock_minimo INTEGER NOT NULL,
  diferencia INTEGER NOT NULL,
  alerta_enviada BOOLEAN DEFAULT false,
  fecha_alerta TIMESTAMPTZ DEFAULT now()
);

-- ===== FUNCIONES AUXILIARES =====

-- Función para obtener empresa_id del usuario actual
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

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGERS =====

-- Triggers para updated_at
DO $$
BEGIN
  -- Crear triggers solo si no existen
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresas_updated_at') THEN
    CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_productos_updated_at') THEN
    CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_proveedores_updated_at') THEN
    CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_facturas_emitidas_updated_at') THEN
    CREATE TRIGGER update_facturas_emitidas_updated_at BEFORE UPDATE ON facturas_emitidas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_factura_productos_updated_at') THEN
    CREATE TRIGGER update_factura_productos_updated_at BEFORE UPDATE ON factura_productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ordenes_compra_updated_at') THEN
    CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON ordenes_compra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_recetas_updated_at') THEN
    CREATE TRIGGER update_recetas_updated_at BEFORE UPDATE ON recetas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ===== ROW LEVEL SECURITY =====

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_stock ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$
BEGIN
  -- Crear políticas solo si no existen
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'empresas' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON empresas FOR ALL USING (id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON profiles FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'productos' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON productos FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clientes' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON clientes FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proveedores' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON proveedores FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'movimientos_stock' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON movimientos_stock FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'facturas_emitidas' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON facturas_emitidas FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factura_productos' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON factura_productos FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagos' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON pagos FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ordenes_compra' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON ordenes_compra FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recetas' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON recetas FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alertas_stock' AND policyname = 'Users can view own empresa data') THEN
    CREATE POLICY "Users can view own empresa data" ON alertas_stock FOR ALL USING (empresa_id = get_current_user_empresa_id());
  END IF;
END $$;

-- ===== ÍNDICES =====

-- Índices para optimización
DO $$
BEGIN
  -- Crear índices solo si no existen
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_productos_empresa_id') THEN
    CREATE INDEX idx_productos_empresa_id ON productos(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_productos_sku') THEN
    CREATE INDEX idx_productos_sku ON productos(empresa_id, sku);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_productos_codigo') THEN
    CREATE INDEX idx_productos_codigo ON productos(empresa_id, codigo);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clientes_empresa_id') THEN
    CREATE INDEX idx_clientes_empresa_id ON clientes(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_proveedores_empresa_id') THEN
    CREATE INDEX idx_proveedores_empresa_id ON proveedores(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_stock_empresa_id') THEN
    CREATE INDEX idx_movimientos_stock_empresa_id ON movimientos_stock(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_stock_producto_id') THEN
    CREATE INDEX idx_movimientos_stock_producto_id ON movimientos_stock(producto_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_facturas_emitidas_empresa_id') THEN
    CREATE INDEX idx_facturas_emitidas_empresa_id ON facturas_emitidas(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_factura_productos_empresa_id') THEN
    CREATE INDEX idx_factura_productos_empresa_id ON factura_productos(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_factura_productos_factura_id') THEN
    CREATE INDEX idx_factura_productos_factura_id ON factura_productos(factura_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pagos_empresa_id') THEN
    CREATE INDEX idx_pagos_empresa_id ON pagos(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ordenes_compra_empresa_id') THEN
    CREATE INDEX idx_ordenes_compra_empresa_id ON ordenes_compra(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recetas_empresa_id') THEN
    CREATE INDEX idx_recetas_empresa_id ON recetas(empresa_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alertas_stock_empresa_id') THEN
    CREATE INDEX idx_alertas_stock_empresa_id ON alertas_stock(empresa_id);
  END IF;
END $$;

-- ===== DATOS INICIALES =====

-- Insertar empresa por defecto si no existe
INSERT INTO empresas (id, nombre, razon_social, nombre_fantasia, cuit, email, condicion_iva, activa) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ContaPYME',
  'ContaPYME Default',
  'ContaPYME',
  '20-00000000-0',
  'admin@contapyme.com',
  'Responsable Inscripto',
  true
) ON CONFLICT (id) DO NOTHING;

-- ===== LOG FINAL =====
DO $$
BEGIN
  RAISE NOTICE '=== ESQUEMA FINAL CREADO ===';
  RAISE NOTICE '✅ Todas las tablas, funciones, triggers y políticas han sido creadas';
  RAISE NOTICE '✅ La base de datos está lista para funcionar correctamente';
END $$;
