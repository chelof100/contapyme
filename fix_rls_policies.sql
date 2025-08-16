-- Script para corregir políticas RLS de profiles
-- Ejecutar en Supabase SQL Editor

-- 1. Crear política RLS para INSERT en profiles
CREATE POLICY "profiles_insert_authenticated" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Comentar políticas problemáticas si es necesario
-- DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;
-- DROP POLICY IF EXISTS "profiles_update_by_role" ON profiles;
-- DROP POLICY IF EXISTS "profiles_delete_admin_only" ON profiles;
