#!/usr/bin/env node

/**
 * Script de Configuración Automatizada de n8n para ContaPYME
 * 
 * Este script automatiza la configuración de n8n y la conexión
 * con todos los workflows de ContaPYME.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
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

// Crear interfaz de lectura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Verificar archivos de workflows
function checkWorkflowFiles() {
  const workflowsDir = path.join(__dirname, '..', 'n8n-workflows');
  const requiredWorkflows = [
    'emitir-factura.json',
    'actualizar-stock.json',
    'registrar-pago.json',
    'alerta-stock.json'
  ];

  logStep('1', 'Verificando archivos de workflows...');

  const missingWorkflows = [];
  for (const workflow of requiredWorkflows) {
    const workflowPath = path.join(workflowsDir, workflow);
    if (!fs.existsSync(workflowPath)) {
      missingWorkflows.push(workflow);
    } else {
      logSuccess(`Workflow encontrado: ${workflow}`);
    }
  }

  if (missingWorkflows.length > 0) {
    logError(`Workflows faltantes: ${missingWorkflows.join(', ')}`);
    return false;
  }

  return true;
}

// Generar archivo de configuración de n8n
async function generateN8nConfig() {
  logStep('2', 'Configurando variables de entorno para n8n...');

  const n8nConfig = {
    supabase: {
      url: '',
      anonKey: '',
      serviceRoleKey: ''
    },
    afip: {
      cuit: '',
      certPath: '',
      keyPath: ''
    },
    email: {
      host: 'smtp.gmail.com',
      port: 587,
      user: '',
      pass: ''
    },
    whatsapp: {
      apiToken: '',
      phoneNumber: ''
    },
    api: {
      n8nApiKey: ''
    }
  };

  logInfo('Configuración de Supabase:');
  n8nConfig.supabase.url = await question('URL de Supabase (ej: https://tu-proyecto.supabase.co): ');
  n8nConfig.supabase.anonKey = await question('Clave anónima de Supabase: ');
  n8nConfig.supabase.serviceRoleKey = await question('Clave de servicio de Supabase (opcional): ');

  logInfo('\nConfiguración de AFIP (opcional):');
  n8nConfig.afip.cuit = await question('CUIT de la empresa: ');
  n8nConfig.afip.certPath = await question('Ruta al certificado AFIP: ');
  n8nConfig.afip.keyPath = await question('Ruta a la clave privada AFIP: ');

  logInfo('\nConfiguración de Email (opcional):');
  n8nConfig.email.user = await question('Email para envío (ej: tu-email@gmail.com): ');
  n8nConfig.email.pass = await question('Contraseña de aplicación: ');

  logInfo('\nConfiguración de WhatsApp (opcional):');
  n8nConfig.whatsapp.apiToken = await question('Token de API de WhatsApp: ');
  n8nConfig.whatsapp.phoneNumber = await question('Número de WhatsApp (ej: +5491112345678): ');

  logInfo('\nConfiguración de API:');
  n8nConfig.api.n8nApiKey = await question('API Key para webhooks de n8n: ');

  // Generar archivo de configuración
  const configContent = `# Configuración de n8n para ContaPYME
# Generado automáticamente el ${new Date().toISOString()}

# Supabase Configuration
SUPABASE_URL=${n8nConfig.supabase.url}
SUPABASE_ANON_KEY=${n8nConfig.supabase.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${n8nConfig.supabase.serviceRoleKey}

# AFIP Configuration
AFIP_CUIT=${n8nConfig.afip.cuit}
AFIP_CERT_PATH=${n8nConfig.afip.certPath}
AFIP_KEY_PATH=${n8nConfig.afip.keyPath}

# Email Configuration
SMTP_HOST=${n8nConfig.email.host}
SMTP_PORT=${n8nConfig.email.port}
SMTP_USER=${n8nConfig.email.user}
SMTP_PASS=${n8nConfig.email.pass}

# WhatsApp Business API
WHATSAPP_API_TOKEN=${n8nConfig.whatsapp.apiToken}
WHATSAPP_PHONE_NUMBER=${n8nConfig.whatsapp.phoneNumber}

# API Keys
N8N_API_KEY=${n8nConfig.api.n8nApiKey}
`;

  const configPath = path.join(__dirname, '..', 'n8n-config.env');
  fs.writeFileSync(configPath, configContent);

  logSuccess(`Archivo de configuración generado: ${configPath}`);
  return n8nConfig;
}

// Generar script de importación de workflows
function generateImportScript(n8nUrl) {
  logStep('3', 'Generando script de importación de workflows...');

  const importScript = `#!/bin/bash

# Script de importación de workflows para n8n
# Generado automáticamente para ContaPYME

echo "🚀 Importando workflows a n8n..."

# URL de tu workspace n8n
N8N_URL="${n8nUrl}"

# Directorio de workflows
WORKFLOWS_DIR="./n8n-workflows"

# Función para importar workflow
import_workflow() {
    local workflow_file="\$1"
    local workflow_name="\$(basename "\$workflow_file" .json)"
    
    echo "📥 Importando: \$workflow_name"
    
    # Importar workflow usando la API de n8n
    curl -X POST "\${N8N_URL}/api/v1/workflows" \\
         -H "Content-Type: application/json" \\
         -H "X-N8N-API-KEY: \${N8N_API_KEY}" \\
         -d @"\$workflow_file"
    
    if [ \$? -eq 0 ]; then
        echo "✅ Workflow importado exitosamente: \$workflow_name"
    else
        echo "❌ Error al importar workflow: \$workflow_name"
    fi
}

# Importar todos los workflows
for workflow in "\${WORKFLOWS_DIR}"/*.json; do
    if [ -f "\$workflow" ]; then
        import_workflow "\$workflow"
    fi
done

echo "🎉 Importación de workflows completada!"
`;

  const scriptPath = path.join(__dirname, '..', 'import-workflows.sh');
  fs.writeFileSync(scriptPath, importScript);
  fs.chmodSync(scriptPath, '755');

  logSuccess(`Script de importación generado: ${scriptPath}`);
  return scriptPath;
}

// Generar archivo de configuración para ContaPYME
function generateContaPymeConfig(n8nUrl, apiKey) {
  logStep('4', 'Generando configuración para ContaPYME...');

  const envContent = `# Configuración de ContaPYME para n8n
# Generado automáticamente

# n8n Configuration
VITE_N8N_BASE_URL=${n8nUrl}
VITE_N8N_API_KEY=${apiKey}

# Nota: Completa las demás variables de entorno según tu configuración
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-clave-anonima
# VITE_AFIP_TOKEN=tu-token-afip
# VITE_AFIP_SIGN=tu-sign-afip
# VITE_AFIP_CUIT=20123456789
`;

  const envPath = path.join(__dirname, '..', '.env.n8n');
  fs.writeFileSync(envPath, envContent);

  logSuccess(`Archivo de configuración de ContaPYME generado: ${envPath}`);
  return envPath;
}

// Generar documentación de verificación
function generateVerificationDoc(n8nUrl) {
  logStep('5', 'Generando documentación de verificación...');

  const verificationDoc = `# Verificación de Configuración n8n

## URLs de Webhooks

Una vez importados los workflows, verifica que las siguientes URLs estén activas:

- **Health Check**: \${n8nUrl}/webhook/health-check
- **Emitir Factura**: \${n8nUrl}/webhook/emitir-factura
- **Actualizar Stock**: \${n8nUrl}/webhook/actualizar-stock
- **Registrar Pago**: \${n8nUrl}/webhook/registrar-pago
- **Alerta Stock**: \${n8nUrl}/webhook/alerta-stock

## Comandos de Verificación

### 1. Health Check
\`\`\`bash
curl -X POST \${n8nUrl}/webhook/health-check \\
  -H "Content-Type: application/json" \\
  -H "X-N8N-API-KEY: \${N8N_API_KEY}" \\
  -d '{"test": true}'
\`\`\`

### 2. Test de Emisión de Factura
\`\`\`bash
curl -X POST \${n8nUrl}/webhook/emitir-factura \\
  -H "Content-Type: application/json" \\
  -H "X-N8N-API-KEY: \${N8N_API_KEY}" \\
  -d '{
    "factura_id": "test-123",
    "cuit_cliente": "20-12345678-9",
    "total": 1000,
    "test_mode": true
  }'
\`\`\`

## Checklist de Verificación

- [ ] n8n Cloud configurado y accesible
- [ ] Variables de entorno configuradas en n8n
- [ ] Workflows importados correctamente
- [ ] Webhooks activos y accesibles
- [ ] Autenticación funcionando
- [ ] Health check exitoso
- [ ] ContaPYME configurado con las URLs correctas
- [ ] Pruebas de workflows exitosas

## Próximos Pasos

1. Copia el contenido de \`.env.n8n\` a tu \`.env.local\`
2. Ejecuta \`npm run dev\` para iniciar ContaPYME
3. Ve a Configuración > n8n y prueba la conexión
4. Realiza pruebas de los workflows desde la aplicación
`;

  const docPath = path.join(__dirname, '..', 'VERIFICACION_N8N.md');
  fs.writeFileSync(docPath, verificationDoc);

  logSuccess(`Documentación de verificación generada: ${docPath}`);
  return docPath;
}

// Función principal
async function main() {
  log('🚀 Configuración Automatizada de n8n para ContaPYME', 'bright');
  log('='.repeat(60), 'cyan');

  try {
    // Verificar archivos de workflows
    if (!checkWorkflowFiles()) {
      logError('No se pueden encontrar todos los archivos de workflows necesarios.');
      process.exit(1);
    }

    // Obtener URL de n8n
    logInfo('\nConfiguración de n8n:');
    const n8nUrl = await question('URL de tu workspace n8n (ej: https://tu-workspace.n8n.cloud): ');
    
    if (!n8nUrl || !n8nUrl.startsWith('http')) {
      logError('URL de n8n inválida. Debe comenzar con http:// o https://');
      process.exit(1);
    }

    // Generar configuración de n8n
    const n8nConfig = await generateN8nConfig();

    // Generar script de importación
    const importScriptPath = generateImportScript(n8nUrl);

    // Generar configuración de ContaPYME
    const contaPymeConfigPath = generateContaPymeConfig(n8nUrl, n8nConfig.api.n8nApiKey);

    // Generar documentación de verificación
    const verificationDocPath = generateVerificationDoc(n8nUrl);

    // Resumen final
    log('\n' + '='.repeat(60), 'cyan');
    log('🎉 Configuración Completada', 'bright');
    log('='.repeat(60), 'cyan');

    logSuccess('Archivos generados:');
    log(`  📄 n8n-config.env - Variables de entorno para n8n`);
    log(`  📄 import-workflows.sh - Script de importación de workflows`);
    log(`  📄 .env.n8n - Configuración para ContaPYME`);
    log(`  📄 VERIFICACION_N8N.md - Documentación de verificación`);

    log('\n📋 Próximos pasos:', 'bright');
    log('1. Ve a tu workspace de n8n y configura las variables de entorno');
    log('2. Ejecuta: chmod +x import-workflows.sh && ./import-workflows.sh');
    log('3. Copia el contenido de .env.n8n a tu .env.local');
    log('4. Ejecuta: npm run dev');
    log('5. Ve a Configuración > n8n y prueba la conexión');

    log('\n📚 Documentación adicional:', 'bright');
    log('  📖 docs/SETUP_N8N_COMPLETO.md - Guía completa paso a paso');
    log('  📖 docs/N8N_INTEGRATION.md - Documentación técnica');

  } catch (error) {
    logError(`Error durante la configuración: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkWorkflowFiles,
  generateN8nConfig,
  generateImportScript,
  generateContaPymeConfig,
  generateVerificationDoc
};
