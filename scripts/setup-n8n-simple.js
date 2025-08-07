#!/usr/bin/env node

/**
 * Script Simplificado de Configuración de n8n para ContaPYME
 * 
 * Este script genera la configuración básica para conectar ContaPYME con n8n
 * Configuración para cliente único (sin multi-tenant)
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

  log('📋 Verificando archivos de workflows...', 'cyan');

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

// Generar configuración para ContaPYME
async function generateContaPymeConfig() {
  log('\n🔧 Configurando ContaPYME para n8n...', 'cyan');

  logInfo('Necesitamos configurar tu instancia de n8n:');
  const n8nUrl = await question('URL de tu workspace n8n (ej: https://tu-workspace.n8n.cloud): ');
  
  if (!n8nUrl || !n8nUrl.startsWith('http')) {
    logError('URL de n8n inválida. Debe comenzar con http:// o https://');
    return null;
  }

  const apiKey = await question('API Key de n8n (opcional, presiona Enter si no tienes): ');

  // Generar configuración para .env.local
  const envContent = `# Configuración de ContaPYME para n8n
# Generado automáticamente el ${new Date().toISOString()}

# n8n Configuration
VITE_N8N_BASE_URL=${n8nUrl}
VITE_N8N_API_KEY=${apiKey || ''}

# Nota: Completa las demás variables de entorno según tu configuración
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-clave-anonima
`;

  const envPath = path.join(__dirname, '..', '.env.n8n');
  fs.writeFileSync(envPath, envContent);

  logSuccess(`Archivo de configuración generado: ${envPath}`);
  
  return { n8nUrl, apiKey };
}

// Generar documentación de configuración
function generateSetupDoc(n8nUrl) {
  log('\n📝 Generando documentación de configuración...', 'cyan');

  const setupDoc = `# Configuración de n8n para ContaPYME - Cliente Único

## 🎯 Configuración Actual

- **URL de n8n**: ${n8nUrl}
- **Modo**: Cliente Único (sin multi-tenant)
- **Webhooks**: Simples sin prefijos

## 📋 Pasos para Configurar n8n

### 1. Importar Workflows

Ve a tu workspace de n8n y importa los siguientes workflows:

1. **Emitir Factura**: \`n8n-workflows/emitir-factura.json\`
2. **Actualizar Stock**: \`n8n-workflows/actualizar-stock.json\`
3. **Registrar Pago**: \`n8n-workflows/registrar-pago.json\`
4. **Alerta Stock**: \`n8n-workflows/alerta-stock.json\`

### 2. Configurar Variables de Entorno en n8n

En tu workspace de n8n, ve a Settings > Variables y configura:

\`\`\`
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-servicio

# AFIP (opcional)
AFIP_CUIT=20123456789
AFIP_TOKEN=tu-token-afip
AFIP_SIGN=tu-sign-afip

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-aplicación

# WhatsApp (opcional)
WHATSAPP_API_TOKEN=tu-token-whatsapp
WHATSAPP_PHONE_NUMBER=+5491112345678

# API Keys
N8N_API_KEY=tu-api-key-n8n
\`\`\`

### 3. Configurar Webhooks

Cada workflow debe tener un webhook configurado de forma simple:

- **Health Check**: \${n8nUrl}/webhook/health-check
- **Emitir Factura**: \${n8nUrl}/webhook/emitir-factura
- **Actualizar Stock**: \${n8nUrl}/webhook/actualizar-stock
- **Registrar Pago**: \${n8nUrl}/webhook/registrar-pago
- **Alerta Stock**: \${n8nUrl}/webhook/alerta-stock

### 4. Configurar ContaPYME

1. Copia el contenido de \`.env.n8n\` a tu \`.env.local\`
2. Ejecuta \`npm run dev\` para iniciar ContaPYME
3. Ve a Configuración > n8n
4. Configura la URL base y API key
5. Haz clic en "Probar Conexión"

### 5. Probar Conexión

1. Ve a Configuración > n8n
2. Haz clic en "Probar Conexión"
3. Verifica que todos los endpoints respondan correctamente

## 🧪 Comandos de Prueba

### Health Check
\`\`\`bash
curl -X POST ${n8nUrl}/webhook/health-check \\
  -H "Content-Type: application/json" \\
  -d '{"test": true}'
\`\`\`

### Test de Emisión de Factura
\`\`\`bash
curl -X POST ${n8nUrl}/webhook/emitir-factura \\
  -H "Content-Type: application/json" \\
  -d '{
    "factura_id": "test-123",
    "cuit_cliente": "20-12345678-9",
    "total": 1000,
    "test_mode": true
  }'
\`\`\`

## ✅ Checklist de Verificación

- [ ] n8n Cloud configurado y accesible
- [ ] Variables de entorno configuradas en n8n
- [ ] Workflows importados correctamente
- [ ] Webhooks activos sin prefijos
- [ ] ContaPYME configurado con las URLs correctas
- [ ] Prueba de conexión exitosa
- [ ] Health check funcionando
- [ ] Workflows respondiendo correctamente

## 🚀 Próximos Pasos

1. Completa la configuración en ContaPYME
2. Importa los workflows en n8n
3. Configura las variables de entorno
4. Prueba la conexión desde ContaPYME
5. Realiza pruebas de los workflows

## 📚 Documentación Adicional

- [Guía Completa de n8n](docs/SETUP_N8N_COMPLETO.md)
- [Integración n8n](docs/N8N_INTEGRATION.md)

## 🔄 Escalabilidad Futura

Cuando necesites escalar a múltiples clientes:

1. **Opción A**: Clonar workflows por cliente (recomendado)
2. **Opción B**: Habilitar multi-tenant en ContaPYME
3. **Opción C**: Instancias separadas de n8n por cliente

La configuración actual es perfecta para empezar y escalar fácilmente.
`;

  const docPath = path.join(__dirname, '..', 'CONFIGURACION_N8N_SIMPLE.md');
  fs.writeFileSync(docPath, setupDoc);

  logSuccess(`Documentación generada: ${docPath}`);
  return docPath;
}

// Función principal
async function main() {
  log('🚀 Configuración Simplificada de n8n para ContaPYME - Cliente Único', 'bright');
  log('='.repeat(70), 'cyan');

  try {
    // Verificar archivos de workflows
    if (!checkWorkflowFiles()) {
      logError('No se pueden encontrar todos los archivos de workflows necesarios.');
      process.exit(1);
    }

    // Generar configuración de ContaPYME
    const config = await generateContaPymeConfig();
    if (!config) {
      process.exit(1);
    }

    // Generar documentación
    const docPath = generateSetupDoc(config.n8nUrl);

    // Resumen final
    log('\n' + '='.repeat(70), 'cyan');
    log('🎉 Configuración Completada', 'bright');
    log('='.repeat(70), 'cyan');

    logSuccess('Archivos generados:');
    log(`  📄 .env.n8n - Configuración para ContaPYME`);
    log(`  📄 CONFIGURACION_N8N_SIMPLE.md - Guía de configuración`);

    log('\n📋 Próximos pasos:', 'bright');
    log('1. Copia el contenido de .env.n8n a tu .env.local');
    log('2. Ve a tu workspace de n8n e importa los workflows');
    log('3. Configura las variables de entorno en n8n');
    log('4. Ve a ContaPYME > Configuración > n8n');
    log('5. Configura la URL base y API key');
    log('6. Prueba la conexión desde ContaPYME');

    log('\n📚 Documentación:', 'bright');
    log('  📖 CONFIGURACION_N8N_SIMPLE.md - Guía paso a paso');
    log('  📖 docs/N8N_INTEGRATION.md - Documentación técnica');

    log('\n💡 Ventajas de esta configuración:', 'bright');
    log('  ✅ Simple y directa');
    log('  ✅ Fácil de mantener');
    log('  ✅ Escalable para el futuro');
    log('  ✅ Sin complejidad innecesaria');

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
  generateContaPymeConfig,
  generateSetupDoc
};
