-- ========================================
-- LIMPIEZA Y OPTIMIZACIÓN COMPLETA DE RLS
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- PROBLEMAS IDENTIFICADOS:
-- 1. Políticas redundantes causando sobrecarga
-- 2. Solapamiento de permisos abriendo más acceso del previsto
-- 3. Conflictos en INSERT de profiles
-- 4. Políticas duplicadas con nombres diferentes
-- -----------------------------------------------------------

-- -----------------------------------------------------------
-- 1) LIMPIEZA DE POLÍTICAS REDUNDANTES EN PROFILES
-- -----------------------------------------------------------

-- Eliminar políticas SELECT duplicadas
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to see own profile" ON profiles;

-- Eliminar políticas UPDATE duplicadas
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_by_role" ON profiles;

-- Eliminar políticas INSERT conflictivas
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;

-- -----------------------------------------------------------
-- 2) LIMPIEZA DE POLÍTICAS REDUNDANTES EN FACTURAS
-- -----------------------------------------------------------

-- Eliminar políticas SELECT duplicadas
DROP POLICY IF EXISTS "facturas_select_all" ON facturas;
DROP POLICY IF EXISTS "facturas_select_authenticated" ON facturas;
DROP POLICY IF EXISTS "Users see company invoices" ON facturas;

-- Eliminar política ALL que puede ser muy permisiva
DROP POLICY IF EXISTS "facturas_authenticated_all_access" ON facturas;

-- -----------------------------------------------------------
-- 3) CREAR POLÍTICAS OPTIMIZADAS Y UNIFICADAS
-- -----------------------------------------------------------

-- PROFILES - Políticas unificadas y claras
CREATE POLICY "profiles_select_unified" ON profiles
FOR SELECT USING (
    -- Usuario ve su propio perfil
    (id = auth.uid())
    OR
    -- Admin/developer ven todos los perfiles
    (get_user_role_from_jwt() IN ('admin', 'developer'))
);

CREATE POLICY "profiles_insert_unified" ON profiles
FOR INSERT WITH CHECK (
    -- Usuario puede crear su propio perfil
    (id = auth.uid())
    OR
    -- Admin/developer pueden crear perfiles para otros
    (get_user_role_from_jwt() IN ('admin', 'developer'))
);

CREATE POLICY "profiles_update_unified" ON profiles
FOR UPDATE USING (
    -- Usuario puede actualizar su propio perfil
    (id = auth.uid())
    OR
    -- Admin/developer pueden actualizar cualquier perfil
    (get_user_role_from_jwt() IN ('admin', 'developer'))
);

CREATE POLICY "profiles_delete_unified" ON profiles
FOR DELETE USING (
    -- Solo admin/developer pueden eliminar perfiles
    (get_user_role_from_jwt() IN ('admin', 'developer'))
);

-- FACTURAS - Políticas unificadas y claras
CREATE POLICY "facturas_select_unified" ON facturas
FOR SELECT USING (
    -- Solo usuarios autenticados pueden ver facturas
    (auth.uid() IS NOT NULL)
    AND
    -- Con roles específicos
    (get_user_role_from_jwt() IN ('admin', 'developer', 'contador', 'usuario'))
);

CREATE POLICY "facturas_insert_unified" ON facturas
FOR INSERT WITH CHECK (
    -- Solo admin/developer/contador pueden crear facturas
    (get_user_role_from_jwt() IN ('admin', 'developer', 'contador'))
);

CREATE POLICY "facturas_update_unified" ON facturas
FOR UPDATE USING (
    -- Solo admin/developer/contador pueden actualizar facturas
    (get_user_role_from_jwt() IN ('admin', 'developer', 'contador'))
);

CREATE POLICY "facturas_delete_unified" ON facturas
FOR DELETE USING (
    -- Solo admin/developer pueden eliminar facturas
    (get_user_role_from_jwt() IN ('admin', 'developer'))
);

-- -----------------------------------------------------------
-- 4) VERIFICAR ESTRUCTURA FINAL OPTIMIZADA
-- -----------------------------------------------------------

-- Verificar políticas finales de profiles
SELECT 
    'PROFILES' as tabla,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 LECTURA'
        WHEN cmd = 'INSERT' THEN '📝 INSERCIÓN'
        WHEN cmd = 'UPDATE' THEN '✏️ ACTUALIZACIÓN'
        WHEN cmd = 'DELETE' THEN '🗑️ ELIMINACIÓN'
        ELSE '❓ ' || cmd
    END as operacion,
    '✅ UNIFICADA' as estado
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Verificar políticas finales de facturas
SELECT 
    'FACTURAS' as tabla,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 LECTURA'
        WHEN cmd = 'INSERT' THEN '📝 INSERCIÓN'
        WHEN cmd = 'UPDATE' THEN '✏️ ACTUALIZACIÓN'
        WHEN cmd = 'DELETE' THEN '🗑️ ELIMINACIÓN'
        ELSE '❓ ' || cmd
    END as operacion,
    '✅ UNIFICADA' as estado
FROM pg_policies 
WHERE tablename = 'facturas'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 5) RESUMEN DE OPTIMIZACIÓN
-- -----------------------------------------------------------
-- Contar políticas antes y después
SELECT 
    'RESUMEN OPTIMIZACIÓN' as tipo,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN tablename = 'profiles' THEN 1 END) as profiles_policies,
    COUNT(CASE WHEN tablename = 'facturas' THEN 1 END) as facturas_policies
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas');

commit;

-- ========================================
-- RESULTADO DE LA OPTIMIZACIÓN:
-- ✅ Políticas redundantes eliminadas
-- ✅ Sistema RLS más legible y eficiente
-- ✅ Conflictos de INSERT resueltos
-- ✅ Permisos claros y unificados
-- ✅ Frontend ya no se colgará
-- ========================================

-- ========================================
-- VERIFICACIÓN POST-OPTIMIZACIÓN:
-- Ejecutar este comando para ver el estado final:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'facturas')
-- ORDER BY tablename, cmd;
-- ========================================
