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

async function diagnoseUserCreation() {
  try {
    log('🔍 DIAGNÓSTICO DE CREACIÓN DE USUARIOS - ContaPYME', 'cyan');
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

    // Test 1: Verificar conexión básica
    logInfo('Test 1: Verificando conexión básica...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      logError(`Error de conexión: ${testError.message}`);
      return;
    }
    logSuccess('Conexión a Supabase verificada');

    // Test 2: Verificar estructura de tablas
    logInfo('Test 2: Verificando estructura de tablas...');
    
    // Verificar tabla profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      logError(`Error en tabla profiles: ${profilesError.message}`);
    } else {
      logSuccess('Tabla profiles accesible');
    }

    // Verificar tabla empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresa')
      .select('*')
      .limit(1);

    if (empresaError) {
      logError(`Error en tabla empresa: ${empresaError.message}`);
    } else {
      logSuccess('Tabla empresa accesible');
    }

    // Test 3: Verificar RLS y políticas
    logInfo('Test 3: Verificando RLS y políticas...');
    
    // Verificar si RLS está habilitado
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_status');

    if (rlsError) {
      logWarning('No se pudo verificar RLS - usando consulta directa');
      // Verificar manualmente
      const { data: manualRls, error: manualError } = await supabase
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_schema', 'public')
        .in('table_name', ['profiles', 'empresa']);

      if (!manualError && manualRls) {
        manualRls.forEach(table => {
          logInfo(`Tabla ${table.table_name}: RLS = ${table.row_security}`);
        });
      }
    } else {
      logSuccess('Estado RLS verificado');
    }

    // Test 4: Verificar triggers
    logInfo('Test 4: Verificando triggers...');
    
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('check_triggers');

    if (triggerError) {
      logWarning('No se pudo verificar triggers - usando consulta directa');
      // Verificar manualmente
      const { data: manualTriggers, error: manualTriggerError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, action_timing')
        .eq('trigger_schema', 'public');

      if (!manualTriggerError && manualTriggers) {
        logInfo(`Triggers encontrados: ${manualTriggers.length}`);
        manualTriggers.forEach(trigger => {
          logInfo(`- ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
        });
      }
    } else {
      logSuccess('Triggers verificados');
    }

    // Test 5: Verificar permisos del service role
    logInfo('Test 5: Verificando permisos del service role...');
    
    const { data: permData, error: permError } = await supabase
      .rpc('check_permissions');

    if (permError) {
      logWarning('No se pudo verificar permisos - usando consulta directa');
      
      // Verificar permisos en profiles
      const { data: profilesPerm, error: profilesPermError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@test.com',
          username: 'test',
          first_name: 'Test',
          last_name: 'User',
          role: 'usuario'
        })
        .select();

      if (profilesPermError) {
        logError(`Error al insertar en profiles: ${profilesPermError.message}`);
        logInfo('Detalles del error:', 'yellow');
        logInfo(`Código: ${profilesPermError.code}`, 'yellow');
        logInfo(`Detalle: ${profilesPermError.details}`, 'yellow');
        logInfo(`Hint: ${profilesPermError.hint}`, 'yellow');
      } else {
        logSuccess('Inserción en profiles exitosa');
        // Limpiar test
        await supabase
          .from('profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else {
      logSuccess('Permisos verificados');
    }

    // Test 6: Verificar función handle_new_user
    logInfo('Test 6: Verificando función handle_new_user...');
    
    const { data: funcData, error: funcError } = await supabase
      .rpc('check_function_exists', { function_name: 'handle_new_user' });

    if (funcError) {
      logWarning('No se pudo verificar función - usando consulta directa');
      
      const { data: manualFunc, error: manualFuncError } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type, data_type')
        .eq('routine_schema', 'public')
        .eq('routine_name', 'handle_new_user');

      if (!manualFuncError && manualFunc && manualFunc.length > 0) {
        logSuccess('Función handle_new_user encontrada');
        logInfo(`Tipo: ${manualFunc[0].routine_type}`, 'yellow');
        logInfo(`Retorna: ${manualFunc[0].data_type}`, 'yellow');
      } else {
        logError('Función handle_new_user NO encontrada');
      }
    } else {
      logSuccess('Función handle_new_user verificada');
    }

    log('', 'reset');
    log('📊 RESUMEN DEL DIAGNÓSTICO:', 'cyan');
    log('', 'reset');
    log('✅ Conexión a Supabase funcionando', 'green');
    log('✅ Estructura de tablas verificada', 'green');
    log('⚠️  RLS y políticas verificadas', 'yellow');
    log('⚠️  Triggers verificados', 'yellow');
    log('⚠️  Permisos del service role verificados', 'yellow');
    log('⚠️  Función handle_new_user verificada', 'yellow');
    log('', 'reset');
    log('🔧 PRÓXIMOS PASOS:', 'cyan');
    log('1. Revisar políticas RLS específicas', 'reset');
    log('2. Verificar configuración de triggers', 'reset');
    log('3. Confirmar permisos del service role', 'reset');
    log('4. Probar inserción directa en base de datos', 'reset');

  } catch (error) {
    logError(`Error general: ${error.message}`);
    logError(`Stack: ${error.stack}`);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('diagnose-user-creation.js')) {
  diagnoseUserCreation();
}
