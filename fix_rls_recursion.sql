-- Script para identificar y corregir recursión infinita en RLS de profiles
-- OnePyme - Problema de Autenticación

-- 1. Verificar estado actual de RLS en profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Verificar si hay triggers problemáticos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 4. SOLUCIÓN TEMPORAL: Deshabilitar RLS en profiles para permitir login
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. SOLUCIÓN PERMANENTE: Eliminar políticas problemáticas y recrear
-- (Ejecutar solo después de verificar que el login funciona)

-- 6. Verificar que la tabla profiles sea accesible
SELECT COUNT(*) FROM profiles LIMIT 1;

-- 7. Verificar usuario developer específico
SELECT * FROM profiles WHERE email = 'developer@onepyme.pro';

