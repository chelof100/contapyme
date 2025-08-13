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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkMigrations() {
  try {
    log('🔍 VERIFICACIÓN DE MIGRACIONES - ContaPYME', 'cyan');
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

    // Test 1: Verificar función handle_new_user
    logInfo('Test 1: Verificando función handle_new_user...');
    
    const { data: funcData, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, data_type')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'handle_new_user');

    if (funcError) {
      logError(`Error al verificar función: ${funcError.message}`);
    } else if (funcData && funcData.length > 0) {
      logSuccess('Función handle_new_user encontrada');
      logInfo(`Tipo: ${funcData[0].routine_type}`, 'yellow');
      logInfo(`Retorna: ${funcData[0].data_type}`, 'yellow');
    } else {
      logError('Función handle_new_user NO encontrada');
    }

    // Test 2: Verificar trigger on_auth_user_created
    logInfo('Test 2: Verificando trigger on_auth_user_created...');
    
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('trigger_schema', 'auth')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError) {
      logError(`Error al verificar trigger: ${triggerError.message}`);
    } else if (triggerData && triggerData.length > 0) {
      logSuccess('Trigger on_auth_user_created encontrado');
      triggerData.forEach(trigger => {
        logInfo(`- ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`, 'yellow');
      });
    } else {
      logError('Trigger on_auth_user_created NO encontrado');
    }

    // Test 3: Verificar tabla de migraciones (si existe)
    logInfo('Test 3: Verificando tabla de migraciones...');
    
    const { data: migrationData, error: migrationError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'schema_migrations');

    if (migrationError) {
      logWarning('No se pudo verificar tabla de migraciones');
    } else if (migrationData && migrationData.length > 0) {
      logSuccess('Tabla schema_migrations encontrada');
      
      // Verificar migraciones aplicadas
      const { data: appliedMigrations, error: appliedError } = await supabase
        .from('schema_migrations')
        .select('*')
        .order('version', { ascending: true });

      if (appliedError) {
        logWarning('No se pudo verificar migraciones aplicadas');
      } else if (appliedMigrations) {
        logInfo(`Migraciones aplicadas: ${appliedMigrations.length}`, 'yellow');
        appliedMigrations.forEach(migration => {
          logInfo(`- ${migration.version}`, 'yellow');
        });
      }
    } else {
      logWarning('Tabla schema_migrations no encontrada');
    }

    // Test 4: Verificar funciones del sistema
    logInfo('Test 4: Verificando funciones del sistema...');
    
    const systemFunctions = [
      'get_active_empresa_id',
      'update_global_empresa_id',
      'assign_empresa_to_user',
      'is_developer',
      'is_admin_or_developer'
    ];

    for (const funcName of systemFunctions) {
      const { data: sysFuncData, error: sysFuncError } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_schema', 'public')
        .eq('routine_name', funcName);

      if (sysFuncError) {
        logWarning(`Error al verificar ${funcName}: ${sysFuncError.message}`);
      } else if (sysFuncData && sysFuncData.length > 0) {
        logSuccess(`Función ${funcName} encontrada`);
      } else {
        logError(`Función ${funcName} NO encontrada`);
      }
    }

    log('', 'reset');
    log('📊 RESUMEN DE VERIFICACIÓN:', 'cyan');
    log('', 'reset');
    
    if (funcData && funcData.length > 0) {
      logSuccess('✅ Función handle_new_user: ENCONTRADA');
    } else {
      logError('❌ Función handle_new_user: NO ENCONTRADA');
    }
    
    if (triggerData && triggerData.length > 0) {
      logSuccess('✅ Trigger on_auth_user_created: ENCONTRADO');
    } else {
      logError('❌ Trigger on_auth_user_created: NO ENCONTRADO');
    }

    log('', 'reset');
    log('🔧 SOLUCIÓN RECOMENDADA:', 'cyan');
    log('1. Ejecutar migración 20250201000027_system_functions.sql', 'reset');
    log('2. Verificar que se cree la función handle_new_user', 'reset');
    log('3. Verificar que se cree el trigger on_auth_user_created', 'reset');
    log('4. Probar creación de usuarios nuevamente', 'reset');

  } catch (error) {
    logError(`Error general: ${error.message}`);
    logError(`Stack: ${error.stack}`);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('check-migrations.js')) {
  checkMigrations();
}
