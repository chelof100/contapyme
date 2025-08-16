-- ========================================
-- DIAGNÓSTICO Y CORRECCIÓN DE POLÍTICAS RLS
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR POLÍTICAS EXISTENTES EN PROFILES
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN with_check IS NULL THEN '❌ SIN WITH_CHECK'
        ELSE '✅ CON WITH_CHECK'
    END as status
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. VERIFICAR POLÍTICAS EXISTENTES EN FACTURAS
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN policyname IS NULL THEN '❌ SIN POLÍTICAS'
        ELSE '✅ CON POLÍTICAS'
    END as status
FROM pg_policies 
WHERE tablename = 'facturas'
ORDER BY policyname;

-- 3. CORREGIR POLÍTICA INSERT EN PROFILES (SI NO FUNCIONA)
-- Primero eliminar la política problemática
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;

-- Crear política corregida
CREATE POLICY "profiles_insert_authenticated" ON profiles
FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- 4. CREAR POLÍTICA PARA FACTURAS
CREATE POLICY "facturas_select_authenticated" ON facturas
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. VERIFICAR POLÍTICAS DESPUÉS DE LA CORRECCIÓN
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
