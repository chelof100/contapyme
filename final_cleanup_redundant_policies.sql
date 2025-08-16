-- ========================================
-- LIMPIEZA FINAL: POLÍTICAS REDUNDANTES RESTANTES
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- PROBLEMA IDENTIFICADO:
-- Aunque se aplicó la optimización, persisten políticas redundantes:
-- 1. SELECT: 3 políticas que hacen lo mismo
-- 2. UPDATE: 2 políticas que se solapan
-- 3. Solo INSERT y DELETE están correctamente unificados
-- -----------------------------------------------------------

-- -----------------------------------------------------------
-- 1) ELIMINAR POLÍTICAS SELECT REDUNDANTES EN PROFILES
-- -----------------------------------------------------------

-- Eliminar política duplicada
DROP POLICY IF EXISTS "Users see own profile" ON profiles;

-- Eliminar política redundante (ya tenemos "Allow users to see own profile")
DROP POLICY IF EXISTS "Admins see all profiles" ON profiles;

-- -----------------------------------------------------------
-- 2) ELIMINAR POLÍTICAS UPDATE REDUNDANTES EN PROFILES
-- -----------------------------------------------------------

-- Eliminar política que se solapa (ya tenemos "profiles_update_by_role" que cubre ambos casos)
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- -----------------------------------------------------------
-- 3) VERIFICAR ESTRUCTURA FINAL LIMPIA
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
    CASE 
        WHEN cmd = 'INSERT' AND policyname = 'profiles_insert_correct' THEN '✅ UNIFICADA'
        WHEN cmd = 'SELECT' AND policyname = 'Allow users to see own profile' THEN '✅ UNIFICADA'
        WHEN cmd = 'UPDATE' AND policyname = 'profiles_update_by_role' THEN '✅ UNIFICADA'
        WHEN cmd = 'DELETE' AND policyname = 'profiles_delete_admin_only' THEN '✅ UNIFICADA'
        ELSE '❌ REDUNDANTE'
    END as estado
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------
-- 4) RESUMEN FINAL DE OPTIMIZACIÓN
-- -----------------------------------------------------------
-- Contar políticas finales
SELECT 
    'RESUMEN FINAL' as tipo,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN tablename = 'profiles' THEN 1 END) as profiles_policies,
    COUNT(CASE WHEN tablename = 'facturas' THEN 1 END) as facturas_policies
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'facturas');

commit;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ 4 políticas en profiles (1 por operación)
-- ✅ 7 políticas en facturas (ya optimizadas)
-- ✅ Total: 11 políticas (no 14)
-- ✅ Sistema completamente limpio y eficiente
-- ========================================

-- ========================================
-- VERIFICACIÓN POST-LIMPIEZA:
-- Ejecutar este comando para ver el estado final:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'facturas')
-- ORDER BY tablename, cmd;
-- ========================================
