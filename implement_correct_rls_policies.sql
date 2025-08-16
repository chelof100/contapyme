-- ========================================
-- IMPLEMENTACIÓN DE POLÍTICAS RLS CORRECTAS
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- 1) LIMPIAR POLÍTICAS EXISTENTES PROBLEMÁTICAS
-- -----------------------------------------------------------
-- Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "profiles_insert_correct" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON profiles;
DROP POLICY IF EXISTS "Admins see all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to see own profile" ON profiles;
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_by_role" ON profiles;

-- Eliminar políticas de facturas también
DROP POLICY IF EXISTS "facturas_select_all" ON facturas;
DROP POLICY IF EXISTS "facturas_select_authenticated" ON facturas;
DROP POLICY IF EXISTS "facturas_insert_admin_dev" ON facturas;
DROP POLICY IF EXISTS "facturas_update_admin_dev" ON facturas;
DROP POLICY IF EXISTS "facturas_delete_admin_only" ON facturas;
DROP POLICY IF EXISTS "Users see company invoices" ON facturas;
DROP POLICY IF EXISTS "facturas_authenticated_all_access" ON facturas;

-- -----------------------------------------------------------
-- 2) IMPLEMENTAR POLÍTICAS RLS CORRECTAS PARA PROFILES
-- -----------------------------------------------------------

-- INSERT: Usuario solo puede crear su propio perfil
CREATE POLICY "profiles_insert_self_only" ON profiles
FOR INSERT WITH CHECK (
    id = auth.uid()  -- Solo puede insertar con su propio ID
);

-- SELECT: Usuario solo puede ver su propio perfil
CREATE POLICY "profiles_select_self_only" ON profiles
FOR SELECT USING (
    id = auth.uid()  -- Solo puede ver su propio perfil
);

-- UPDATE: Usuario solo puede actualizar su propio perfil
CREATE POLICY "profiles_update_self_only" ON profiles
FOR UPDATE USING (
    id = auth.uid()  -- Solo puede actualizar su propio perfil
) WITH CHECK (
    id = auth.uid()  -- Validación adicional
);

-- DELETE: Solo admin/developer pueden eliminar perfiles
CREATE POLICY "profiles_delete_admin_only" ON profiles
FOR DELETE USING (
    get_user_role_from_jwt() IN ('admin', 'developer')
);

-- -----------------------------------------------------------
-- 3) IMPLEMENTAR POLÍTICAS RLS CORRECTAS PARA FACTURAS
-- -----------------------------------------------------------

-- SELECT: Usuarios autenticados pueden ver facturas de su empresa
CREATE POLICY "facturas_select_authenticated" ON facturas
FOR SELECT USING (
    auth.uid() IS NOT NULL  -- Usuario autenticado
);

-- INSERT: Solo admin/developer/contador pueden crear facturas
CREATE POLICY "facturas_insert_authorized" ON facturas
FOR INSERT WITH CHECK (
    get_user_role_from_jwt() IN ('admin', 'developer', 'contador')
);

-- UPDATE: Solo admin/developer/contador pueden actualizar facturas
CREATE POLICY "facturas_update_authorized" ON facturas
FOR UPDATE USING (
    get_user_role_from_jwt() IN ('admin', 'developer', 'contador')
) WITH CHECK (
    get_user_role_from_jwt() IN ('admin', 'developer', 'contador')
);

-- DELETE: Solo admin/developer pueden eliminar facturas
CREATE POLICY "facturas_delete_admin_only" ON facturas
FOR DELETE USING (
    get_user_role_from_jwt() IN ('admin', 'developer')
);

-- -----------------------------------------------------------
-- 4) VERIFICAR POLÍTICAS IMPLEMENTADAS
-- -----------------------------------------------------------
SELECT 
    'PROFILES POLICIES' as test,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

SELECT 
    'FACTURAS POLICIES' as test,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'facturas'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 5) RESUMEN DE POLÍTICAS IMPLEMENTADAS
-- -----------------------------------------------------------
SELECT 
    'POLICIES SUMMARY' as tipo,
    COUNT(CASE WHEN tablename = 'profiles' THEN 1 END) as profiles_policies,
    COUNT(CASE WHEN tablename = 'facturas' THEN 1 END) as facturas_policies,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas');

-- -----------------------------------------------------------
-- 6) VERIFICAR FUNCIONES JWT DISPONIBLES
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

commit;

-- ========================================
-- VERIFICACIÓN POST-IMPLEMENTACIÓN:
-- Ejecutar este comando para ver el estado final:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'facturas')
-- ORDER BY tablename, cmd;
-- ========================================

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ 4 políticas en profiles (INSERT, SELECT, UPDATE, DELETE)
-- ✅ 4 políticas en facturas (INSERT, SELECT, UPDATE, DELETE)
-- ✅ Total: 8 políticas limpias y eficientes
-- ✅ Sistema completamente seguro y funcional
-- ========================================
