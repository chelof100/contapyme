-- ========================================
-- DIAGNÓSTICO BÁSICO: FUNCIONES DE AUTENTICACIÓN
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- -----------------------------------------------------------
-- 1) VERIFICAR FUNCIONES BÁSICAS DE AUTH
-- -----------------------------------------------------------
SELECT 
    'AUTH FUNCTIONS' as test,
    auth.uid() as auth_uid,
    auth.role() as auth_role,
    current_user as current_user,
    session_user as session_user;

-- -----------------------------------------------------------
-- 2) VERIFICAR FUNCIONES JWT PERSONALIZADAS
-- -----------------------------------------------------------
SELECT 
    'JWT FUNCTIONS' as test,
    get_user_role_from_jwt() as jwt_role,
    get_user_empresa_from_jwt() as jwt_empresa;

-- -----------------------------------------------------------
-- 3) VERIFICAR JWT CLAIMS RAW
-- -----------------------------------------------------------
SELECT 
    'JWT CLAIMS RAW' as test,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- -----------------------------------------------------------
-- 4) VERIFICAR SI ESTAMOS AUTENTICADOS
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
-- 5) VERIFICAR PERMISOS BÁSICOS
-- -----------------------------------------------------------
SELECT 
    'BASIC PERMISSIONS' as test,
    has_table_privilege('profiles', 'SELECT') as can_select_profiles,
    has_table_privilege('profiles', 'INSERT') as can_insert_profiles,
    has_table_privilege('facturas', 'SELECT') as can_select_facturas;

-- -----------------------------------------------------------
-- 6) VERIFICAR TABLAS DISPONIBLES
-- -----------------------------------------------------------
SELECT 
    'AVAILABLE TABLES' as test,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'facturas', 'clientes', 'productos')
ORDER BY tablename;
