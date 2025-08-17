-- ========================================
-- PASO 1: DIAGNÓSTICO COMPLETO DEL PROBLEMA
-- ========================================
-- Ejecutar en Supabase SQL Editor para ver el caos actual

-- Ver TODAS las políticas duplicadas/conflictivas
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN with_check IS NULL AND cmd = 'INSERT' THEN '❌ PROBLEMA: INSERT sin WITH CHECK'
        WHEN with_check IS NOT NULL AND cmd = 'INSERT' THEN '✅ INSERT con WITH CHECK'
        ELSE '🔍 ' || cmd
    END as status
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas', 'facturas_emitidas')
ORDER BY tablename, cmd, policyname;

-- Contar políticas duplicadas por operación
SELECT 
    tablename,
    cmd,
    COUNT(*) as num_policies,
    CASE 
        WHEN COUNT(*) > 1 THEN '❌ DUPLICADAS: ' || COUNT(*) || ' políticas'
        ELSE '✅ OK: 1 política'
    END as status
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas', 'facturas_emitidas')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
