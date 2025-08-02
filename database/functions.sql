-- =====================================================
-- CREAR FUNCIONES Y TRIGGERS FALTANTES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. FUNCIONES PARA AUTOMATIZACIÓN
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

-- 2. TRIGGERS PARA AUTOMATIZACIÓN
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

-- 3. VERIFICACIÓN
-- =====================================================

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
-- ¡FUNCIONES Y TRIGGERS CREADOS!
-- ===================================================== 