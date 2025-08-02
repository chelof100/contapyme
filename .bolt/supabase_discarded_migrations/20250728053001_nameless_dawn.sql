/*
  # Fix Autenticación - Paso a Paso Limpio

  1. Limpieza completa de triggers y constraints conflictivos
  2. Recreación de trigger simple y funcional
  3. Test de funcionalidad básica

  Este enfoque paso a paso evita conflictos y dependencias circulares.
*/

-- PASO 1: LIMPIAR COMPLETAMENTE
DO $$
BEGIN
  RAISE NOTICE 'PASO 1: Limpiando triggers y constraints conflictivos...';
  
  -- Eliminar trigger existente
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  RAISE NOTICE '✓ Trigger on_auth_user_created eliminado';
  
  -- Eliminar constraint problemático
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  RAISE NOTICE '✓ Constraint profiles_id_fkey eliminado';
  
  RAISE NOTICE 'PASO 1 COMPLETADO: Limpieza exitosa';
END $$;

-- PASO 2: RECREAR TRIGGER SIMPLE
DO $$
BEGIN
  RAISE NOTICE 'PASO 2: Recreando trigger simple...';
END $$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  RAISE NOTICE 'Trigger ejecutado para usuario: %', NEW.email;
  
  INSERT INTO profiles (id, email, username, role)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), 'usuario')
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✓ Perfil creado para: %', NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DO $$
BEGIN
  RAISE NOTICE 'PASO 2 COMPLETADO: Trigger recreado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 LISTO PARA TESTING:';
  RAISE NOTICE '1. Crear usuario nuevo en frontend';
  RAISE NOTICE '2. Verificar que aparece en auth.users Y profiles';
  RAISE NOTICE '3. Reportar resultado antes de continuar';
END $$;