-- ========================================
-- DIAGNÓSTICO COMPLETO: ENUM + AUTENTICACIÓN + RLS
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- -----------------------------------------------------------
-- 1) VERIFICAR ENUM USER_ROLE
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
-- 2) VERIFICAR FUNCIONES BÁSICAS DE AUTH
-- -----------------------------------------------------------
SELECT 
    'AUTH FUNCTIONS' as test,
    auth.uid() as auth_uid,
    auth.role() as auth_role,
    current_user as current_user,
    session_user as session_user;

-- -----------------------------------------------------------
-- 3) VERIFICAR FUNCIONES JWT PERSONALIZADAS
-- -----------------------------------------------------------
SELECT 
    'JWT FUNCTIONS' as test,
    get_user_role_from_jwt() as jwt_role,
    get_user_empresa_from_jwt() as jwt_empresa;

-- -----------------------------------------------------------
-- 4) VERIFICAR JWT CLAIMS RAW
-- -----------------------------------------------------------
SELECT 
    'JWT CLAIMS RAW' as test,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- -----------------------------------------------------------
-- 5) VERIFICAR SI ESTAMOS AUTENTICADOS
-- -----------------------------------------------------------
SELECT 
    'AUTH STATUS' as test,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
        ELSE '❌ USUARIO NO AUTENTICADO'
    END as estado_autenticacion,
    CASE 
        WHEN auth.role() IS NOT NULL THEN '✅ ROL OBTENIDO: ' || auth.role()
        ELSE '❌ ROL NO OBTENIDO'
    END as estado_rol;

-- -----------------------------------------------------------
-- 6) VERIFICAR PERMISOS BÁSICOS
-- -----------------------------------------------------------
SELECT 
    'BASIC PERMISSIONS' as test,
    has_table_privilege('profiles', 'SELECT') as can_select_profiles,
    has_table_privilege('profiles', 'INSERT') as can_insert_profiles,
    has_table_privilege('facturas', 'SELECT') as can_select_facturas;

-- -----------------------------------------------------------
-- 7) VERIFICAR POLÍTICAS RLS ACTIVAS
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
-- 8) TEST INSERT CON VALOR VÁLIDO DEL ENUM (SI ESTAMOS AUTENTICADOS)
-- -----------------------------------------------------------
-- Solo ejecutar si auth.uid() no es NULL
SELECT 
    'INSERT TEST READY' as test,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ LISTO PARA INSERT'
        ELSE '❌ NO AUTENTICADO - NO SE PUEDE INSERTAR'
    END as estado_insert,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'ID: ' || auth.uid()::text
        ELSE 'SIN ID'
    END as user_id_available;

-- -----------------------------------------------------------
-- 9) RESUMEN COMPLETO DEL DIAGNÓSTICO
-- -----------------------------------------------------------
SELECT 
    'DIAGNÓSTICO FINAL' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role'
        ) THEN '✅ ENUM USER_ROLE EXISTE'
        ELSE '❌ ENUM USER_ROLE NO EXISTE'
    END as enum_status,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
        ELSE '❌ USUARIO NO AUTENTICADO'
    END as auth_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
              AND cmd = 'INSERT' 
              AND with_check IS NOT NULL
        ) THEN '✅ INSERT CON VALIDACIÓN'
        ELSE '❌ INSERT SIN VALIDACIÓN'
    END as insert_policy_status;
