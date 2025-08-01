-- =====================================================
-- MIGRACIÓN COMPLETA - TODAS LAS TABLAS Y FUNCIONALIDADES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 0. CREAR TABLA FACTURA_PRODUCTOS (si no existe)
-- =====================================================
CREATE TABLE IF NOT EXISTS factura_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id UUID NOT NULL REFERENCES facturas_emitidas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  nombre_producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(15,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(15,2) NOT NULL CHECK (subtotal >= 0),
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_factura_productos_factura_id ON factura_productos(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_productos_producto_id ON factura_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_factura_productos_empresa_id ON factura_productos(empresa_id);

-- Habilitar RLS
ALTER TABLE factura_productos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para factura_productos
DROP POLICY IF EXISTS "Usuarios pueden ver productos de facturas de su empresa" ON factura_productos;
CREATE POLICY "Usuarios pueden ver productos de facturas de su empresa" ON factura_productos
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden insertar productos en facturas de su empresa" ON factura_productos;
CREATE POLICY "Usuarios pueden insertar productos en facturas de su empresa" ON factura_productos
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden actualizar productos de facturas de su empresa" ON factura_productos;
CREATE POLICY "Usuarios pueden actualizar productos de facturas de su empresa" ON factura_productos
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden eliminar productos de facturas de su empresa" ON factura_productos;
CREATE POLICY "Usuarios pueden eliminar productos de facturas de su empresa" ON factura_productos
  FOR DELETE USING (empresa_id = get_current_user_empresa_id());

-- 1. AGREGAR CAMPO NOMBRE A PRODUCTOS
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE productos ADD COLUMN nombre TEXT;
    UPDATE productos SET nombre = descripcion WHERE nombre IS NULL;
    ALTER TABLE productos ALTER COLUMN nombre SET NOT NULL;
    RAISE NOTICE 'Campo nombre agregado a tabla productos';
  ELSE
    RAISE NOTICE 'Campo nombre ya existe en tabla productos';
  END IF;
END $$;

-- 2. AGREGAR CAMPO CODIGO_BARRAS A PRODUCTOS
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'codigo_barras'
  ) THEN
    ALTER TABLE productos ADD COLUMN codigo_barras VARCHAR(50);
    CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
    RAISE NOTICE 'Campo codigo_barras agregado a tabla productos';
  ELSE
    RAISE NOTICE 'Campo codigo_barras ya existe en tabla productos';
  END IF;
END $$;

-- 3. AGREGAR CAMPOS ADICIONALES A PRODUCTOS
-- =====================================================
DO $$ 
BEGIN
  -- Campo para imagen del producto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'imagen_url'
  ) THEN
    ALTER TABLE productos ADD COLUMN imagen_url TEXT;
    RAISE NOTICE 'Campo imagen_url agregado a tabla productos';
  END IF;

  -- Campo para peso/dimensiones
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'peso_kg'
  ) THEN
    ALTER TABLE productos ADD COLUMN peso_kg DECIMAL(10,3);
    RAISE NOTICE 'Campo peso_kg agregado a tabla productos';
  END IF;

  -- Campo para volumen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'volumen_l'
  ) THEN
    ALTER TABLE productos ADD COLUMN volumen_l DECIMAL(10,3);
    RAISE NOTICE 'Campo volumen_l agregado a tabla productos';
  END IF;

  -- Campo para fecha de vencimiento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'fecha_vencimiento'
  ) THEN
    ALTER TABLE productos ADD COLUMN fecha_vencimiento DATE;
    RAISE NOTICE 'Campo fecha_vencimiento agregado a tabla productos';
  END IF;

  -- Campo para lote
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'numero_lote'
  ) THEN
    ALTER TABLE productos ADD COLUMN numero_lote VARCHAR(50);
    RAISE NOTICE 'Campo numero_lote agregado a tabla productos';
  END IF;
END $$;

-- 4. CREAR TABLA DE HISTORIAL DE PRECIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS historial_precios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo_precio TEXT NOT NULL CHECK (tipo_precio IN ('costo', 'venta')),
  precio_anterior DECIMAL(15,2),
  precio_nuevo DECIMAL(15,2) NOT NULL,
  fecha_cambio DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo_cambio TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE historial_precios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para historial_precios
DROP POLICY IF EXISTS "Usuarios pueden ver historial de precios de su empresa" ON historial_precios;
CREATE POLICY "Usuarios pueden ver historial de precios de su empresa" ON historial_precios
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden insertar historial de precios de su empresa" ON historial_precios;
CREATE POLICY "Usuarios pueden insertar historial de precios de su empresa" ON historial_precios
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

-- 5. CREAR TABLA DE PROVEEDORES
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  cuit VARCHAR(20) NOT NULL,
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  contacto_principal TEXT,
  condicion_iva TEXT,
  activo BOOLEAN DEFAULT true,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(empresa_id, cuit)
);

-- Habilitar RLS
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proveedores
DROP POLICY IF EXISTS "Usuarios pueden ver proveedores de su empresa" ON proveedores;
CREATE POLICY "Usuarios pueden ver proveedores de su empresa" ON proveedores
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden insertar proveedores de su empresa" ON proveedores;
CREATE POLICY "Usuarios pueden insertar proveedores de su empresa" ON proveedores
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden actualizar proveedores de su empresa" ON proveedores;
CREATE POLICY "Usuarios pueden actualizar proveedores de su empresa" ON proveedores
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

-- 6. CREAR TABLA DE CLIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  cuit VARCHAR(20),
  razon_social TEXT NOT NULL,
  nombre_fantasia TEXT,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  contacto_principal TEXT,
  condicion_iva TEXT,
  limite_credito DECIMAL(15,2) DEFAULT 0,
  saldo_actual DECIMAL(15,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
DROP POLICY IF EXISTS "Usuarios pueden ver clientes de su empresa" ON clientes;
CREATE POLICY "Usuarios pueden ver clientes de su empresa" ON clientes
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden insertar clientes de su empresa" ON clientes;
CREATE POLICY "Usuarios pueden insertar clientes de su empresa" ON clientes
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden actualizar clientes de su empresa" ON clientes;
CREATE POLICY "Usuarios pueden actualizar clientes de su empresa" ON clientes
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

-- 7. CREAR TABLA DE CATEGORÍAS
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria_padre_id UUID REFERENCES categorias(id),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(empresa_id, nombre)
);

-- Habilitar RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorías
DROP POLICY IF EXISTS "Usuarios pueden ver categorías de su empresa" ON categorias;
CREATE POLICY "Usuarios pueden ver categorías de su empresa" ON categorias
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden insertar categorías de su empresa" ON categorias;
CREATE POLICY "Usuarios pueden insertar categorías de su empresa" ON categorias
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

DROP POLICY IF EXISTS "Usuarios pueden actualizar categorías de su empresa" ON categorias;
CREATE POLICY "Usuarios pueden actualizar categorías de su empresa" ON categorias
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

-- 8. FUNCIONES PARA AUTOMATIZACIÓN
-- =====================================================

-- Función para calcular subtotal de factura desde productos
CREATE OR REPLACE FUNCTION calcular_subtotal_factura(factura_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  subtotal_calculado DECIMAL(15,2) := 0;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0)
  INTO subtotal_calculado
  FROM factura_productos
  WHERE factura_id = factura_uuid;
  
  RETURN subtotal_calculado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar totales de factura
CREATE OR REPLACE FUNCTION actualizar_totales_factura(factura_uuid UUID)
RETURNS VOID AS $$
DECLARE
  subtotal_factura DECIMAL(15,2);
  porcentaje_iva_factura DECIMAL(5,2);
  monto_iva_factura DECIMAL(15,2);
  total_factura DECIMAL(15,2);
BEGIN
  subtotal_factura := calcular_subtotal_factura(factura_uuid);
  
  SELECT porcentaje_iva INTO porcentaje_iva_factura
  FROM facturas_emitidas
  WHERE id = factura_uuid;
  
  monto_iva_factura := subtotal_factura * (porcentaje_iva_factura / 100);
  total_factura := subtotal_factura + monto_iva_factura;
  
  UPDATE facturas_emitidas
  SET 
    subtotal = subtotal_factura,
    monto_iva = monto_iva_factura,
    total = total_factura,
    updated_at = now()
  WHERE id = factura_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para procesar venta de productos (actualizar stock)
CREATE OR REPLACE FUNCTION procesar_venta_productos(factura_uuid UUID)
RETURNS VOID AS $$
DECLARE
  producto_record RECORD;
  nuevo_stock INTEGER;
BEGIN
  FOR producto_record IN 
    SELECT 
      fp.producto_id,
      fp.sku,
      fp.cantidad,
      p.stock_actual,
      p.nombre
    FROM factura_productos fp
    LEFT JOIN productos p ON fp.producto_id = p.id
    WHERE fp.factura_id = factura_uuid
  LOOP
    IF producto_record.producto_id IS NOT NULL THEN
      nuevo_stock := producto_record.stock_actual - producto_record.cantidad;
      
      UPDATE productos
      SET 
        stock_actual = nuevo_stock,
        updated_at = now()
      WHERE id = producto_record.producto_id;
      
      INSERT INTO movimientos_stock (
        empresa_id,
        producto_id,
        sku,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        tipo_egreso,
        referencia,
        observaciones,
        usuario_id
      ) VALUES (
        get_current_user_empresa_id(),
        producto_record.producto_id,
        producto_record.sku,
        'egreso',
        producto_record.cantidad,
        producto_record.stock_actual,
        nuevo_stock,
        'venta_facturada',
        (SELECT numero_factura FROM facturas_emitidas WHERE id = factura_uuid),
        'Venta facturada - ' || producto_record.nombre,
        auth.uid()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar cambio de precio
CREATE OR REPLACE FUNCTION registrar_cambio_precio(
  p_producto_id UUID,
  p_tipo_precio TEXT,
  p_precio_anterior DECIMAL(15,2),
  p_precio_nuevo DECIMAL(15,2),
  p_motivo_cambio TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO historial_precios (
    empresa_id,
    producto_id,
    tipo_precio,
    precio_anterior,
    precio_nuevo,
    motivo_cambio,
    usuario_id
  ) VALUES (
    get_current_user_empresa_id(),
    p_producto_id,
    p_tipo_precio,
    p_precio_anterior,
    p_precio_nuevo,
    p_motivo_cambio,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Trigger para actualizar totales cuando se modifican productos de factura
CREATE OR REPLACE FUNCTION trigger_actualizar_totales_factura()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM actualizar_totales_factura(COALESCE(NEW.factura_id, OLD.factura_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_factura_productos_totales ON factura_productos;
CREATE TRIGGER tr_factura_productos_totales
  AFTER INSERT OR UPDATE OR DELETE ON factura_productos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_totales_factura();

-- Trigger para procesar venta cuando se confirma una factura
CREATE OR REPLACE FUNCTION trigger_procesar_venta_factura()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IN ('confirmada', 'pagada') AND OLD.estado NOT IN ('confirmada', 'pagada') THEN
    PERFORM procesar_venta_productos(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_facturas_emitidas_procesar_venta ON facturas_emitidas;
CREATE TRIGGER tr_facturas_emitidas_procesar_venta
  AFTER UPDATE ON facturas_emitidas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_procesar_venta_factura();

-- Trigger para registrar cambios de precio
CREATE OR REPLACE FUNCTION trigger_registrar_cambio_precio()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar cambio de precio de costo
  IF OLD.precio_costo IS DISTINCT FROM NEW.precio_costo THEN
    PERFORM registrar_cambio_precio(
      NEW.id,
      'costo',
      OLD.precio_costo,
      NEW.precio_costo,
      'Actualización automática'
    );
  END IF;

  -- Registrar cambio de precio de venta
  IF OLD.precio_venta_sugerido IS DISTINCT FROM NEW.precio_venta_sugerido THEN
    PERFORM registrar_cambio_precio(
      NEW.id,
      'venta',
      OLD.precio_venta_sugerido,
      NEW.precio_venta_sugerido,
      'Actualización automática'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_productos_cambio_precio ON productos;
CREATE TRIGGER tr_productos_cambio_precio
  AFTER UPDATE OF precio_costo, precio_venta_sugerido ON productos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_registrar_cambio_precio();

-- 10. VERIFICACIÓN
-- =====================================================

-- Verificar que la tabla factura_productos existe
SELECT 'Tabla factura_productos creada correctamente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'factura_productos'
);

-- Verificar que el campo nombre existe en productos
SELECT 'Campo nombre agregado a productos correctamente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'productos' AND column_name = 'nombre'
);

-- Verificar que el campo codigo_barras existe en productos
SELECT 'Campo codigo_barras agregado a productos correctamente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'productos' AND column_name = 'codigo_barras'
);

-- Verificar que las funciones se crearon
SELECT 'Funciones creadas correctamente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name IN ('calcular_subtotal_factura', 'actualizar_totales_factura', 'procesar_venta_productos', 'registrar_cambio_precio')
);

-- Verificar que los triggers se crearon
SELECT 'Triggers creados correctamente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.triggers 
  WHERE trigger_name IN ('tr_factura_productos_totales', 'tr_facturas_emitidas_procesar_venta', 'tr_productos_cambio_precio')
);

-- =====================================================
-- ¡MIGRACIÓN COMPLETADA!
-- ===================================================== 