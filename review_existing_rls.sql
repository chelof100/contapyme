-- ========================================
-- REVISIÓN COMPLETA DE RLS Y POLÍTICAS EXISTENTES
-- ========================================
-- Ejecutar en Supabase SQL Editor para diagnosticar el estado actual

-- -----------------------------------------------------------
-- 1) VERIFICAR ESTADO GENERAL DE RLS
-- -----------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESHABILITADO'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas', 'clientes', 'productos', 'empresa', 'empresas')
ORDER BY tablename;

-- -----------------------------------------------------------
-- 2) VERIFICAR TODAS LAS POLÍTICAS EXISTENTES
-- -----------------------------------------------------------
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 LECTURA'
        WHEN cmd = 'INSERT' THEN '📝 INSERCIÓN'
        WHEN cmd = 'UPDATE' THEN '✏️ ACTUALIZACIÓN'
        WHEN cmd = 'DELETE' THEN '🗑️ ELIMINACIÓN'
        WHEN cmd = 'ALL' THEN '🔄 TODAS'
        ELSE '❓ ' || cmd
    END as operacion,
    qual,
    with_check,
    CASE 
        WHEN with_check IS NULL THEN '❌ SIN VALIDACIÓN'
        ELSE '✅ CON VALIDACIÓN'
    END as validacion
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas', 'clientes', 'productos', 'empresa', 'empresas')
ORDER BY tablename, policyname;

-- -----------------------------------------------------------
-- 3) VERIFICAR PERMISOS DE USUARIOS
-- -----------------------------------------------------------
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'facturas', 'clientes', 'productos', 'empresa', 'empresas')
ORDER BY table_name, grantee;

-- -----------------------------------------------------------
-- 4) VERIFICAR FUNCIONES JWT IMPLEMENTADAS
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
-- 5) VERIFICAR ESTRUCTURA DE TABLAS CLAVE
-- -----------------------------------------------------------
-- Profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Facturas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'facturas'
ORDER BY ordinal_position;

-- -----------------------------------------------------------
-- 6) RESUMEN DE ESTADO ACTUAL
-- -----------------------------------------------------------
-- Contar políticas por tabla
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas', 'clientes', 'productos', 'empresa', 'empresas')
GROUP BY tablename
ORDER BY tablename;

-- -----------------------------------------------------------
-- 7) VERIFICAR POLÍTICAS PROBLEMÁTICAS
-- -----------------------------------------------------------
-- Buscar políticas que puedan estar causando problemas
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN with_check IS NULL AND cmd = 'INSERT' THEN '⚠️ INSERT SIN VALIDACIÓN'
        WHEN qual IS NULL AND cmd = 'SELECT' THEN '⚠️ SELECT SIN RESTRICCIÓN'
        WHEN qual LIKE '%profiles%' AND tablename = 'profiles' THEN '⚠️ POSIBLE RECURSIÓN'
        ELSE '✅ POLÍTICA CORRECTA'
    END as diagnostico
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas')
ORDER BY tablename, policyname;
