#!/usr/bin/env node

/**
 * Script de Setup Automatizado para ContaPYME
 * 
 * Este script configura automáticamente el entorno para implementación
 * en ordenadores de clientes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para consola
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

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Verificar Node.js
const checkNodeVersion = () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major < 18) {
    log.error(`Node.js 18+ requerido. Versión actual: ${version}`);
    process.exit(1);
  }
  
  log.success(`Node.js ${version} detectado`);
};

// Verificar npm
const checkNpm = async () => {
  try {
    const { execSync } = await import('child_process');
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.success(`npm ${npmVersion} detectado`);
  } catch (error) {
    log.error('npm no encontrado. Instala Node.js desde https://nodejs.org/');
    process.exit(1);
  }
};

// Crear archivo .env.example
const createEnvExample = () => {
  const envExample = `# ContaPYME - Variables de Entorno
# Copia este archivo a .env.local y configura tus credenciales

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# n8n Configuration
VITE_N8N_BASE_URL=https://n8n.n8ncloud.top
VITE_N8N_API_KEY=your-n8n-api-key

# AFIP Configuration (Opcional)
VITE_AFIP_CERT_PATH=path/to/your/cert.p12
VITE_AFIP_CERT_PASSWORD=your-cert-password

# App Configuration
VITE_APP_NAME=ContaPYME
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Features
VITE_RECETAS_ENABLED=true
VITE_STOCK_ALERTS_ENABLED=true
VITE_AFIP_INTEGRATION_ENABLED=true
VITE_REAL_TIME_SYNC=true

# Debug
VITE_DEBUG=false
VITE_LOG_LEVEL=warn
`;

  const envPath = path.join(__dirname, '..', '.env.example');
  fs.writeFileSync(envPath, envExample);
  log.success('Archivo .env.example creado');
};

// Verificar dependencias
const checkDependencies = () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log.error('package.json no encontrado. Ejecuta este script desde la raíz del proyecto.');
    process.exit(1);
  }
  
  log.success('package.json encontrado');
};

// Instalar dependencias
const installDependencies = async () => {
  log.info('Instalando dependencias...');
  
  try {
    const { execSync } = await import('child_process');
    execSync('npm install', { stdio: 'inherit' });
    log.success('Dependencias instaladas correctamente');
  } catch (error) {
    log.error('Error instalando dependencias');
    process.exit(1);
  }
};

// Verificar configuración de Supabase
const checkSupabaseConfig = () => {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.warning('Archivo .env.local no encontrado');
    log.info('Crea el archivo .env.local con tus credenciales de Supabase');
    log.info('Puedes usar .env.example como plantilla');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('VITE_SUPABASE_URL') || !envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    log.warning('Credenciales de Supabase no configuradas en .env.local');
    return false;
  }
  
  log.success('Configuración de Supabase detectada');
  return true;
};

// Verificar configuración de n8n
const checkN8nConfig = () => {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('VITE_N8N_BASE_URL')) {
    log.warning('Configuración de n8n no encontrada');
    return false;
  }
  
  log.success('Configuración de n8n detectada');
  return true;
};

// Crear script de verificación
const createVerifyScript = () => {
  const verifyScript = `#!/usr/bin/env node

/**
 * Script de Verificación para ContaPYME
 * Verifica que todo esté configurado correctamente
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\\x1b[0m',
  green: '\\x1b[32m',
  red: '\\x1b[31m',
  yellow: '\\x1b[33m'
};

const log = {
  success: (msg) => console.log(\`\${colors.green}✅ \${msg}\${colors.reset}\`),
  error: (msg) => console.log(\`\${colors.red}❌ \${msg}\${colors.reset}\`),
  warning: (msg) => console.log(\`\${colors.yellow}⚠ \${msg}\${colors.reset}\`)
};

console.log('🔍 Verificando configuración de ContaPYME...\\n');

// Verificar Node.js
try {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major >= 18) {
    log.success(\`Node.js \${version} ✓\`);
  } else {
    log.error(\`Node.js 18+ requerido. Actual: \${version}\`);
  }
} catch (error) {
  log.error('Error verificando Node.js');
}

// Verificar dependencias
try {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    log.success('package.json encontrado ✓');
  } else {
    log.error('package.json no encontrado');
  }
} catch (error) {
  log.error('Error verificando package.json');
}

// Verificar .env.local
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    log.success('.env.local encontrado ✓');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('VITE_SUPABASE_URL')) {
      log.success('Supabase URL configurada ✓');
    } else {
      log.warning('Supabase URL no configurada');
    }
    
    if (envContent.includes('VITE_SUPABASE_ANON_KEY')) {
      log.success('Supabase Key configurada ✓');
    } else {
      log.warning('Supabase Key no configurada');
    }
    
    if (envContent.includes('VITE_N8N_BASE_URL')) {
      log.success('n8n URL configurada ✓');
    } else {
      log.warning('n8n URL no configurada');
    }
  } else {
    log.warning('.env.local no encontrado');
  }
} catch (error) {
  log.error('Error verificando .env.local');
}

// Verificar node_modules
try {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    log.success('node_modules encontrado ✓');
  } else {
    log.warning('node_modules no encontrado. Ejecuta: npm install');
  }
} catch (error) {
  log.error('Error verificando node_modules');
}

console.log('\\n🎯 Verificación completada');
`;

  const verifyPath = path.join(__dirname, 'verify.js');
  fs.writeFileSync(verifyPath, verifyScript);
  log.success('Script de verificación creado');
};

// Función principal
const main = async () => {
  log.header('🚀 SETUP AUTOMATIZADO - CONTAPYME');
  
  try {
    // Verificaciones iniciales
    checkNodeVersion();
    checkNpm();
    checkDependencies();
    
    // Crear archivos de configuración
    createEnvExample();
    createVerifyScript();
    
    // Instalar dependencias
    await installDependencies();
    
    // Verificar configuración
    const supabaseOk = checkSupabaseConfig();
    const n8nOk = checkN8nConfig();
    
    log.header('📋 RESUMEN DE CONFIGURACIÓN');
    
    if (supabaseOk && n8nOk) {
      log.success('✅ Configuración completa');
      log.info('Puedes ejecutar: npm run dev');
    } else {
      log.warning('⚠ Configuración incompleta');
      log.info('1. Copia .env.example a .env.local');
      log.info('2. Configura tus credenciales en .env.local');
      log.info('3. Ejecuta: npm run verify');
      log.info('4. Ejecuta: npm run dev');
    }
    
    log.header('🎉 SETUP COMPLETADO');
    log.info('Para verificar la configuración: npm run verify');
    log.info('Para iniciar el servidor: npm run dev');
    
  } catch (error) {
    log.error('Error durante el setup:');
    console.error(error);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main; 