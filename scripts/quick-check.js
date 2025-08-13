#!/usr/bin/env node

/**
 * 🔍 ContaPYME - Verificación Rápida del Sistema
 * 
 * Script rápido para verificar el estado de ContaPYME
 * en menos de 30 segundos.
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

// Banner
function showBanner() {
  log(`
${colors.bright}${colors.cyan}
🔍 VERIFICACIÓN RÁPIDA - ContaPYME
${colors.reset}
`, 'cyan');
}

// Verificar archivo .env
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('Archivo .env no encontrado');
    logInfo('Ejecuta: cp env.example .env');
    return false;
  }
  
  logSuccess('Archivo .env encontrado');
  return true;
}

// Verificar variables de entorno
function checkEnvVariables() {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let missing = [];
    required.forEach(key => {
      if (!envVars[key] || envVars[key] === 'tu_url_de_supabase') {
        missing.push(key);
      }
    });
    
    if (missing.length > 0) {
      logError(`Variables faltantes: ${missing.join(', ')}`);
      logInfo('Edita el archivo .env con tus credenciales');
      return false;
    }
    
    logSuccess('Variables de entorno configuradas');
    return true;
    
  } catch (error) {
    logError('Error leyendo archivo .env');
    return false;
  }
}

// Verificar conexión a Supabase
async function checkSupabaseConnection() {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
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
      logWarning('No se puede verificar Supabase - variables faltantes');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar conexión básica
    const { data, error } = await supabase.from('empresa').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        logWarning('Tabla empresa no existe - ejecuta migraciones');
      } else {
        logWarning(`Error de conexión: ${error.message}`);
      }
      return false;
    }
    
    logSuccess('Conexión a Supabase verificada');
    return true;
    
  } catch (error) {
    logWarning('No se pudo verificar Supabase');
    return false;
  }
}

// Verificar estructura del proyecto
function checkProjectStructure() {
  const requiredDirs = ['src', 'supabase', 'docs'];
  const requiredFiles = ['package.json', 'vite.config.ts'];
  
  let allGood = true;
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      logError(`Directorio ${dir}/ no encontrado`);
      allGood = false;
    }
  });
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      logError(`Archivo ${file} no encontrado`);
      allGood = false;
    }
  });
  
  if (allGood) {
    logSuccess('Estructura del proyecto verificada');
  }
  
  return allGood;
}

// Verificar dependencias
function checkDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json no encontrado');
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    logWarning('node_modules no encontrado - ejecuta: npm install');
    return false;
  }
  
  logSuccess('Dependencias verificadas');
  return true;
}

// Mostrar resumen
function showSummary(results) {
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const failed = total - passed;
  
  log(`
${colors.bright}${colors.cyan}📊 RESUMEN DE VERIFICACIÓN:${colors.reset}

✅ Exitosos: ${passed}/${total}
❌ Fallidos: ${failed}/${total}

${failed === 0 ? colors.green + '🎉 ¡Todo está funcionando correctamente!' : colors.yellow + '⚠️  Hay problemas que resolver' + colors.reset}
`, 'cyan');
  
  if (failed > 0) {
    log(`
${colors.yellow}🔧 PRÓXIMOS PASOS:${colors.reset}

1. Ejecuta: npm run setup
2. Verifica tu archivo .env
3. Ejecuta migraciones en Supabase
4. Ejecuta: npm run verify
`, 'yellow');
  } else {
    log(`
${colors.green}🚀 ¡ContaPYME está listo!${colors.reset}

Ejecuta: npm run dev
`, 'green');
  }
}

// Función principal
async function main() {
  try {
    showBanner();
    
    const results = {
      envFile: checkEnvFile(),
      envVariables: checkEnvVariables(),
      supabase: await checkSupabaseConnection(),
      structure: checkProjectStructure(),
      dependencies: checkDependencies()
    };
    
    showSummary(results);
    
  } catch (error) {
    logError('Error durante la verificación:');
    logError(error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (process.argv[1] && process.argv[1].endsWith('quick-check.js')) {
  main();
}

export { main };
