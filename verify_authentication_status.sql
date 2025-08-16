-- ========================================
-- VERIFICACIÓN COMPLETA DE AUTENTICACIÓN
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- -----------------------------------------------------------
-- 1) VERIFICAR ESTADO ACTUAL DE AUTENTICACIÓN
-- -----------------------------------------------------------
SELECT 
    'AUTHENTICATION STATUS' as test,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ AUTENTICADO'
        ELSE '❌ NO AUTENTICADO'
    END as auth_status,
    auth.uid() as user_id,
    auth.role() as user_role,
    current_user as current_user,
    session_user as session_user;

-- -----------------------------------------------------------
-- 2) VERIFICAR JWT CLAIMS DISPONIBLES
-- -----------------------------------------------------------
SELECT 
    'JWT CLAIMS STATUS' as test,
    CASE 
        WHEN current_setting('request.jwt.claims', true) IS NOT NULL 
        THEN '✅ JWT CLAIMS DISPONIBLES'
        ELSE '❌ JWT CLAIMS NO DISPONIBLES'
    END as jwt_status,
    current_setting('request.jwt.claims', true) as jwt_claims_raw;

-- -----------------------------------------------------------
-- 3) VERIFICAR FUNCIONES JWT PERSONALIZADAS
-- -----------------------------------------------------------
SELECT 
    'JWT FUNCTIONS STATUS' as test,
    CASE 
        WHEN get_user_role_from_jwt() IS NOT NULL 
        THEN '✅ get_user_role_from_jwt() FUNCIONA'
        ELSE '❌ get_user_role_from_jwt() NO FUNCIONA'
    END as role_function_status,
    CASE 
        WHEN get_user_empresa_from_jwt() IS NOT NULL 
        THEN '✅ get_user_empresa_from_jwt() FUNCIONA'
        ELSE '❌ get_user_empresa_from_jwt() NO FUNCIONA'
    END as empresa_function_status,
    get_user_role_from_jwt() as jwt_role,
    get_user_empresa_from_jwt() as jwt_empresa;

-- -----------------------------------------------------------
-- 4) VERIFICAR PERMISOS DE USUARIO ACTUAL
-- -----------------------------------------------------------
SELECT 
    'USER PERMISSIONS' as test,
    has_table_privilege('profiles', 'SELECT') as can_select_profiles,
    has_table_privilege('profiles', 'INSERT') as can_insert_profiles,
    has_table_privilege('facturas', 'SELECT') as can_select_facturas,
    has_table_privilege('clientes', 'SELECT') as can_select_clientes,
    has_table_privilege('productos', 'SELECT') as can_select_productos;

-- -----------------------------------------------------------
-- 5) VERIFICAR SI ESTAMOS EN MODO ANÓNIMO
-- -----------------------------------------------------------
SELECT 
    'ANONYMOUS MODE CHECK' as test,
    CASE 
        WHEN current_user = 'anon' THEN '❌ MODO ANÓNIMO'
        WHEN current_user = 'authenticated' THEN '✅ MODO AUTENTICADO'
        WHEN current_user = 'service_role' THEN '🔧 MODO SERVICE ROLE'
        ELSE '❓ MODO DESCONOCIDO: ' || current_user
    END as current_mode,
    CASE 
        WHEN session_user = 'anon' THEN '❌ SESIÓN ANÓNIMA'
        WHEN session_user = 'authenticated' THEN '✅ SESIÓN AUTENTICADA'
        WHEN session_user = 'service_role' THEN '🔧 SESIÓN SERVICE ROLE'
        ELSE '❓ SESIÓN DESCONOCIDA: ' || session_user
    END as session_mode;

-- -----------------------------------------------------------
-- 6) VERIFICAR CONFIGURACIÓN DE AUTENTICACIÓN
-- -----------------------------------------------------------
SELECT 
    'AUTH CONFIGURATION' as test,
    current_setting('role') as current_role_setting,
    current_setting('search_path') as search_path,
    current_setting('timezone') as timezone;

-- -----------------------------------------------------------
-- 7) RESUMEN DE PROBLEMAS IDENTIFICADOS
-- -----------------------------------------------------------
SELECT 
    'PROBLEMS SUMMARY' as test,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ auth.uid() ES NULL'
        ELSE '✅ auth.uid() FUNCIONA'
    END as auth_uid_problem,
    CASE 
        WHEN current_user = 'anon' THEN '❌ USUARIO ANÓNIMO'
        ELSE '✅ USUARIO NO ANÓNIMO'
    END as anonymous_problem,
    CASE 
        WHEN current_setting('request.jwt.claims', true) IS NULL THEN '❌ SIN JWT CLAIMS'
        ELSE '✅ JWT CLAIMS DISPONIBLES'
    END as jwt_problem;

-- -----------------------------------------------------------
-- 8) INSTRUCCIONES PARA RESOLVER
-- -----------------------------------------------------------
SELECT 
    'SOLUTION INSTRUCTIONS' as test,
    CASE 
        WHEN auth.uid() IS NULL THEN '🔧 NECESITAS AUTENTICARTE EN SUPABASE'
        ELSE '✅ YA ESTÁS AUTENTICADO'
    END as action_needed,
    CASE 
        WHEN current_user = 'anon' THEN '🔧 CAMBIA A MODO AUTENTICADO'
        ELSE '✅ MODO CORRECTO'
    END as mode_action,
    CASE 
        WHEN current_setting('request.jwt.claims', true) IS NULL THEN '🔧 VERIFICA TU SESIÓN DE NAVEGADOR'
        ELSE '✅ JWT FUNCIONANDO'
    END as jwt_action;
