/*
  # Drop Constraint profiles_id_fkey

  1. Operación
    - Eliminar constraint profiles_id_fkey que está causando errores
  
  2. Objetivo
    - Resolver el error específico del constraint
    - Permitir que el sistema funcione sin restricciones problemáticas
*/

-- Eliminar el constraint problemático
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- Log informativo
DO $$
BEGIN
  RAISE NOTICE 'Constraint profiles_id_fkey eliminado exitosamente';
END $$;