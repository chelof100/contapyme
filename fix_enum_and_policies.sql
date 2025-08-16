-- ========================================
-- SOLUCIÓN COMPLETA: ENUM + POLÍTICAS RLS
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- 1) VERIFICAR TIPOS DEFINIDOS EXISTENTES
-- -----------------------------------------------------------
SELECT 
    'EXISTING TYPES' as test,
    n.nspname AS schema,
    t.typname AS type,
    t.typtype AS type_category
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND t.typname LIKE '%role%'
ORDER BY n.nspname, t.typname;

-- -----------------------------------------------------------
-- 2) VERIFICAR SI EXISTE EL ENUM USER_ROLE
-- -----------------------------------------------------------
SELECT 
    'ENUM USER_ROLE CHECK' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public' AND t.typname = 'user_role'
        ) THEN '✅ ENUM USER_ROLE EXISTE'
        ELSE '❌ ENUM USER_ROLE NO EXISTE'
    END as enum_status;

-- -----------------------------------------------------------
-- 3) CREAR EL ENUM USER_ROLE SI NO EXISTE
-- -----------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'developer', 
            'contador',
            'usuario'
        );
        RAISE NOTICE '✅ ENUM user_role creado exitosamente';
    ELSE
        RAISE NOTICE '✅ ENUM user_role ya existe';
    END IF;
END $$;

-- -----------------------------------------------------------
-- 4) VERIFICAR VALORES DEL ENUM
-- -----------------------------------------------------------
SELECT 
    'ENUM VALUES' as test,
    typname as nombre_enum,
    enumlabel as valor_valido
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- -----------------------------------------------------------
-- 5) VERIFICAR ESTRUCTURA ACTUAL DE PROFILES
-- -----------------------------------------------------------
SELECT 
    'PROFILES CURRENT STRUCTURE' as test,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role'
ORDER BY ordinal_position;

-- -----------------------------------------------------------
-- 6) VERIFICAR POLÍTICAS RLS EXISTENTES
-- -----------------------------------------------------------
SELECT 
    'EXISTING RLS POLICIES' as test,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas')
ORDER BY tablename, policyname;

-- -----------------------------------------------------------
-- 7) VERIFICAR FUNCIONES JWT IMPLEMENTADAS
-- -----------------------------------------------------------
SELECT 
    'JWT FUNCTIONS STATUS' as test,
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
-- 8) CREAR FUNCIONES JWT SI NO EXISTEN
-- -----------------------------------------------------------
-- Función para obtener rol desde JWT
CREATE OR REPLACE FUNCTION get_user_role_from_jwt()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'role',
        'usuario'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función para obtener empresa_id desde JWT
CREATE OR REPLACE FUNCTION get_user_empresa_from_jwt()
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::jsonb->>'empresa_id'
    )::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------
-- 9) VERIFICAR FUNCIONES CREADAS
-- -----------------------------------------------------------
SELECT 
    'JWT FUNCTIONS VERIFICATION' as test,
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
-- 10) RESUMEN FINAL DEL SISTEMA
-- -----------------------------------------------------------
SELECT 
    'SYSTEM STATUS' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public' AND t.typname = 'user_role'
        ) THEN '✅ ENUM USER_ROLE EXISTE'
        ELSE '❌ ENUM USER_ROLE NO EXISTE'
    END as enum_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'get_user_role_from_jwt'
        ) THEN '✅ FUNCIÓN JWT IMPLEMENTADA'
        ELSE '❌ FUNCIÓN JWT FALTANTE'
    END as jwt_functions_status,
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
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename = 'profiles' 
              AND rowsecurity = true
        ) THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as rls_status;

commit;

-- ========================================
-- VERIFICACIÓN POST-APLICACIÓN:
-- Ejecutar este comando para ver el estado final:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'facturas')
-- ORDER BY tablename, cmd;
-- ========================================
