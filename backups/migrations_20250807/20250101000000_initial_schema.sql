/*
  # Schema Inicial Consolidado para ContaPYME

  Esta migración contiene todas las tablas base del sistema:
  
  1. Tablas Base
    - `empresas` - Empresas/tenants del sistema
    - `profiles` - Perfiles de usuarios extendidos
    - `user_role` - Enum para roles de usuario

  2. Tablas de Facturación
    - `facturas_emitidas` - Facturas emitidas por la empresa
    - `facturas_recibidas` - Facturas recibidas de proveedores
    - `ordenes_compra` - Órdenes de compra a proveedores
    - `ordenes_recepcion` - Recepciones de mercadería
    - `pagos` - Registro de pagos y cobros

  3. Tablas de Productos y Stock
    - `productos` - Catálogo de productos
    - `movimientos_stock` - Historial de movimientos de stock
    - `alertas_stock` - Alertas de stock bajo
    - `recetas` - Recetas para restaurantes/bares
    - `ingredientes_receta` - Ingredientes de cada receta
    - `ventas_recetas` - Ventas de productos con recetas

  4. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas por empresa para multi-tenancy
    - Funciones auxiliares para obtener empresa del usuario

  5. Triggers
    - Actualización automática de timestamps
    - Validaciones de negocio
    - Alertas automáticas de stock
*/

-- Crear enum para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'usuario', 'contador');

-- Tabla de empresas (multi-tenancy)
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

-- Crear función para obtener empresa del usuario actual
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

-- Crear función para obtener rol del usuario actual
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

-- Tabla de facturas emitidas
CREATE TABLE IF NOT EXISTS facturas_emitidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  numero_factura TEXT NOT NULL,
  punto_venta TEXT NOT NULL DEFAULT '0001',
  tipo_comprobante TEXT NOT NULL,
  cuit_cliente TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  porcentaje_iva DECIMAL(5,2) NOT NULL DEFAULT 0,
  monto_iva DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  descripcion TEXT,
  condicion_iva TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  cae TEXT,
  fecha_vencimiento_cae DATE,
  pdf_url TEXT,
  google_drive_url TEXT,
  google_drive_id TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, numero_factura)
);

-- Tabla de facturas recibidas
CREATE TABLE IF NOT EXISTS facturas_recibidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  numero_factura TEXT NOT NULL,
  cuit_proveedor TEXT NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  monto DECIMAL(15,2) NOT NULL DEFAULT 0,
  orden_compra_id UUID,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  pdf_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  numero_orden TEXT NOT NULL,
  cuit_proveedor TEXT NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_estimada DATE,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'abierta',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, numero_orden)
);

-- Tabla de productos de órdenes de compra
CREATE TABLE IF NOT EXISTS orden_compra_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  precio_unitario DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de órdenes de recepción
CREATE TABLE IF NOT EXISTS ordenes_recepcion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id),
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'parcial',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de productos recibidos
CREATE TABLE IF NOT EXISTS recepcion_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id UUID NOT NULL REFERENCES ordenes_recepcion(id) ON DELETE CASCADE,
  producto_nombre TEXT NOT NULL,
  cantidad_ordenada INTEGER NOT NULL DEFAULT 0,
  cantidad_recibida INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  factura_id UUID,
  numero_factura TEXT,
  tipo_factura TEXT NOT NULL, -- 'emitida' o 'recibida'
  monto DECIMAL(15,2) NOT NULL DEFAULT 0,
  metodo_pago TEXT NOT NULL,
  transaccion_id TEXT,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'confirmado',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida TEXT NOT NULL,
  precio_costo DECIMAL(15,2) DEFAULT 0,
  precio_venta_sugerido DECIMAL(15,2) DEFAULT 0,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER DEFAULT 0,
  categoria TEXT,
  proveedor_principal TEXT,
  ubicacion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, sku)
);

-- Tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  sku TEXT NOT NULL,
  tipo_movimiento TEXT NOT NULL, -- 'ingreso' o 'egreso'
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL DEFAULT 0,
  stock_nuevo INTEGER NOT NULL DEFAULT 0,
  tipo_egreso TEXT, -- solo para egresos
  referencia TEXT, -- número de factura, orden, etc.
  observaciones TEXT,
  usuario_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de alertas de stock
CREATE TABLE IF NOT EXISTS alertas_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  producto_id UUID NOT NULL REFERENCES productos(id),
  sku TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  stock_actual INTEGER NOT NULL,
  stock_minimo INTEGER NOT NULL,
  diferencia INTEGER NOT NULL,
  alerta_enviada BOOLEAN DEFAULT false,
  fecha_alerta DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, producto_id)
);

-- Tabla de recetas (para restaurantes/bares)
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  id_producto_venta_final TEXT NOT NULL,
  nombre_receta TEXT NOT NULL,
  descripcion TEXT,
  precio_venta_sugerido DECIMAL(15,2) DEFAULT 0,
  costo_total DECIMAL(15,2) DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, id_producto_venta_final)
);

-- Tabla de ingredientes de recetas
CREATE TABLE IF NOT EXISTS ingredientes_receta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  sku_ingrediente TEXT NOT NULL,
  cantidad_requerida DECIMAL(10,3) NOT NULL,
  unidad_medida TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de ventas de recetas
CREATE TABLE IF NOT EXISTS ventas_recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  receta_id UUID NOT NULL REFERENCES recetas(id),
  cantidad_vendida INTEGER NOT NULL DEFAULT 1,
  tipo_egreso TEXT NOT NULL,
  fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_factura TEXT,
  cliente TEXT,
  total_venta DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_compra_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_recepcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE recepcion_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes_receta ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_recetas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas
CREATE POLICY "Users can view their own company"
  ON empresas FOR SELECT
  TO authenticated
  USING (id = get_current_user_empresa_id());

CREATE POLICY "Users can update their own company"
  ON empresas FOR UPDATE
  TO authenticated
  USING (id = get_current_user_empresa_id());

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view profiles from their company"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'::user_role AND
    empresa_id = get_current_user_empresa_id()
  );

-- Políticas RLS para facturas emitidas
CREATE POLICY "Users can view facturas from their company"
  ON facturas_emitidas FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert facturas for their company"
  ON facturas_emitidas FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update facturas from their company"
  ON facturas_emitidas FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para facturas recibidas
CREATE POLICY "Users can view facturas recibidas from their company"
  ON facturas_recibidas FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert facturas recibidas for their company"
  ON facturas_recibidas FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update facturas recibidas from their company"
  ON facturas_recibidas FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para órdenes de compra
CREATE POLICY "Users can view ordenes from their company"
  ON ordenes_compra FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert ordenes for their company"
  ON ordenes_compra FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update ordenes from their company"
  ON ordenes_compra FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para productos de órdenes
CREATE POLICY "Users can view orden productos from their company"
  ON orden_compra_productos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_compra oc 
      WHERE oc.id = orden_compra_id 
      AND oc.empresa_id = get_current_user_empresa_id()
    )
  );

CREATE POLICY "Users can insert orden productos for their company"
  ON orden_compra_productos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordenes_compra oc 
      WHERE oc.id = orden_compra_id 
      AND oc.empresa_id = get_current_user_empresa_id()
    )
  );

-- Políticas RLS para recepciones
CREATE POLICY "Users can view recepciones from their company"
  ON ordenes_recepcion FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert recepciones for their company"
  ON ordenes_recepcion FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para productos recibidos
CREATE POLICY "Users can view productos recibidos from their company"
  ON recepcion_productos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_recepcion ore 
      WHERE ore.id = recepcion_id 
      AND ore.empresa_id = get_current_user_empresa_id()
    )
  );

CREATE POLICY "Users can insert productos recibidos for their company"
  ON recepcion_productos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordenes_recepcion ore 
      WHERE ore.id = recepcion_id 
      AND ore.empresa_id = get_current_user_empresa_id()
    )
  );

-- Políticas RLS para pagos
CREATE POLICY "Users can view pagos from their company"
  ON pagos FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert pagos for their company"
  ON pagos FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update pagos from their company"
  ON pagos FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para productos
CREATE POLICY "Users can view productos from their company"
  ON productos FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert productos for their company"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update productos from their company"
  ON productos FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para movimientos de stock
CREATE POLICY "Users can view movimientos from their company"
  ON movimientos_stock FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert movimientos for their company"
  ON movimientos_stock FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para alertas de stock
CREATE POLICY "Users can view alertas from their company"
  ON alertas_stock FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert alertas for their company"
  ON alertas_stock FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update alertas from their company"
  ON alertas_stock FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para recetas
CREATE POLICY "Users can view recetas from their company"
  ON recetas FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert recetas for their company"
  ON recetas FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update recetas from their company"
  ON recetas FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- Políticas RLS para ingredientes de recetas
CREATE POLICY "Users can view ingredientes from their company"
  ON ingredientes_receta FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recetas r 
      WHERE r.id = receta_id 
      AND r.empresa_id = get_current_user_empresa_id()
    )
  );

CREATE POLICY "Users can insert ingredientes for their company"
  ON ingredientes_receta FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recetas r 
      WHERE r.id = receta_id 
      AND r.empresa_id = get_current_user_empresa_id()
    )
  );

-- Políticas RLS para ventas de recetas
CREATE POLICY "Users can view ventas recetas from their company"
  ON ventas_recetas FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert ventas recetas for their company"
  ON ventas_recetas FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_emitidas_updated_at
  BEFORE UPDATE ON facturas_emitidas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_recibidas_updated_at
  BEFORE UPDATE ON facturas_recibidas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_compra_updated_at
  BEFORE UPDATE ON ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_recepcion_updated_at
  BEFORE UPDATE ON ordenes_recepcion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertas_stock_updated_at
  BEFORE UPDATE ON alertas_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recetas_updated_at
  BEFORE UPDATE ON recetas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar alertas de stock automáticamente
CREATE OR REPLACE FUNCTION check_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo para productos con stock_minimo configurado
  IF NEW.stock_minimo IS NOT NULL AND NEW.stock_minimo > 0 THEN
    -- Si el stock actual está por debajo del mínimo
    IF NEW.stock_actual < NEW.stock_minimo THEN
      -- Insertar o actualizar alerta
      INSERT INTO alertas_stock (
        empresa_id,
        producto_id,
        sku,
        descripcion,
        stock_actual,
        stock_minimo,
        diferencia,
        alerta_enviada
      ) VALUES (
        NEW.empresa_id,
        NEW.id,
        NEW.sku,
        NEW.nombre,
        NEW.stock_actual,
        NEW.stock_minimo,
        NEW.stock_minimo - NEW.stock_actual,
        false
      )
      ON CONFLICT (empresa_id, producto_id) 
      DO UPDATE SET
        stock_actual = NEW.stock_actual,
        diferencia = NEW.stock_minimo - NEW.stock_actual,
        alerta_enviada = false,
        updated_at = now();
    ELSE
      -- Si el stock está OK, eliminar alerta si existe
      DELETE FROM alertas_stock 
      WHERE empresa_id = NEW.empresa_id AND producto_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alertas automáticas de stock
CREATE TRIGGER productos_stock_alert_trigger
  AFTER INSERT OR UPDATE OF stock_actual, stock_minimo ON productos
  FOR EACH ROW EXECUTE FUNCTION check_stock_alert();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_empresa_fecha ON facturas_emitidas(empresa_id, fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_recibidas_empresa_fecha ON facturas_recibidas(empresa_id, fecha_recepcion);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_empresa_estado ON ordenes_compra(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa_fecha ON pagos(empresa_id, fecha_pago);
CREATE INDEX IF NOT EXISTS idx_productos_empresa_sku ON productos(empresa_id, sku);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_empresa_fecha ON movimientos_stock(empresa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_alertas_stock_empresa_activa ON alertas_stock(empresa_id, alerta_enviada);
CREATE INDEX IF NOT EXISTS idx_recetas_empresa_activa ON recetas(empresa_id, activa); 