-- Migración para corregir políticas RLS faltantes que causaban 403 Forbidden
-- Fecha: 2025-08-13
-- Problema: Varias tablas no tenían RLS habilitado ni políticas configuradas
-- Solución: Habilitar RLS y crear políticas consistentes para todas las tablas principales

-- =====================================================
-- HABILITAR RLS EN TABLAS SIN POLÍTICAS
-- =====================================================

-- Habilitar RLS en tablas que no lo tenían
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA ACTIVIDADES
-- =====================================================

-- Política para que admins y developers vean todas las actividades
CREATE POLICY "Admins can view all activities" ON actividades
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean actividades de su empresa
CREATE POLICY "Users can view activities from own company" ON actividades
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen actividades de su empresa
CREATE POLICY "Users can manage activities from own company" ON actividades
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- POLÍTICAS RLS PARA CLIENTES
-- =====================================================

-- Política para que admins y developers vean todos los clientes
CREATE POLICY "Admins can view all clients" ON clientes
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean clientes de su empresa
CREATE POLICY "Users can view clients from own company" ON clientes
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen clientes de su empresa
CREATE POLICY "Users can manage clients from own company" ON clientes
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- POLÍTICAS RLS PARA ORDENES_COMPRA
-- =====================================================

-- Política para que admins y developers vean todas las órdenes de compra
CREATE POLICY "Admins can view all purchase orders" ON ordenes_compra
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean órdenes de compra de su empresa
CREATE POLICY "Users can view purchase orders from own company" ON ordenes_compra
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen órdenes de compra de su empresa
CREATE POLICY "Users can manage purchase orders from own company" ON ordenes_compra
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- POLÍTICAS RLS PARA PAGOS
-- =====================================================

-- Política para que admins y developers vean todos los pagos
CREATE POLICY "Admins can view all payments" ON pagos
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean pagos de su empresa
CREATE POLICY "Users can view payments from own company" ON pagos
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen pagos de su empresa
CREATE POLICY "Users can manage payments from own company" ON pagos
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- POLÍTICAS RLS PARA PROYECTOS
-- =====================================================

-- Política para que admins y developers vean todos los proyectos
CREATE POLICY "Admins can view all projects" ON proyectos
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean proyectos de su empresa
CREATE POLICY "Users can view projects from own company" ON proyectos
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen proyectos de su empresa
CREATE POLICY "Users can manage projects from own company" ON proyectos
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
-- ✅ RLS habilitado en todas las tablas principales
-- ✅ Políticas RLS creadas para actividades, clientes, ordenes_compra, pagos, proyectos
-- ✅ Consistencia en el patrón de políticas: admins ven todo, usuarios ven solo su empresa
-- ✅ Uso de auth.jwt() para evitar recursión infinita
-- ✅ Separación clara por empresa_id para usuarios regulares

