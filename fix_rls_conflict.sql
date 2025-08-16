-- ========================================
-- CORRECCIÓN: CONFLICTO DE POLÍTICAS RLS EN PROFILES
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- PROBLEMA IDENTIFICADO:
-- Hay DOS políticas INSERT en profiles que están en CONFLICTO:
-- 1. profiles_insert_admin_only (solo admin/developer)
-- 2. profiles_insert_authenticated (usuarios autenticados)
-- 
-- Esto causa el bloqueo del frontend en "Creating profile for user..."
-- -----------------------------------------------------------

-- -----------------------------------------------------------
-- 1) ELIMINAR POLÍTICAS CONFLICTIVAS
-- -----------------------------------------------------------
-- Eliminar la política restrictiva que solo permite admin/developer
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;

-- Eliminar la política permisiva que permite usuarios autenticados
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;

-- -----------------------------------------------------------
-- 2) CREAR UNA SOLA POLÍTICA INSERT CORRECTA
-- -----------------------------------------------------------
-- Política que permite a usuarios autenticados crear su propio perfil
-- Y a admin/developer crear perfiles para otros usuarios
CREATE POLICY "profiles_insert_correct" ON profiles
FOR INSERT WITH CHECK (
    -- Usuario puede crear su propio perfil
    (id = auth.uid())
    OR
    -- Admin/developer puede crear perfiles para otros
    (get_user_role_from_jwt() IN ('admin', 'developer'))
);

-- -----------------------------------------------------------
-- 3) VERIFICAR QUE NO HAY DUPLICADOS
-- -----------------------------------------------------------
-- Verificar políticas INSERT en profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ INSERT CORREGIDO'
        ELSE '✅ ' || cmd
    END as estado
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT'
ORDER BY policyname;

-- -----------------------------------------------------------
-- 4) VERIFICAR ESTADO FINAL DE PROFILES
-- -----------------------------------------------------------
-- Mostrar todas las políticas de profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 LECTURA'
        WHEN cmd = 'INSERT' THEN '📝 INSERCIÓN'
        WHEN cmd = 'UPDATE' THEN '✏️ ACTUALIZACIÓN'
        WHEN cmd = 'DELETE' THEN '🗑️ ELIMINACIÓN'
        ELSE '❓ ' || cmd
    END as operacion
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

commit;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ Una sola política INSERT en profiles
-- ✅ Usuarios pueden crear su propio perfil
-- ✅ Admin/developer pueden crear perfiles para otros
-- ✅ Frontend ya no se colgará en "Creating profile for user..."
-- ========================================
