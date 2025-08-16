-- ========================================
-- MIGRACIÓN: CORRECCIÓN COMPLETA DE RLS
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- 1. POLÍTICA INSERT EN PROFILES (RESUELVE EL COLGADO)
CREATE POLICY "profiles_insert_authenticated" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. POLÍTICA SELECT EN FACTURAS (RESUELVE PERMISSION DENIED)
CREATE POLICY "facturas_select_authenticated" ON facturas
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. VERIFICAR POLÍTICAS CREADAS
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

-- 4. VERIFICAR ESTADO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'facturas', 'clientes', 'productos', 'empresa')
ORDER BY tablename;
