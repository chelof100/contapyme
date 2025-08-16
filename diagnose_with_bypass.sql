-- ========================================
-- DIAGNÓSTICO CON BYPASS DE AUTENTICACIÓN
-- ========================================
-- Ejecutar en Supabase SQL Editor con SET ROLE

-- -----------------------------------------------------------
-- 1) CAMBIAR A ROL CON PERMISOS COMPLETOS
-- -----------------------------------------------------------
-- Cambiar a un rol que tenga acceso completo para diagnóstico
SET ROLE postgres;

-- Verificar el rol actual
SELECT 
    'CURRENT ROLE' as test,
    current_user as usuario_actual,
    session_user as sesion_usuario;

-- -----------------------------------------------------------
-- 2) VERIFICAR ENUM USER_ROLE (SIN RLS)
-- -----------------------------------------------------------
SELECT 
    'ENUM USER_ROLE' as test,
    typname as nombre_enum,
    enumlabel as valor_valido
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- -----------------------------------------------------------
-- 3) VERIFICAR ESTRUCTURA DE TABLAS (SIN RLS)
-- -----------------------------------------------------------
-- Profiles
SELECT 
    'PROFILES STRUCTURE' as test,
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
    'FACTURAS STRUCTURE' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'facturas'
ORDER BY ordinal_position;

-- -----------------------------------------------------------
-- 4) VERIFICAR POLÍTICAS RLS ACTIVAS (SIN RLS)
-- -----------------------------------------------------------
SELECT 
    'RLS POLICIES' as test,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas')
ORDER BY tablename, policyname;

-- -----------------------------------------------------------
-- 5) VERIFICAR FUNCIONES JWT IMPLEMENTADAS (SIN RLS)
-- -----------------------------------------------------------
SELECT 
    'JWT FUNCTIONS' as test,
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
-- 6) VERIFICAR DATOS EXISTENTES (SIN RLS)
-- -----------------------------------------------------------
-- Contar registros en cada tabla
SELECT 
    'DATA COUNT' as test,
    'profiles' as tabla,
    COUNT(*) as total_registros
FROM profiles
UNION ALL
SELECT 
    'DATA COUNT' as test,
    'facturas' as tabla,
    COUNT(*) as total_registros
FROM facturas
UNION ALL
SELECT 
    'DATA COUNT' as test,
    'clientes' as tabla,
    COUNT(*) as total_registros
FROM clientes
UNION ALL
SELECT 
    'DATA COUNT' as test,
    'productos' as tabla,
    COUNT(*) as total_registros
FROM productos;

-- -----------------------------------------------------------
-- 7) VERIFICAR PERMISOS DE USUARIOS (SIN RLS)
-- -----------------------------------------------------------
SELECT 
    'USER PERMISSIONS' as test,
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'facturas', 'clientes', 'productos')
ORDER BY table_name, grantee;

-- -----------------------------------------------------------
-- 8) TEST INSERT SIMULADO (SIN RLS)
-- -----------------------------------------------------------
-- Simular un INSERT que funcionaría con RLS correcto
SELECT 
    'INSERT SIMULATION' as test,
    'UUID válido' as id_type,
    gen_random_uuid() as sample_uuid,
    'usuario' as sample_role,
    'test@example.com' as sample_email;

-- -----------------------------------------------------------
-- 9) RESUMEN COMPLETO DEL DIAGNÓSTICO
-- -----------------------------------------------------------
SELECT 
    'DIAGNÓSTICO COMPLETO' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role'
        ) THEN '✅ ENUM USER_ROLE EXISTE'
        ELSE '❌ ENUM USER_ROLE NO EXISTE'
    END as enum_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
              AND cmd = 'INSERT' 
              AND with_check IS NOT NULL
        ) THEN '✅ INSERT CON VALIDACIÓN'
        ELSE '❌ INSERT SIN VALIDACIÓN'
    END as insert_policy_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'get_user_role_from_jwt'
        ) THEN '✅ FUNCIÓN JWT IMPLEMENTADA'
        ELSE '❌ FUNCIÓN JWT FALTANTE'
    END as jwt_functions_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename = 'profiles' 
              AND rowsecurity = true
        ) THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as rls_status;

-- -----------------------------------------------------------
-- 10) VOLVER AL ROL ORIGINAL
-- -----------------------------------------------------------
RESET ROLE;

SELECT 
    'ROLE RESET' as test,
    current_user as usuario_actual,
    session_user as sesion_usuario;
