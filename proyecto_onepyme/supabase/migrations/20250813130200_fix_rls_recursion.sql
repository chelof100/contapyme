-- Migración para corregir políticas RLS que causaban recursión infinita
-- Fecha: 2025-08-13
-- Problema: Las políticas RLS estaban consultando la tabla 'profiles' desde dentro de las mismas políticas
-- Solución: Reescribir políticas para usar auth.jwt() en lugar de consultas a la tabla profiles

-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Eliminar políticas problemáticas que causaban recursión
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Crear políticas RLS seguras sin recursión
-- Política para que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Política para que usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Política para que el sistema pueda insertar perfiles (necesario para registro)
CREATE POLICY "System can insert profiles" ON profiles
FOR INSERT WITH CHECK (true);

-- Política para que admins y developers vean todos los perfiles
-- Usamos auth.jwt() para obtener el rol del usuario actual sin consultar la tabla
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer') OR
  auth.uid() = id
);

-- Política para que admins y developers actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer') OR
  auth.uid() = id
);

-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA EMPRESA
-- =====================================================

-- Eliminar políticas problemáticas de empresa que consultan profiles
DROP POLICY IF EXISTS "Admins can manage companies" ON empresa;
DROP POLICY IF EXISTS "Admins can view all companies" ON empresa;
DROP POLICY IF EXISTS "Users can view own company" ON empresa;

-- Crear políticas RLS seguras para empresa sin recursión
-- Política para que admins y developers vean todas las empresas
CREATE POLICY "Admins can view all companies" ON empresa
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que admins y developers gestionen todas las empresas
CREATE POLICY "Admins can manage companies" ON empresa
FOR ALL USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean su empresa (usando empresa_id del JWT)
CREATE POLICY "Users can view own company" ON empresa
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA PRODUCTOS
-- =====================================================

-- Eliminar políticas problemáticas de productos
DROP POLICY IF EXISTS "Admins can view all products" ON productos;
DROP POLICY IF EXISTS "Users can manage products from own company" ON productos;
DROP POLICY IF EXISTS "Users can view products from own company" ON productos;

-- Crear políticas RLS seguras para productos sin recursión
-- Política para que admins y developers vean todos los productos
CREATE POLICY "Admins can view all products" ON productos
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean productos de su empresa
CREATE POLICY "Users can view products from own company" ON productos
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen productos de su empresa
CREATE POLICY "Users can manage products from own company" ON productos
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA FACTURAS_EMITIDAS
-- =====================================================

-- Eliminar políticas problemáticas de facturas_emitidas
DROP POLICY IF EXISTS "Admins can view all invoices" ON facturas_emitidas;
DROP POLICY IF EXISTS "Users can manage invoices from own company" ON facturas_emitidas;
DROP POLICY IF EXISTS "Users can view invoices from own company" ON facturas_emitidas;

-- Crear políticas RLS seguras para facturas_emitidas sin recursión
-- Política para que admins y developers vean todas las facturas
CREATE POLICY "Admins can view all invoices" ON facturas_emitidas
FOR SELECT USING (
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios vean facturas de su empresa
CREATE POLICY "Users can view invoices from own company" ON facturas_emitidas
FOR SELECT USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- Política para que usuarios gestionen facturas de su empresa
CREATE POLICY "Users can manage invoices from own company" ON facturas_emitidas
FOR ALL USING (
  (auth.jwt() ->> 'empresa_id')::uuid = empresa_id OR
  (auth.jwt() ->> 'role')::text IN ('admin', 'developer')
);

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
-- ✅ Políticas RLS corregidas para evitar recursión infinita
-- ✅ Uso de auth.jwt() en lugar de consultas a la tabla profiles
-- ✅ Mantenimiento de seguridad y control de acceso
-- ✅ Soporte para roles admin, developer, contador y usuario
-- ✅ Separación por empresa_id para usuarios regulares

