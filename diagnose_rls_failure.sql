-- ========================================
-- DIAGNÓSTICO: ¿POR QUÉ FALLAN LAS POLÍTICAS RLS?
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- -----------------------------------------------------------
-- 1) VERIFICAR POLÍTICAS ACTIVAS EN PROFILES
-- -----------------------------------------------------------
SELECT 
    'PROFILES' as tabla,
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN cmd = 'INSERT' AND with_check IS NULL THEN '❌ INSERT SIN VALIDACIÓN'
        WHEN cmd = 'INSERT' AND with_check IS NOT NULL THEN '✅ INSERT CON VALIDACIÓN'
        ELSE '✅ POLÍTICA CORRECTA'
    END as diagnostico
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 2) VERIFICAR POLÍTICAS ACTIVAS EN FACTURAS
-- -----------------------------------------------------------
SELECT 
    'FACTURAS' as tabla,
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN cmd = 'SELECT' AND qual IS NULL THEN '❌ SELECT SIN RESTRICCIÓN'
        WHEN cmd = 'SELECT' AND qual IS NOT NULL THEN '✅ SELECT CON RESTRICCIÓN'
        ELSE '✅ POLÍTICA CORRECTA'
    END as diagnostico
FROM pg_policies 
WHERE tablename = 'facturas'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 3) VERIFICAR FUNCIONES JWT IMPLEMENTADAS
-- -----------------------------------------------------------
SELECT 
    proname as funcion,
    prosrc as codigo,
    CASE
        WHEN prosrc IS NOT NULL THEN '✅ IMPLEMENTADA'
        ELSE '❌ NO IMPLEMENTADA'
    END as estado
FROM pg_proc
WHERE proname IN ('get_user_role_from_jwt', 'get_user_empresa_from_jwt')
ORDER BY proname;

-- -----------------------------------------------------------
-- 4) VERIFICAR PERMISOS DE USUARIOS
-- -----------------------------------------------------------
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'facturas')
  AND grantee = 'authenticated'
ORDER BY table_name, grantee;

-- -----------------------------------------------------------
-- 5) VERIFICAR ESTRUCTURA DE TABLAS
-- -----------------------------------------------------------
-- Profiles
SELECT 
    'PROFILES' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'empresa_id', 'role')
ORDER BY ordinal_position;

-- Facturas
SELECT 
    'FACTURAS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'facturas'
  AND column_name IN ('id', 'empresa_id', 'created_by')
ORDER BY ordinal_position;

-- -----------------------------------------------------------
-- 6) TEST DE POLÍTICAS RLS
-- -----------------------------------------------------------
-- Simular el INSERT que está fallando
-- (Ejecutar como usuario autenticado)
SELECT 
    'TEST INSERT' as test,
    'auth.uid()' as valor_actual,
    auth.uid() as resultado,
    'get_user_role_from_jwt()' as funcion_rol,
    get_user_role_from_jwt() as rol_resultado,
    'get_user_empresa_from_jwt()' as funcion_empresa,
    get_user_empresa_from_jwt() as empresa_resultado;

-- -----------------------------------------------------------
-- 7) RESUMEN DE PROBLEMAS IDENTIFICADOS
-- -----------------------------------------------------------
SELECT 
    'DIAGNÓSTICO' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
              AND cmd = 'INSERT' 
              AND with_check IS NULL
        ) THEN '❌ INSERT SIN VALIDACIÓN'
        ELSE '✅ INSERT CON VALIDACIÓN'
    END as profiles_insert,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'facturas' 
              AND cmd = 'SELECT' 
              AND qual IS NULL
        ) THEN '❌ SELECT SIN RESTRICCIÓN'
        ELSE '✅ SELECT CON RESTRICCIÓN'
    END as facturas_select,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'get_user_role_from_jwt'
        ) THEN '✅ FUNCIÓN IMPLEMENTADA'
        ELSE '❌ FUNCIÓN FALTANTE'
    END as jwt_functions;
