#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function diagnoseRLS() {
  try {
    log(`
${colors.bright}${colors.cyan}
🔍 DIAGNÓSTICO RLS - ContaPYME
${colors.reset}
`, 'cyan');

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
    const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = envVars.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      logError('Variables de entorno faltantes');
      return;
    }

    logInfo(`URL: ${supabaseUrl}`);
    logInfo(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);
    logInfo(`Anon Key: ${anonKey.substring(0, 20)}...`);

    // Test 1: Service Role Key
    log('\n🔑 TEST 1: Service Role Key');
    const supabaseService = createClient(supabaseUrl, serviceRoleKey);
    
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser();
      if (authError) {
        logWarning(`Auth error: ${authError.message}`);
      } else {
        logSuccess(`Service role auth: ${authData.user ? 'OK' : 'No user'}`);
      }
    } catch (e) {
      logWarning(`Auth test failed: ${e.message}`);
    }

    // Test 2: Tabla empresa con Service Role
    try {
      log('\n📊 TEST 2: Tabla empresa (Service Role)');
      const { data, error } = await supabaseService.from('empresa').select('*').limit(1);
      
      if (error) {
        logError(`Error empresa (Service Role): ${error.message}`);
        logError(`Código: ${error.code}`);
        logError(`Detalles: ${error.details}`);
      } else {
        logSuccess(`Empresa (Service Role): OK - ${data?.length || 0} registros`);
      }
    } catch (e) {
      logError(`Excepción empresa (Service Role): ${e.message}`);
    }

    // Test 3: Tabla profiles con Service Role
    try {
      log('\n👥 TEST 3: Tabla profiles (Service Role)');
      const { data, error } = await supabaseService.from('profiles').select('*').limit(1);
      
      if (error) {
        logError(`Error profiles (Service Role): ${error.message}`);
        logError(`Código: ${error.code}`);
        logError(`Detalles: ${error.details}`);
      } else {
        logSuccess(`Profiles (Service Role): OK - ${data?.length || 0} registros`);
      }
    } catch (e) {
      logError(`Excepción profiles (Service Role): ${e.message}`);
    }

    // Test 4: Anon Key
    log('\n🔓 TEST 4: Anon Key');
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    
    try {
      const { data, error } = await supabaseAnon.from('empresa').select('*').limit(1);
      
      if (error) {
        logWarning(`Error empresa (Anon): ${error.message}`);
      } else {
        logSuccess(`Empresa (Anon): OK - ${data?.length || 0} registros`);
      }
    } catch (e) {
      logWarning(`Excepción empresa (Anon): ${e.message}`);
    }

    // Test 5: Verificar RLS
    log('\n🔒 TEST 5: Verificar RLS');
    try {
      const { data, error } = await supabaseService.rpc('get_active_empresa_id');
      
      if (error) {
        logWarning(`Función RPC error: ${error.message}`);
      } else {
        logSuccess(`Función RPC: OK - ${data}`);
      }
    } catch (e) {
      logWarning(`RPC test failed: ${e.message}`);
    }

  } catch (error) {
    logError(`Error general: ${error.message}`);
  }
}

// Ejecutar si es llamado directamente
if (process.argv[1] && process.argv[1].endsWith('diagnose-rls.js')) {
  diagnoseRLS();
}

export { diagnoseRLS };
