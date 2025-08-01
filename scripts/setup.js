#!/usr/bin/env node

/**
 * ContaPYME - Script de Configuración Automática
 * 
 * Este script ayuda a configurar ContaPYME automáticamente:
 * - Verifica requisitos del sistema
 * - Configura variables de entorno
 * - Verifica conexión a Supabase
 * - Ejecuta verificación de migración
 */

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
  magenta: '\x1b[35m',
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

async function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    logError(`Node.js versión ${version} detectada. Se requiere Node.js 18 o superior.`);
    process.exit(1);
  }
  
  logSuccess(`Node.js ${version} detectado`);
}

async function checkPackageManager() {
  try {
    const packageLockExists = fs.existsSync('package-lock.json');
    const yarnLockExists = fs.existsSync('yarn.lock');
    
    if (packageLockExists) {
      logSuccess('npm detectado como gestor de paquetes');
      return 'npm';
    } else if (yarnLockExists) {
      logSuccess('yarn detectado como gestor de paquetes');
      return 'yarn';
    } else {
      logWarning('No se detectó gestor de paquetes. Usando npm por defecto.');
      return 'npm';
    }
  } catch (error) {
    logError('Error verificando gestor de paquetes');
    return 'npm';
  }
}

async function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nodeModulesExists = fs.existsSync('node_modules');
    
    if (!nodeModulesExists) {
      logWarning('Dependencias no instaladas. Ejecutando npm install...');
      return false;
    }
    
    logSuccess('Dependencias instaladas');
    return true;
  } catch (error) {
    logError('Error verificando dependencias');
    return false;
  }
}

async function checkEnvironmentFile() {
  const envExists = fs.existsSync('.env');
  
  if (!envExists) {
    logWarning('Archivo .env no encontrado');
    
    const envExamplePath = path.join(__dirname, '../config/env.example');
    if (fs.existsSync(envExamplePath)) {
      try {
        fs.copyFileSync(envExamplePath, '.env');
        logSuccess('Archivo .env creado desde ejemplo');
        logInfo('Por favor, edita .env con tus valores de Supabase');
        return false;
      } catch (error) {
        logError('Error creando archivo .env');
        return false;
      }
    } else {
      logError('Archivo env.example no encontrado');
      return false;
    }
  }
  
  logSuccess('Archivo .env encontrado');
  return true;
}

async function checkSupabaseConfig() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    
    let supabaseUrl = '';
    let supabaseKey = '';
    
    for (const line of lines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1].trim();
      }
    }
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      logWarning('URL de Supabase no configurada en .env');
      return false;
    }
    
    if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
      logWarning('Clave anónima de Supabase no configurada en .env');
      return false;
    }
    
    logSuccess('Configuración de Supabase encontrada');
    return { supabaseUrl, supabaseKey };
  } catch (error) {
    logError('Error leyendo configuración de Supabase');
    return false;
  }
}

async function testSupabaseConnection(config) {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Test simple de conexión
    const { data, error } = await supabase
      .from('productos')
      .select('id')
      .limit(1);
    
    if (error) {
      logWarning('Conexión a Supabase establecida, pero hay errores en la base de datos');
      logInfo('Esto es normal si la migración no se ha ejecutado aún');
      return true;
    }
    
    logSuccess('Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    logError('Error conectando a Supabase');
    logInfo('Verifica tu URL y clave en el archivo .env');
    return false;
  }
}

async function checkDatabaseMigration() {
  try {
    const { execSync } = await import('child_process');
    const result = execSync('node scripts/verify.js', { encoding: 'utf8' });
    
    if (result.includes('✅') && !result.includes('❌')) {
      logSuccess('Migración de base de datos verificada');
      return true;
    } else {
      logWarning('Migración de base de datos incompleta');
      logInfo('Ejecuta la migración manualmente siguiendo docs/MIGRATION.md');
      return false;
    }
  } catch (error) {
    logWarning('No se pudo verificar la migración de base de datos');
    logInfo('Ejecuta manualmente: node scripts/verify.js');
    return false;
  }
}

async function main() {
  log('🚀 ContaPYME - Configuración Automática', 'bright');
  log('='.repeat(50), 'cyan');
  
  try {
    // 1. Verificar Node.js
    await checkNodeVersion();
    
    // 2. Verificar gestor de paquetes
    const packageManager = await checkPackageManager();
    
    // 3. Verificar dependencias
    const depsInstalled = await checkDependencies();
    if (!depsInstalled) {
      logInfo('Ejecuta: npm install');
      process.exit(1);
    }
    
    // 4. Verificar archivo .env
    const envConfigured = await checkEnvironmentFile();
    
    // 5. Verificar configuración de Supabase
    const supabaseConfig = await checkSupabaseConfig();
    if (!supabaseConfig) {
      logInfo('Configura .env con tus valores de Supabase');
      logInfo('Luego ejecuta: node scripts/setup.js');
      process.exit(1);
    }
    
    // 6. Probar conexión a Supabase
    const connectionOk = await testSupabaseConnection(supabaseConfig);
    if (!connectionOk) {
      logInfo('Verifica tu configuración de Supabase');
      process.exit(1);
    }
    
    // 7. Verificar migración de base de datos
    const migrationOk = await checkDatabaseMigration();
    
    log('='.repeat(50), 'cyan');
    
    if (migrationOk) {
      logSuccess('¡ContaPYME está completamente configurado!');
      logInfo('Ejecuta: npm run dev');
      logInfo('Abre: http://localhost:5173');
    } else {
      logWarning('ContaPYME está parcialmente configurado');
      logInfo('Completa la migración de base de datos:');
      logInfo('1. Sigue docs/MIGRATION.md');
      logInfo('2. Ejecuta: node scripts/verify.js');
      logInfo('3. Luego: npm run dev');
    }
    
  } catch (error) {
    logError('Error durante la configuración');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main; 