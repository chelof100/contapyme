-- Migración para corregir columna incorrecta en user_actions
-- Fecha: 2025-08-13
-- Problema: El código frontend buscaba columna 'user_id' pero la tabla tiene 'usuario_id'
-- Solución: Corregir referencias en el código frontend para usar 'usuario_id'

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- La tabla user_actions tiene la columna 'usuario_id' (UUID)
-- Pero el código frontend en userAnalyticsService.ts buscaba 'user_id'
-- Esto causaba error 400: "column user_actions.user_id does not exist"

-- =====================================================
-- ESTRUCTURA CORRECTA DE LA TABLA USER_ACTIONS
-- =====================================================
/*
CREATE TABLE user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresa(id),
  usuario_id UUID REFERENCES profiles(id),  -- ✅ COLUMNA CORRECTA
  accion TEXT NOT NULL,
  tabla TEXT,
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- =====================================================
-- CAMBIOS REALIZADOS EN EL FRONTEND
-- =====================================================
-- ✅ Archivo: src/services/userAnalyticsService.ts
-- ✅ Cambio: user_id → usuario_id en interfaces y consultas
-- ✅ Cambio: .eq('user_id', user.id) → .eq('usuario_id', user.id)

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Después de esta corrección, las consultas a user_actions deberían funcionar
-- y no deberían aparecer errores 400 por columna inexistente

-- =====================================================
-- RESUMEN
-- =====================================================
-- ✅ Columna corregida de user_id a usuario_id
-- ✅ Interfaces TypeScript actualizadas
-- ✅ Consultas Supabase corregidas
-- ✅ Error 400 en user_actions resuelto

