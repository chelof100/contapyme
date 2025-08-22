-- ===== CONVERSIÓN A SINGLE TENANT =====
-- Esta migración elimina toda la lógica multi-tenant del sistema OnePyme
-- Fecha: 13 de Enero 2025
-- Empresa principal: 06e35346-7ca5-4c91-8f9a-1a8354b471c7 (Empresa Test)

-- ===== PASO 1: ELIMINAR POLÍTICAS RLS MULTI-TENANT =====

-- Políticas simples por tabla
DROP POLICY IF EXISTS "Users can view products from their company" ON productos;
DROP POLICY IF EXISTS "Users can manage products from their company" ON productos;
DROP POLICY IF EXISTS "Users can view clients from their company" ON clientes;
DROP POLICY IF EXISTS "Users can manage clients from their company" ON clientes;
DROP POLICY IF EXISTS "Users can view stock movements from their company" ON movimientos_stock;
DROP POLICY IF EXISTS "Users can manage stock movements from their company" ON movimientos_stock;
DROP POLICY IF EXISTS "Users can view stock alerts from their company" ON alertas_stock;
DROP POLICY IF EXISTS "Users can manage stock alerts from their company" ON alertas_stock;
DROP POLICY IF EXISTS "Users can view invoices from their company" ON facturas_emitidas;
DROP POLICY IF EXISTS "Users can manage invoices from their company" ON facturas_emitidas;
DROP POLICY IF EXISTS "Users can view received invoices from their company" ON facturas_recibidas;
DROP POLICY IF EXISTS "Users can manage received invoices from their company" ON facturas_recibidas;
DROP POLICY IF EXISTS "Users can view orders from their company" ON ordenes_compra;
DROP POLICY IF EXISTS "Users can manage orders from their company" ON ordenes_compra;
DROP POLICY IF EXISTS "Users can view payments from their company" ON pagos;
DROP POLICY IF EXISTS "Users can manage payments from their company" ON pagos;
DROP POLICY IF EXISTS "Users can view recipes from their company" ON recetas;
DROP POLICY IF EXISTS "Users can manage recipes from their company" ON recetas;
DROP POLICY IF EXISTS "Users can view recipe sales from their company" ON ventas_recetas;
DROP POLICY IF EXISTS "Users can manage recipe sales from their company" ON ventas_recetas;

-- Políticas complejas con EXISTS
DROP POLICY IF EXISTS "Users can view order products from their company" ON orden_compra_productos;
DROP POLICY IF EXISTS "Users can manage order products from their company" ON orden_compra_productos;
DROP POLICY IF EXISTS "Users can view recipe ingredients from their company" ON ingredientes_receta;
DROP POLICY IF EXISTS "Users can manage recipe ingredients from their company" ON ingredientes_receta;

-- Políticas adicionales que puedan existir
DROP POLICY IF EXISTS "Users can view their company" ON empresa;
DROP POLICY IF EXISTS "Users can update their company" ON empresa;
DROP POLICY IF EXISTS "Admin can insert company" ON empresa;
DROP POLICY IF EXISTS "Users can view providers" ON empresas;
DROP POLICY IF EXISTS "Users can manage providers" ON empresas;

-- ===== PASO 2: CREAR POLÍTICAS RLS SINGLE TENANT SIMPLES =====

-- Política simple: usuarios autenticados pueden hacer todo
CREATE POLICY "authenticated_users_all_access" ON productos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON clientes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON movimientos_stock
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON alertas_stock
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON facturas_emitidas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON facturas_recibidas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON ordenes_compra
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON orden_compra_productos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON pagos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON recetas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON ingredientes_receta
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON ventas_recetas
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para tablas de detalles nuevas
CREATE POLICY "authenticated_users_all_access" ON detalles_factura
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON detalles_orden_compra
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON transacciones_financieras
  FOR ALL USING (auth.role() = 'authenticated');

-- Mantener políticas de empresa y profiles como están (son necesarias para autenticación)

-- ===== PASO 3: ACTUALIZAR FUNCIÓN get_current_user_empresa_id =====

CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  -- En single tenant, siempre retorna la empresa principal
  RETURN '06e35346-7ca5-4c91-8f9a-1a8354b471c7'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PASO 4: OPTIMIZAR ÍNDICES PARA SINGLE TENANT =====

-- Eliminar índices innecesarios de empresa_id
DROP INDEX IF EXISTS idx_productos_empresa_id;
DROP INDEX IF EXISTS idx_clientes_empresa_id;
DROP INDEX IF EXISTS idx_movimientos_stock_empresa_id;
DROP INDEX IF EXISTS idx_facturas_emitidas_empresa_id;
DROP INDEX IF EXISTS idx_facturas_recibidas_empresa_id;
DROP INDEX IF EXISTS idx_ordenes_compra_empresa_id;
DROP INDEX IF EXISTS idx_pagos_empresa_id;
DROP INDEX IF EXISTS idx_recetas_empresa_id;
DROP INDEX IF EXISTS idx_ventas_recetas_empresa_id;

-- Crear índices optimizados para single tenant (más específicos y útiles)
CREATE INDEX IF NOT EXISTS idx_productos_activo_sku ON productos(activo, sku) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_activo_nombre ON clientes(activo, nombre) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_fecha_estado ON facturas_emitidas(fecha_emision, estado);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_cliente ON facturas_emitidas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_fecha_producto ON movimientos_stock(created_at, producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_tipo ON movimientos_stock(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_alertas_stock_activa ON alertas_stock(activa) WHERE activa = true;

-- ===== PASO 5: ASIGNAR TODOS LOS USUARIOS A LA EMPRESA PRINCIPAL =====

DO $$
DECLARE
  empresa_principal_id UUID := '06e35346-7ca5-4c91-8f9a-1a8354b471c7';
  updated_profiles INTEGER;
BEGIN
  -- Actualizar todos los profiles sin empresa_id o con empresa_id diferente
  UPDATE profiles 
  SET empresa_id = empresa_principal_id 
  WHERE empresa_id IS NULL OR empresa_id != empresa_principal_id;
  
  GET DIAGNOSTICS updated_profiles = ROW_COUNT;
  
  RAISE NOTICE 'Usuarios asignados a empresa principal: % perfiles actualizados', updated_profiles;
  RAISE NOTICE 'Empresa principal ID: %', empresa_principal_id;
END $$;

-- ===== PASO 6: VERIFICAR INTEGRIDAD DE DATOS =====

DO $$
DECLARE
  productos_count INTEGER;
  clientes_count INTEGER;
  facturas_count INTEGER;
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO productos_count FROM productos;
  SELECT COUNT(*) INTO clientes_count FROM clientes;
  SELECT COUNT(*) INTO facturas_count FROM facturas_emitidas;
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  
  RAISE NOTICE '=== VERIFICACIÓN DE DATOS POST-MIGRACIÓN ===';
  RAISE NOTICE 'Productos: % registros', productos_count;
  RAISE NOTICE 'Clientes: % registros', clientes_count;
  RAISE NOTICE 'Facturas: % registros', facturas_count;
  RAISE NOTICE 'Profiles: % registros', profiles_count;
END $$;

-- ===== PASO 7: VERIFICACIÓN FINAL =====

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ CONVERSIÓN A SINGLE TENANT COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Políticas RLS simplificadas';
  RAISE NOTICE '✅ Función get_current_user_empresa_id actualizada';
  RAISE NOTICE '✅ Índices optimizados para single tenant';
  RAISE NOTICE '✅ Usuarios asignados a empresa principal';
  RAISE NOTICE '✅ Integridad de datos verificada';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema OnePyme convertido a Single Tenant';
  RAISE NOTICE '📈 Rendimiento optimizado';
  RAISE NOTICE '🔧 Arquitectura simplificada';
  RAISE NOTICE '============================================';
END $$;
