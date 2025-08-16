-- Script completo para corregir políticas RLS faltantes
-- Ejecutar en Supabase SQL Editor

-- ========================================
-- 1. CORREGIR POLÍTICA INSERT EN PROFILES
-- ========================================
CREATE POLICY "profiles_insert_authenticated" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. CORREGIR POLÍTICA SELECT EN FACTURAS
-- ========================================
CREATE POLICY "facturas_select_authenticated" ON facturas
FOR SELECT USING (auth.uid() IS NOT NULL);

-- ========================================
-- 3. VERIFICAR POLÍTICAS EXISTENTES
-- ========================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas')
ORDER BY tablename, policyname;

-- ========================================
-- 4. VERIFICAR QUE RLS ESTÉ HABILITADO
-- ========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'facturas', 'clientes', 'productos', 'empresa')
ORDER BY tablename;

-- ========================================
-- 5. VERIFICAR FUNCIONES JWT
-- ========================================
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname IN ('get_user_role_from_jwt', 'get_user_empresa_from_jwt')
ORDER BY proname;
