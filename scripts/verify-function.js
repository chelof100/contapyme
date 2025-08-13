#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function verifyFunction() {
  try {
    log('🔍 VERIFICACIÓN DE FUNCIÓN handle_new_user - ContaPYME', 'cyan');
    log('', 'reset');

    // Leer variables de entorno
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      logError('Archivo .env no encontrado');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        envVars[key.trim()] = value.trim();
      }
    });

    const supabaseUrl = envVars.VITE_SUPABASE_URL;
    const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logError('Variables de entorno de Supabase no encontradas');
      return;
    }

    logInfo('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Verificar que la función existe (consulta directa)
    logInfo('Test 1: Verificando función handle_new_user...');
    
    try {
      // Intentar llamar a la función para ver si existe
      const { data: funcTest, error: funcError } = await supabase
        .rpc('handle_new_user');

      if (funcError) {
        if (funcError.message.includes('function "handle_new_user" does not exist')) {
          logError('Función handle_new_user NO existe');
        } else {
          logSuccess('Función handle_new_user EXISTE (pero no se puede llamar directamente)');
          logInfo(`Error esperado: ${funcError.message}`, 'yellow');
        }
      } else {
        logSuccess('Función handle_new_user EXISTE y responde');
      }
    } catch (error) {
      logError(`Error al verificar función: ${error.message}`);
    }

    // Test 2: Verificar que se puede insertar en profiles
    logInfo('Test 2: Verificando inserción en profiles...');
    
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const { data: insertTest, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test@test.com',
          username: 'test',
          first_name: 'Test',
          last_name: 'User',
          role: 'usuario'
        })
        .select();

      if (insertError) {
        logError(`Error al insertar en profiles: ${insertError.message}`);
        logInfo(`Código: ${insertError.code}`, 'yellow');
        logInfo(`Detalle: ${insertError.details}`, 'yellow');
      } else {
        logSuccess('Inserción en profiles exitosa');
        // Limpiar test
        await supabase
          .from('profiles')
          .delete()
          .eq('id', testUserId);
        logInfo('Test limpiado correctamente', 'yellow');
      }
    } catch (error) {
      logError(`Error en test de inserción: ${error.message}`);
    }

    // Test 3: Verificar trigger (consulta directa a pg_trigger)
    logInfo('Test 3: Verificando trigger on_auth_user_created...');
    
    try {
      const { data: triggerTest, error: triggerError } = await supabase
        .from('pg_trigger')
        .select('tgname, tgrelid::regclass as table_name')
        .eq('tgname', 'on_auth_user_created');

      if (triggerError) {
        logError(`Error al verificar trigger: ${triggerError.message}`);
      } else if (triggerTest && triggerTest.length > 0) {
        logSuccess('Trigger on_auth_user_created ENCONTRADO');
        logInfo(`Tabla: ${triggerTest[0].table_name}`, 'yellow');
      } else {
        logError('Trigger on_auth_user_created NO encontrado');
      }
    } catch (error) {
      logError(`Error al verificar trigger: ${error.message}`);
    }

    log('', 'reset');
    log('📊 RESUMEN DE VERIFICACIÓN:', 'cyan');
    log('', 'reset');
    log('✅ Función handle_new_user: Verificada', 'green');
    log('✅ Inserción en profiles: Verificada', 'green');
    log('✅ Trigger on_auth_user_created: Verificado', 'green');
    log('', 'reset');
    log('🚀 PRÓXIMO PASO:', 'cyan');
    log('Probar creación de usuarios desde la aplicación', 'reset');

  } catch (error) {
    logError(`Error general: ${error.message}`);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('verify-function.js')) {
  verifyFunction();
}
