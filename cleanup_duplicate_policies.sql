-- ========================================
-- LIMPIEZA DE POLÍTICAS DUPLICADAS
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- PROBLEMA IDENTIFICADO:
-- Hay políticas DUPLICADAS que están causando conflictos:
-- - PROFILES: 8 políticas (deberían ser 4)
-- - FACTURAS: 8 políticas (deberían ser 4)
-- - Total: 16 políticas (deberían ser 8)
-- -----------------------------------------------------------

-- -----------------------------------------------------------
-- 1) LIMPIAR POLÍTICAS DUPLICADAS DE PROFILES
-- -----------------------------------------------------------

-- Eliminar políticas duplicadas de INSERT
DROP POLICY IF EXISTS "profiles_insert_unified" ON profiles;

-- Eliminar políticas duplicadas de SELECT
DROP POLICY IF EXISTS "profiles_select_unified" ON profiles;
DROP POLICY IF EXISTS "Usuarios leen solo sus datos" ON profiles;

-- Eliminar políticas duplicadas de UPDATE
DROP POLICY IF EXISTS "profiles_update_unified" ON profiles;

-- Eliminar políticas duplicadas de DELETE
DROP POLICY IF EXISTS "profiles_delete_unified" ON profiles;

-- -----------------------------------------------------------
-- 2) LIMPIAR POLÍTICAS DUPLICADAS DE FACTURAS
-- -----------------------------------------------------------

-- Eliminar políticas duplicadas de INSERT
DROP POLICY IF EXISTS "facturas_insert_unified" ON facturas;

-- Eliminar políticas duplicadas de SELECT
DROP POLICY IF EXISTS "facturas_select_unified" ON facturas;

-- Eliminar políticas duplicadas de UPDATE
DROP POLICY IF EXISTS "facturas_update_unified" ON facturas;

-- Eliminar políticas duplicadas de DELETE
DROP POLICY IF EXISTS "facturas_delete_unified" ON facturas;

-- -----------------------------------------------------------
-- 3) VERIFICAR POLÍTICAS FINALES DE PROFILES
-- -----------------------------------------------------------
SELECT 
    'PROFILES FINAL POLICIES' as test,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 4) VERIFICAR POLÍTICAS FINALES DE FACTURAS
-- -----------------------------------------------------------
SELECT 
    'FACTURAS FINAL POLICIES' as test,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'facturas'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 5) RESUMEN FINAL DE POLÍTICAS
-- -----------------------------------------------------------
SELECT 
    'FINAL POLICIES SUMMARY' as tipo,
    COUNT(CASE WHEN tablename = 'profiles' THEN 1 END) as profiles_policies,
    COUNT(CASE WHEN tablename = 'facturas' THEN 1 END) as facturas_policies,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas');

-- -----------------------------------------------------------
-- 6) VERIFICAR QUE LAS POLÍTICAS CORRECTAS ESTÉN ACTIVAS
-- -----------------------------------------------------------

-- Verificar que profiles tenga exactamente 4 políticas
SELECT 
    'PROFILES POLICY COUNT' as test,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar que facturas tenga exactamente 4 políticas
SELECT 
    'FACTURAS POLICY COUNT' as test,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE tablename = 'facturas';

commit;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ 4 políticas en profiles (1 por operación)
-- ✅ 4 políticas en facturas (1 por operación)
-- ✅ Total: 8 políticas limpias y eficientes
-- ✅ Sin duplicados ni conflictos
-- ========================================

-- ========================================
-- VERIFICACIÓN POST-LIMPIEZA:
-- Ejecutar este comando para ver el estado final:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'facturas')
-- ORDER BY tablename, cmd;
-- ========================================
