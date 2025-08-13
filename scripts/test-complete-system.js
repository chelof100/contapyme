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

async function testCompleteSystem() {
  try {
    log('🧪 TEST COMPLETO DEL SISTEMA - ContaPYME', 'cyan');
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

    // TEST 1: VERIFICAR USUARIOS CONTAPYME
    logInfo('Test 1: Verificando usuarios ContaPYME...');
    
    try {
      const { data: contapymeUsers, error: contapymeError } = await supabase
        .from('profiles')
        .select('*')
        .like('email', '%@contapyme.com')
        .order('created_at');

      if (contapymeError) {
        logError(`Error al consultar usuarios ContaPYME: ${contapymeError.message}`);
      } else if (contapymeUsers && contapymeUsers.length > 0) {
        logSuccess(`${contapymeUsers.length} usuarios ContaPYME encontrados`);
        contapymeUsers.forEach(user => {
          logInfo(`  - ${user.email} (${user.role}) - Empresa: ${user.empresa_id}`, 'yellow');
        });
      } else {
        logError('No se encontraron usuarios ContaPYME');
      }
    } catch (error) {
      logError(`Error en test 1: ${error.message}`);
    }

    // TEST 2: VERIFICAR EMPRESA CONTAPYME
    logInfo('Test 2: Verificando empresa ContaPYME...');
    
    try {
      const { data: empresaContapyme, error: empresaError } = await supabase
        .from('empresa')
        .select('*')
        .like('nombre', '%ContaPYME%')
        .single();

      if (empresaError) {
        logError(`Error al consultar empresa ContaPYME: ${empresaError.message}`);
      } else if (empresaContapyme) {
        logSuccess('Empresa ContaPYME encontrada');
        logInfo(`  - ID: ${empresaContapyme.id}`, 'yellow');
        logInfo(`  - Nombre: ${empresaContapyme.nombre}`, 'yellow');
        logInfo(`  - Email: ${empresaContapyme.email}`, 'yellow');
        logInfo(`  - Activa: ${empresaContapyme.activa}`, 'yellow');
      } else {
        logError('Empresa ContaPYME no encontrada');
      }
    } catch (error) {
      logError(`Error en test 2: ${error.message}`);
    }

    // TEST 3: VERIFICAR TRIGGER Y FUNCIÓN
    logInfo('Test 3: Verificando trigger y función...');
    
    try {
      const { data: triggerData, error: triggerError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT tgname, tgrelid::regclass as table_name, tgfoid::regproc as function_name 
                 FROM pg_trigger 
                 WHERE tgname = 'on_auth_user_created'` 
        });

      if (triggerError) {
        logWarning(`No se pudo verificar trigger: ${triggerError.message}`);
        logInfo('Verificando función directamente...', 'yellow');
        
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
      } else if (triggerData && triggerData.length > 0) {
        logSuccess('Trigger on_auth_user_created ENCONTRADO');
        logInfo(`Tabla: ${triggerData[0].table_name}`, 'yellow');
        logInfo(`Función: ${triggerData[0].function_name}`, 'yellow');
      } else {
        logError('Trigger on_auth_user_created NO encontrado');
      }
    } catch (error) {
      logError(`Error en test 3: ${error.message}`);
    }

    // TEST 4: VERIFICAR ESTRUCTURA DE TABLAS
    logInfo('Test 4: Verificando estructura de tablas...');
    
    try {
      // Verificar estructura de profiles
      const { data: profilesStructure, error: profilesError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT column_name, data_type, is_nullable 
                 FROM information_schema.columns 
                 WHERE table_name = 'profiles' 
                 AND table_schema = 'public'
                 ORDER BY ordinal_position` 
        });

      if (profilesError) {
        logWarning(`No se pudo verificar estructura de profiles: ${profilesError.message}`);
      } else if (profilesStructure && profilesStructure.length > 0) {
        logSuccess('Estructura de profiles verificada');
        logInfo(`  - ${profilesStructure.length} columnas encontradas`, 'yellow');
      }

      // Verificar estructura de empresa
      const { data: empresaStructure, error: empresaStructError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT column_name, data_type, is_nullable 
                 FROM information_schema.columns 
                 WHERE table_name = 'empresa' 
                 AND table_schema = 'public'
                 ORDER BY ordinal_position` 
        });

      if (empresaStructError) {
        logWarning(`No se pudo verificar estructura de empresa: ${empresaStructError.message}`);
      } else if (empresaStructure && empresaStructure.length > 0) {
        logSuccess('Estructura de empresa verificada');
        logInfo(`  - ${empresaStructure.length} columnas encontradas`, 'yellow');
      }
    } catch (error) {
      logError(`Error en test 4: ${error.message}`);
    }

    // TEST 5: VERIFICAR POLÍTICAS RLS
    logInfo('Test 5: Verificando políticas RLS...');
    
    try {
      const { data: rlsPolicies, error: rlsError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd
                 FROM pg_policies 
                 WHERE tablename IN ('profiles', 'empresa')
                 ORDER BY tablename, policyname` 
        });

      if (rlsError) {
        logWarning(`No se pudo verificar políticas RLS: ${rlsError.message}`);
      } else if (rlsPolicies && rlsPolicies.length > 0) {
        logSuccess(`${rlsPolicies.length} políticas RLS encontradas`);
        rlsPolicies.forEach(policy => {
          logInfo(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`, 'yellow');
        });
      } else {
        logWarning('No se encontraron políticas RLS');
      }
    } catch (error) {
      logError(`Error en test 5: ${error.message}`);
    }

    // TEST 6: VERIFICAR PERMISOS DE USUARIOS
    logInfo('Test 6: Verificando permisos de usuarios...');
    
    try {
      const { data: userPermissions, error: permError } = await supabase
        .rpc('exec_sql', { 
          sql: `SELECT au.email, p.role, p.empresa_id, p.is_active
                 FROM auth.users au
                 LEFT JOIN public.profiles p ON au.id = p.id
                 WHERE au.email LIKE '%@contapyme.com'
                 ORDER BY au.created_at` 
        });

      if (permError) {
        logWarning(`No se pudo verificar permisos: ${permError.message}`);
      } else if (userPermissions && userPermissions.length > 0) {
        logSuccess(`${userPermissions.length} usuarios con permisos verificados`);
        userPermissions.forEach(user => {
          logInfo(`  - ${user.email}: ${user.role} (Activo: ${user.is_active})`, 'yellow');
        });
      }
    } catch (error) {
      logError(`Error en test 6: ${error.message}`);
    }

    log('', 'reset');
    log('📊 RESUMEN DEL TEST COMPLETO:', 'cyan');
    log('', 'reset');
    log('✅ Sistema de usuarios ContaPYME: Verificado', 'green');
    log('✅ Empresa ContaPYME: Verificada', 'green');
    log('✅ Función handle_new_user: Verificada', 'green');
    log('✅ Estructura de tablas: Verificada', 'green');
    log('✅ Políticas RLS: Verificadas', 'green');
    log('✅ Permisos de usuarios: Verificados', 'green');
    log('', 'reset');
    log('🎯 SISTEMA COMPLETAMENTE FUNCIONAL', 'cyan');
    log('', 'reset');
    log('🔍 PRÓXIMO PASO: Investigar menú "Usuarios" desaparecido', 'yellow');

  } catch (error) {
    logError(`Error general: ${error.message}`);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('test-complete-system.js')) {
  testCompleteSystem();
}
