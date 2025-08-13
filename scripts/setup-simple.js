#!/usr/bin/env node

/**
 * 🚀 ContaPYME - Setup Automático Simplificado
 * 
 * Este script configura automáticamente ContaPYME en cualquier ordenador
 * en menos de 5 minutos.
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

function logStep(step, message) {
  log(`\n${step} ${message}`, 'cyan');
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

// Banner principal
function showBanner() {
  log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    🏢 ContaPYME Setup                       ║
║              Sistema de Contabilidad para Pymes             ║
║                        Setup Automático                     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`, 'cyan');
}

// Verificar prerrequisitos
function checkPrerequisites() {
  logStep('1️⃣', 'Verificando prerrequisitos...');
  
  // Verificar Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    logError(`Node.js 18+ requerido. Versión actual: ${nodeVersion}`);
    process.exit(1);
  }
  logSuccess(`Node.js ${nodeVersion} ✓`);
  
  // Verificar npm
  try {
    const npmVersion = require('child_process').execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} ✓`);
  } catch (error) {
    logError('npm no encontrado');
    process.exit(1);
  }
  
  // Verificar Git
  try {
    const gitVersion = require('child_process').execSync('git --version', { encoding: 'utf8' }).trim();
    logSuccess(`${gitVersion} ✓`);
  } catch (error) {
    logWarning('Git no encontrado (opcional)');
  }
  
  logSuccess('Prerrequisitos verificados ✓');
}

// Verificar archivo .env
function checkEnvironment() {
  logStep('2️⃣', 'Verificando configuración del entorno...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      logInfo('Archivo .env no encontrado. Copiando desde .env.example...');
      fs.copyFileSync(envExamplePath, envPath);
      logSuccess('Archivo .env creado desde .env.example ✓');
      logWarning('⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de Supabase');
    } else {
      logError('Archivo .env.example no encontrado');
      logInfo('Crea manualmente un archivo .env con las siguientes variables:');
      logInfo('VITE_SUPABASE_URL=tu_url_de_supabase');
      logInfo('VITE_SUPABASE_ANON_KEY=tu_anon_key');
      logInfo('VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key');
      process.exit(1);
    }
  } else {
    logSuccess('Archivo .env encontrado ✓');
  }
}

// Instalar dependencias
function installDependencies() {
  logStep('3️⃣', 'Instalando dependencias...');
  
  try {
    logInfo('Ejecutando npm install...');
    require('child_process').execSync('npm install', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Dependencias instaladas ✓');
  } catch (error) {
    logError('Error instalando dependencias');
    logInfo('Ejecuta manualmente: npm install');
    process.exit(1);
  }
}

// Verificar conexión a Supabase
async function verifySupabaseConnection() {
  logStep('4️⃣', 'Verificando conexión a Supabase...');
  
  try {
    // Leer variables de entorno
    const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    const supabaseUrl = envVars.VITE_SUPABASE_URL;
    const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logError('Variables de entorno de Supabase no configuradas');
      logInfo('Edita el archivo .env con tus credenciales');
      return false;
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar conexión
    const { data, error } = await supabase.from('empresa').select('count').limit(1);
    
    if (error) {
      logWarning('No se pudo conectar a Supabase o la tabla empresa no existe');
      logInfo('Esto es normal en la primera instalación');
      return false;
    }
    
    logSuccess('Conexión a Supabase verificada ✓');
    return true;
    
  } catch (error) {
    logWarning('No se pudo verificar la conexión a Supabase');
    logInfo('Esto es normal en la primera instalación');
    return false;
  }
}

// Ejecutar migraciones si es necesario
async function runMigrations() {
  logStep('5️⃣', 'Verificando migraciones de base de datos...');
  
  const supabaseConnected = await verifySupabaseConnection();
  
  if (!supabaseConnected) {
    logWarning('No se pueden ejecutar migraciones automáticamente');
    logInfo('Ejecuta manualmente las migraciones desde Supabase Dashboard');
    logInfo('Archivo: supabase/migrations/20250201000018_complete_fresh_start.sql');
    return;
  }
  
  logSuccess('Base de datos lista ✓');
}

// Verificar estructura del proyecto
function verifyProjectStructure() {
  logStep('6️⃣', 'Verificando estructura del proyecto...');
  
  const requiredDirs = ['src', 'supabase', 'docs', 'n8n-workflows'];
  const requiredFiles = ['package.json', 'vite.config.ts', 'tailwind.config.ts'];
  
  let allGood = true;
  
  // Verificar directorios
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      logSuccess(`Directorio ${dir}/ ✓`);
    } else {
      logError(`Directorio ${dir}/ no encontrado`);
      allGood = false;
    }
  });
  
  // Verificar archivos
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Archivo ${file} ✓`);
    } else {
      logError(`Archivo ${file} no encontrado`);
      allGood = false;
    }
  });
  
  if (allGood) {
    logSuccess('Estructura del proyecto verificada ✓');
  } else {
    logWarning('Algunos archivos o directorios están faltando');
  }
}

// Mostrar próximos pasos
function showNextSteps() {
  logStep('🎯', 'Setup completado. Próximos pasos:');
  
  log(`
${colors.bright}${colors.green}¡ContaPYME está listo para usar!${colors.reset}

${colors.cyan}📋 Próximos pasos:${colors.reset}

1. ${colors.yellow}Configurar Supabase:${colors.reset}
   • Ve a tu proyecto en Supabase Dashboard
   • Ejecuta la migración: supabase/migrations/20250201000018_complete_fresh_start.sql
   • Crea usuarios de prueba

2. ${colors.yellow}Ejecutar la aplicación:${colors.reset}
   • npm run dev

3. ${colors.yellow}Configurar N8N (opcional):${colors.reset}
   • npm run setup:n8n:simple

${colors.cyan}🔧 Comandos útiles:${colors.reset}
   • npm run dev          # Desarrollo
   • npm run build        # Producción
   • npm run verify       # Verificar estado
   • npm run test         # Ejecutar tests

${colors.cyan}📚 Documentación:${colors.reset}
   • README.md            # Guía principal
   • docs/                # Documentación técnica
   • GitHub Wiki          # Wiki del proyecto

${colors.bright}${colors.green}¡Gracias por usar ContaPYME! 🚀${colors.reset}
`, 'green');
}

// Función principal
async function main() {
  try {
    showBanner();
    
    checkPrerequisites();
    checkEnvironment();
    installDependencies();
    await runMigrations();
    verifyProjectStructure();
    
    showNextSteps();
    
  } catch (error) {
    logError('Error durante el setup:');
    logError(error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
