#!/usr/bin/env node

/**
 * Script de Verificación de ContaPYME
 * 
 * Este script verifica que todos los componentes del sistema
 * estén correctamente configurados y funcionando.
 */

const fs = require('fs');
const path = require('path');

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
  log(`\n${colors.cyan}${step}${colors.reset}`, 'bright');
  log(message);
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

// Verificar estructura de directorios
function checkDirectoryStructure() {
  logStep('1', 'Verificando estructura de directorios...');
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/pages',
    'src/services',
    'src/hooks',
    'src/config',
    'src/contexts',
    'src/types',
    'src/utils',
    'src/integrations',
    'src/integrations/supabase',
    'n8n-workflows',
    'docs',
    'scripts',
    'supabase',
    'supabase/migrations'
  ];

  const missingDirs = [];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      missingDirs.push(dir);
    } else {
      logSuccess(`Directorio encontrado: ${dir}`);
    }
  }

  if (missingDirs.length > 0) {
    logError(`Directorios faltantes: ${missingDirs.join(', ')}`);
    return false;
  }

  return true;
}

// Verificar archivos de configuración
function checkConfigurationFiles() {
  logStep('2', 'Verificando archivos de configuración...');
  
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tailwind.config.ts',
    'src/config/app.ts',
    'src/main.tsx',
    'src/App.tsx',
    'index.html'
  ];

  const missingFiles = [];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    } else {
      logSuccess(`Archivo encontrado: ${file}`);
    }
  }

  if (missingFiles.length > 0) {
    logError(`Archivos faltantes: ${missingFiles.join(', ')}`);
    return false;
  }

  return true;
}

// Verificar workflows de n8n
function checkN8nWorkflows() {
  logStep('3', 'Verificando workflows de n8n...');
  
  const workflowsDir = path.join(__dirname, '..', 'n8n-workflows');
  const requiredWorkflows = [
    'emitir-factura.json',
    'actualizar-stock.json',
    'registrar-pago.json',
    'alerta-stock.json'
  ];

  const missingWorkflows = [];
  for (const workflow of requiredWorkflows) {
    const workflowPath = path.join(workflowsDir, workflow);
    if (!fs.existsSync(workflowPath)) {
      missingWorkflows.push(workflow);
    } else {
      // Verificar que el workflow sea JSON válido
      try {
        const content = fs.readFileSync(workflowPath, 'utf8');
        JSON.parse(content);
        logSuccess(`Workflow válido: ${workflow}`);
      } catch (error) {
        logError(`Workflow inválido (JSON): ${workflow}`);
        return false;
      }
    }
  }

  if (missingWorkflows.length > 0) {
    logError(`Workflows faltantes: ${missingWorkflows.join(', ')}`);
    return false;
  }

  return true;
}

// Verificar migraciones de Supabase
function checkSupabaseMigrations() {
  logStep('4', 'Verificando migraciones de Supabase...');
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const requiredMigrations = [
    '20250101000000_initial_schema.sql',
    '20250101000000_user_analytics.sql',
    '20250101000001_workflow_logs.sql',
    '20250101000004_users_auth.sql',
    '20250101000005_crm_tables.sql',
    '20250101000006_erp_tables.sql',
    '20250101000007_configuration_system.sql',
    '20250728120000_factura_productos_integration.sql'
  ];

  const missingMigrations = [];
  for (const migration of requiredMigrations) {
    const migrationPath = path.join(migrationsDir, migration);
    if (!fs.existsSync(migrationPath)) {
      missingMigrations.push(migration);
    } else {
      logSuccess(`Migración encontrada: ${migration}`);
    }
  }

  if (missingMigrations.length > 0) {
    logWarning(`Migraciones faltantes: ${missingMigrations.join(', ')}`);
    // No es crítico, solo advertencia
  }

  return true;
}

// Verificar servicios de n8n
function checkN8nServices() {
  logStep('5', 'Verificando servicios de n8n...');
  
  const servicesDir = path.join(__dirname, '..', 'src', 'services');
  const requiredServices = [
    'n8nService.ts',
    'webhookService.ts',
    'configurationService.ts',
    'healthCheckService.ts'
  ];

  const missingServices = [];
  for (const service of requiredServices) {
    const servicePath = path.join(servicesDir, service);
    if (!fs.existsSync(servicePath)) {
      missingServices.push(service);
    } else {
      logSuccess(`Servicio encontrado: ${service}`);
    }
  }

  if (missingServices.length > 0) {
    logError(`Servicios faltantes: ${missingServices.join(', ')}`);
    return false;
  }

  return true;
}

// Verificar documentación
function checkDocumentation() {
  logStep('6', 'Verificando documentación...');
  
  const docsDir = path.join(__dirname, '..', 'docs');
  const requiredDocs = [
    'README.md',
    'INSTALLATION.md',
    'N8N_INTEGRATION.md',
    'SETUP_N8N_COMPLETO.md',
    'MIGRATION.md',
    'TESTING_SUITE.md'
  ];

  const missingDocs = [];
  for (const doc of requiredDocs) {
    const docPath = path.join(docsDir, doc);
    if (!fs.existsSync(docPath)) {
      missingDocs.push(doc);
    } else {
      logSuccess(`Documentación encontrada: ${doc}`);
    }
  }

  if (missingDocs.length > 0) {
    logWarning(`Documentación faltante: ${missingDocs.join(', ')}`);
    // No es crítico, solo advertencia
  }

  return true;
}

// Verificar dependencias
function checkDependencies() {
  logStep('7', 'Verificando dependencias...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Verificar dependencias críticas
    const criticalDeps = [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'vite',
      'typescript'
    ];

    const missingDeps = [];
    for (const dep of criticalDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missingDeps.push(dep);
      } else {
        logSuccess(`Dependencia encontrada: ${dep}`);
      }
    }

    if (missingDeps.length > 0) {
      logError(`Dependencias faltantes: ${missingDeps.join(', ')}`);
      return false;
    }

    // Verificar scripts
    const requiredScripts = [
      'dev',
      'build',
      'setup',
      'verify'
    ];

    const missingScripts = [];
    for (const script of requiredScripts) {
      if (!packageJson.scripts[script]) {
        missingScripts.push(script);
      } else {
        logSuccess(`Script encontrado: ${script}`);
      }
    }

    if (missingScripts.length > 0) {
      logWarning(`Scripts faltantes: ${missingScripts.join(', ')}`);
    }

    return true;
  } catch (error) {
    logError(`Error al verificar package.json: ${error.message}`);
    return false;
  }
}

// Verificar configuración de n8n
function checkN8nConfiguration() {
  logStep('8', 'Verificando configuración de n8n...');
  
  // Verificar archivo de configuración de la aplicación
  const appConfigPath = path.join(__dirname, '..', 'src', 'config', 'app.ts');
  if (!fs.existsSync(appConfigPath)) {
    logError('Archivo de configuración de la aplicación no encontrado');
    return false;
  }

  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  
  // Verificar que tenga configuración de n8n
  if (!appConfigContent.includes('n8n')) {
    logError('Configuración de n8n no encontrada en app.ts');
    return false;
  }

  logSuccess('Configuración de n8n encontrada en app.ts');

  // Verificar servicios de n8n
  const n8nServicePath = path.join(__dirname, '..', 'src', 'services', 'n8nService.ts');
  if (!fs.existsSync(n8nServicePath)) {
    logError('Servicio de n8n no encontrado');
    return false;
  }

  logSuccess('Servicio de n8n encontrado');

  return true;
}

// Verificar integración con Supabase
function checkSupabaseIntegration() {
  logStep('9', 'Verificando integración con Supabase...');
  
  const supabaseClientPath = path.join(__dirname, '..', 'src', 'integrations', 'supabase', 'client.ts');
  if (!fs.existsSync(supabaseClientPath)) {
    logError('Cliente de Supabase no encontrado');
    return false;
  }

  logSuccess('Cliente de Supabase encontrado');

  // Verificar tipos de Supabase
  const supabaseTypesPath = path.join(__dirname, '..', 'src', 'integrations', 'supabase', 'types.ts');
  if (!fs.existsSync(supabaseTypesPath)) {
    logWarning('Tipos de Supabase no encontrados');
  } else {
    logSuccess('Tipos de Supabase encontrados');
  }

  return true;
}

// Función principal
function main() {
  log('🔍 Verificación Completa de ContaPYME', 'bright');
  log('='.repeat(60), 'cyan');

  const checks = [
    { name: 'Estructura de directorios', fn: checkDirectoryStructure },
    { name: 'Archivos de configuración', fn: checkConfigurationFiles },
    { name: 'Workflows de n8n', fn: checkN8nWorkflows },
    { name: 'Migraciones de Supabase', fn: checkSupabaseMigrations },
    { name: 'Servicios de n8n', fn: checkN8nServices },
    { name: 'Documentación', fn: checkDocumentation },
    { name: 'Dependencias', fn: checkDependencies },
    { name: 'Configuración de n8n', fn: checkN8nConfiguration },
    { name: 'Integración con Supabase', fn: checkSupabaseIntegration }
  ];

  let allPassed = true;
  const results = [];

  for (const check of checks) {
    try {
      const result = check.fn();
      results.push({ name: check.name, passed: result });
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      logError(`Error en verificación ${check.name}: ${error.message}`);
      results.push({ name: check.name, passed: false });
      allPassed = false;
    }
  }

  // Resumen final
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Resumen de Verificación', 'bright');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  log(`\n✅ Verificaciones exitosas: ${passed}/${total}`);
  
  if (passed === total) {
    logSuccess('🎉 ¡Todas las verificaciones han pasado!');
    log('\n📋 Próximos pasos:', 'bright');
    log('1. Ejecuta: npm run setup:n8n');
    log('2. Configura tu instancia de n8n');
    log('3. Ejecuta: npm run dev');
    log('4. Ve a Configuración > n8n y prueba la conexión');
  } else {
    logError(`❌ ${total - passed} verificaciones fallaron`);
    
    log('\n🔧 Problemas encontrados:', 'bright');
    results.filter(r => !r.passed).forEach(result => {
      logError(`  - ${result.name}`);
    });
    
    log('\n💡 Soluciones:', 'bright');
    log('1. Ejecuta: npm run setup');
    log('2. Verifica que todos los archivos estén presentes');
    log('3. Revisa la documentación en docs/');
  }

  return allPassed;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = {
  checkDirectoryStructure,
  checkConfigurationFiles,
  checkN8nWorkflows,
  checkSupabaseMigrations,
  checkN8nServices,
  checkDocumentation,
  checkDependencies,
  checkN8nConfiguration,
  checkSupabaseIntegration,
  main
}; 