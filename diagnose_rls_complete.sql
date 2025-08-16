-- ========================================
-- DIAGNÓSTICO COMPLETO: RLS + ENUM + POLÍTICAS
-- ========================================
-- Ejecutar en Supabase SQL Editor con usuario autenticado

-- -----------------------------------------------------------
-- 1) VERIFICAR TIPO DE COLUMNA ROLE
-- -----------------------------------------------------------
SELECT 
    'PROFILES' as tabla,
    column_name,
    data_type,
    udt_name,
    CASE 
        WHEN data_type = 'USER-DEFINED' THEN 'ENUM: ' || udt_name
        ELSE data_type
    END as tipo_real
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role';

-- -----------------------------------------------------------
-- 2) VERIFICAR VALORES VÁLIDOS DEL ENUM
-- -----------------------------------------------------------
-- Listar todos los valores válidos del enum user_role
SELECT 
    'ENUM VALUES' as tipo,
    unnest(enum_range(NULL::user_role)) as valor_valido;

-- -----------------------------------------------------------
-- 3) VERIFICAR POLÍTICAS ACTIVAS
-- -----------------------------------------------------------
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas')
ORDER BY tablename, policyname;

-- -----------------------------------------------------------
-- 4) VERIFICAR FUNCIONES JWT Y AUTH
-- -----------------------------------------------------------
SELECT
    'JWT FUNCTIONS' as test,
    auth.uid() as current_uid,
    auth.role() as current_role,
    get_user_role_from_jwt() as jwt_role,
    get_user_empresa_from_jwt() as jwt_empresa;

-- -----------------------------------------------------------
-- 5) TEST INSERT CON VALOR VÁLIDO DEL ENUM
-- -----------------------------------------------------------
-- Usar 'usuario' en lugar de 'user' (valor válido del enum)
INSERT INTO profiles (id, empresa_id, role, username, email, first_name, last_name)
VALUES (
    auth.uid(), 
    get_user_empresa_from_jwt(), 
    'usuario',  -- VALOR VÁLIDO DEL ENUM
    'test_user_' || extract(epoch from now()),
    'test' || extract(epoch from now()) || '@example.com',
    'Test',
    'User'
)
RETURNING id, role, username, email;

-- -----------------------------------------------------------
-- 6) TEST SELECT EN FACTURAS
-- -----------------------------------------------------------
SELECT 
    'FACTURAS TEST' as test,
    COUNT(*) as total_registros
FROM facturas;

-- -----------------------------------------------------------
-- 7) VERIFICAR PERMISOS DE USUARIO
-- -----------------------------------------------------------
SELECT 
    'USER PERMISSIONS' as test,
    current_user as usuario_actual,
    session_user as sesion_usuario,
    current_setting('role') as rol_actual;

-- -----------------------------------------------------------
-- 8) VERIFICAR JWT CLAIMS
-- -----------------------------------------------------------
SELECT 
    'JWT CLAIMS' as test,
    current_setting('request.jwt.claims', true) as jwt_claims_raw,
    CASE 
        WHEN current_setting('request.jwt.claims', true)::jsonb ? 'role' 
        THEN current_setting('request.jwt.claims', true)::jsonb->>'role'
        ELSE 'NO ROLE IN JWT'
    END as jwt_role_claim,
    CASE 
        WHEN current_setting('request.jwt.claims', true)::jsonb ? 'empresa_id' 
        THEN current_setting('request.jwt.claims', true)::jsonb->>'empresa_id'
        ELSE 'NO EMPRESA_ID IN JWT'
    END as jwt_empresa_claim;

-- -----------------------------------------------------------
-- 9) RESUMEN DE DIAGNÓSTICO
-- -----------------------------------------------------------
SELECT 
    'DIAGNÓSTICO FINAL' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
              AND cmd = 'INSERT' 
              AND with_check IS NOT NULL
        ) THEN '✅ INSERT CON VALIDACIÓN'
        ELSE '❌ INSERT SIN VALIDACIÓN'
    END as profiles_insert_policy,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'facturas' 
              AND cmd = 'SELECT' 
              AND qual IS NOT NULL
        ) THEN '✅ SELECT CON RESTRICCIÓN'
        ELSE '❌ SELECT SIN RESTRICCIÓN'
    END as facturas_select_policy,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'get_user_role_from_jwt'
        ) THEN '✅ FUNCIÓN JWT IMPLEMENTADA'
        ELSE '❌ FUNCIÓN JWT FALTANTE'
    END as jwt_functions,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'profiles'
              AND column_name = 'role'
              AND data_type = 'USER-DEFINED'
        ) THEN '✅ ROLE ES ENUM'
        ELSE '❌ ROLE NO ES ENUM'
    END as role_enum_type;
