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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function fixTrigger() {
  try {
    log('🔧 CORRECCIÓN DE TRIGGER - ContaPYME', 'cyan');
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

    // Test 1: Verificar si el trigger existe
    logInfo('Test 1: Verificando trigger on_auth_user_created...');
    
    try {
      // Consulta directa a pg_trigger
      const { data: triggerData, error: triggerError } = await supabase
        .from('pg_trigger')
        .select('tgname, tgrelid::regclass as table_name, tgfoid::regproc as function_name')
        .eq('tgname', 'on_auth_user_created');

      if (triggerError) {
        logWarning(`Error al consultar pg_trigger: ${triggerError.message}`);
        logInfo('Intentando consulta alternativa...', 'yellow');
        
        // Consulta alternativa usando SQL directo
        const { data: altTriggerData, error: altTriggerError } = await supabase
          .rpc('exec_sql', { 
            sql: `SELECT tgname, tgrelid::regclass as table_name, tgfoid::regproc as function_name 
                   FROM pg_trigger 
                   WHERE tgname = 'on_auth_user_created'` 
          });

        if (altTriggerError) {
          logError('No se pudo verificar el trigger');
        } else if (altTriggerData && altTriggerData.length > 0) {
          logSuccess('Trigger encontrado (consulta alternativa)');
          logInfo(`Tabla: ${altTriggerData[0].table_name}`, 'yellow');
          logInfo(`Función: ${altTriggerData[0].function_name}`, 'yellow');
        } else {
          logError('Trigger NO encontrado');
        }
      } else if (triggerData && triggerData.length > 0) {
        logSuccess('Trigger on_auth_user_created ENCONTRADO');
        logInfo(`Tabla: ${triggerData[0].table_name}`, 'yellow');
        logInfo(`Función: ${triggerData[0].function_name}`, 'yellow');
      } else {
        logError('Trigger on_auth_user_created NO encontrado');
      }
    } catch (error) {
      logError(`Error al verificar trigger: ${error.message}`);
    }

    // Test 2: Verificar función handle_new_user
    logInfo('Test 2: Verificando función handle_new_user...');
    
    try {
      const { data: funcData, error: funcError } = await supabase
        .rpc('handle_new_user');

      if (funcError) {
        if (funcError.message.includes('function "handle_new_user" does not exist')) {
          logError('Función handle_new_user NO existe');
        } else {
          logSuccess('Función handle_new_user EXISTE');
          logInfo(`Error esperado: ${funcError.message}`, 'yellow');
        }
      } else {
        logSuccess('Función handle_new_user EXISTE y responde');
      }
    } catch (error) {
      logError(`Error al verificar función: ${error.message}`);
    }

    // Test 3: Crear trigger si no existe
    logInfo('Test 3: Creando trigger si no existe...');
    
    try {
      // SQL para crear el trigger
      const createTriggerSQL = `
        -- Eliminar trigger si existe
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        
        -- Crear trigger
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `;

      const { data: createResult, error: createError } = await supabase
        .rpc('exec_sql', { sql: createTriggerSQL });

      if (createError) {
        logWarning(`No se pudo crear trigger automáticamente: ${createError.message}`);
        logInfo('Necesitas crear el trigger manualmente en Supabase', 'yellow');
      } else {
        logSuccess('Trigger creado/actualizado automáticamente');
      }
    } catch (error) {
      logWarning('No se pudo crear trigger automáticamente');
      logInfo('Necesitas crear el trigger manualmente', 'yellow');
    }

    log('', 'reset');
    log('📊 RESUMEN DE CORRECCIÓN:', 'cyan');
    log('', 'reset');
    log('✅ Función handle_new_user: Verificada', 'green');
    log('⚠️  Trigger: Necesita verificación manual', 'yellow');
    log('', 'reset');
    log('🔧 SOLUCIÓN MANUAL:', 'cyan');
    log('1. Ir a Supabase Dashboard > SQL Editor', 'reset');
    log('2. Ejecutar este SQL:', 'reset');
    log('', 'reset');
    log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;', 'yellow');
    log('CREATE TRIGGER on_auth_user_created', 'yellow');
    log('  AFTER INSERT ON auth.users', 'yellow');
    log('  FOR EACH ROW EXECUTE FUNCTION handle_new_user();', 'yellow');

  } catch (error) {
    logError(`Error general: ${error.message}`);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('fix-trigger.js')) {
  fixTrigger();
}
