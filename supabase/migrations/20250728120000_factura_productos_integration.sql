/*
  # Integración de Productos en Facturas
  
  Esta migración agrega el soporte completo para productos en facturas emitidas,
  incluyendo la tabla factura_productos y modificaciones necesarias.
  
  Cambios:
  1. Nueva tabla factura_productos para almacenar productos de cada factura
  2. Modificación de tabla productos para agregar campo nombre
  3. Triggers para automatizar cálculos y validaciones
  4. Funciones auxiliares para el manejo de productos en facturas
*/

-- Agregar campo nombre a la tabla productos si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'productos' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE productos ADD COLUMN nombre TEXT;
    
    -- Actualizar registros existentes usando descripcion como nombre
    UPDATE productos SET nombre = descripcion WHERE nombre IS NULL;
    
    -- Hacer el campo obligatorio después de la migración
    ALTER TABLE productos ALTER COLUMN nombre SET NOT NULL;
  END IF;
END $$;

-- Tabla para almacenar productos de cada factura emitida
CREATE TABLE IF NOT EXISTS factura_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES facturas_emitidas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  producto_id UUID REFERENCES productos(id),
  sku TEXT NOT NULL,
  nombre_producto TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  descripcion TEXT, -- Descripción específica del producto en esta factura
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_factura_productos_factura_id ON factura_productos(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_productos_empresa_id ON factura_productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_factura_productos_producto_id ON factura_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_factura_productos_sku ON factura_productos(sku);

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
  -- Obtener subtotal de productos
  subtotal_factura := calcular_subtotal_factura(factura_uuid);
  
  -- Obtener porcentaje IVA de la factura
  SELECT porcentaje_iva INTO porcentaje_iva_factura
  FROM facturas_emitidas
  WHERE id = factura_uuid;
  
  -- Calcular IVA y total
  monto_iva_factura := subtotal_factura * (porcentaje_iva_factura / 100);
  total_factura := subtotal_factura + monto_iva_factura;
  
  -- Actualizar factura
  UPDATE facturas_emitidas
  SET 
    subtotal = subtotal_factura,
    monto_iva = monto_iva_factura,
    total = total_factura,
    updated_at = now()
  WHERE id = factura_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar totales cuando se modifican productos de factura
CREATE OR REPLACE FUNCTION trigger_actualizar_totales_factura()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar totales de la factura
  PERFORM actualizar_totales_factura(COALESCE(NEW.factura_id, OLD.factura_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para INSERT, UPDATE, DELETE en factura_productos
DROP TRIGGER IF EXISTS tr_factura_productos_totales ON factura_productos;
CREATE TRIGGER tr_factura_productos_totales
  AFTER INSERT OR UPDATE OR DELETE ON factura_productos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_totales_factura();

-- Función para validar stock antes de agregar producto a factura
CREATE OR REPLACE FUNCTION validar_stock_producto(
  p_producto_id UUID,
  p_cantidad INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  stock_disponible INTEGER;
BEGIN
  SELECT stock_actual INTO stock_disponible
  FROM productos
  WHERE id = p_producto_id;
  
  RETURN COALESCE(stock_disponible, 0) >= p_cantidad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para procesar venta de productos (actualizar stock)
CREATE OR REPLACE FUNCTION procesar_venta_productos(factura_uuid UUID)
RETURNS VOID AS $$
DECLARE
  producto_record RECORD;
  nuevo_stock INTEGER;
BEGIN
  -- Procesar cada producto de la factura
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
    -- Solo procesar si el producto existe en el catálogo
    IF producto_record.producto_id IS NOT NULL THEN
      -- Calcular nuevo stock
      nuevo_stock := producto_record.stock_actual - producto_record.cantidad;
      
      -- Actualizar stock del producto
      UPDATE productos
      SET 
        stock_actual = nuevo_stock,
        updated_at = now()
      WHERE id = producto_record.producto_id;
      
      -- Registrar movimiento de stock
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

-- Trigger para procesar venta cuando se confirma una factura
CREATE OR REPLACE FUNCTION trigger_procesar_venta_factura()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si el estado cambió a 'confirmada' o 'pagada'
  IF NEW.estado IN ('confirmada', 'pagada') AND OLD.estado NOT IN ('confirmada', 'pagada') THEN
    PERFORM procesar_venta_productos(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para cambios de estado en facturas_emitidas
DROP TRIGGER IF EXISTS tr_facturas_emitidas_procesar_venta ON facturas_emitidas;
CREATE TRIGGER tr_facturas_emitidas_procesar_venta
  AFTER UPDATE ON facturas_emitidas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_procesar_venta_factura();

-- Habilitar RLS en la nueva tabla
ALTER TABLE factura_productos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para factura_productos
CREATE POLICY "Usuarios pueden ver productos de facturas de su empresa" ON factura_productos
  FOR SELECT USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Usuarios pueden insertar productos en facturas de su empresa" ON factura_productos
  FOR INSERT WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Usuarios pueden actualizar productos de facturas de su empresa" ON factura_productos
  FOR UPDATE USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Usuarios pueden eliminar productos de facturas de su empresa" ON factura_productos
  FOR DELETE USING (empresa_id = get_current_user_empresa_id());

-- Función para obtener productos de una factura
CREATE OR REPLACE FUNCTION obtener_productos_factura(factura_uuid UUID)
RETURNS TABLE (
  id UUID,
  sku TEXT,
  nombre_producto TEXT,
  cantidad INTEGER,
  precio_unitario DECIMAL(15,2),
  subtotal DECIMAL(15,2),
  descripcion TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.sku,
    fp.nombre_producto,
    fp.cantidad,
    fp.precio_unitario,
    fp.subtotal,
    fp.descripcion
  FROM factura_productos fp
  WHERE fp.factura_id = factura_uuid
  ORDER BY fp.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar producto a factura
CREATE OR REPLACE FUNCTION agregar_producto_factura(
  p_factura_id UUID,
  p_sku TEXT,
  p_nombre_producto TEXT,
  p_cantidad INTEGER,
  p_precio_unitario DECIMAL(15,2),
  p_descripcion TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  producto_id UUID;
  subtotal_producto DECIMAL(15,2);
  nuevo_id UUID;
BEGIN
  -- Buscar producto por SKU
  SELECT id INTO producto_id
  FROM productos
  WHERE sku = p_sku AND empresa_id = get_current_user_empresa_id();
  
  -- Calcular subtotal
  subtotal_producto := p_cantidad * p_precio_unitario;
  
  -- Insertar producto en factura
  INSERT INTO factura_productos (
    factura_id,
    empresa_id,
    producto_id,
    sku,
    nombre_producto,
    cantidad,
    precio_unitario,
    subtotal,
    descripcion
  ) VALUES (
    p_factura_id,
    get_current_user_empresa_id(),
    producto_id,
    p_sku,
    p_nombre_producto,
    p_cantidad,
    p_precio_unitario,
    subtotal_producto,
    p_descripcion
  ) RETURNING id INTO nuevo_id;
  
  RETURN nuevo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE factura_productos IS 'Almacena los productos de cada factura emitida';
COMMENT ON COLUMN factura_productos.descripcion IS 'Descripción específica del producto en esta factura (opcional)';
COMMENT ON FUNCTION procesar_venta_productos IS 'Procesa la venta de productos actualizando stock y registrando movimientos';
COMMENT ON FUNCTION actualizar_totales_factura IS 'Actualiza automáticamente los totales de una factura basado en sus productos'; 