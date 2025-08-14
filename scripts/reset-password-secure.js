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

async function resetPassword() {
  try {
    log('🔐 RESET DE PASSWORD SEGURO - OnePYME', 'cyan');
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
    const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      logError('Variables de entorno de Supabase no encontradas');
      logInfo('Necesitas configurar:');
      logInfo('- VITE_SUPABASE_URL');
      logInfo('- VITE_SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    logInfo('Conectando a Supabase con Service Role Key...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    if (args.length < 2) {
      logError('Uso: node reset-password-secure.js <email> <nueva_password>');
      logInfo('Ejemplo: node reset-password-secure.js admin@onepyme.pro nueva123');
      return;
    }

    const email = args[0];
    const newPassword = args[1];

    logInfo(`Reseteando password para: ${email}`);
    logWarning(`Nueva password: ${newPassword}`);

    // Validar longitud de password
    if (newPassword.length < 8) {
      logError('La password debe tener al menos 8 caracteres');
      return;
    }

    // Buscar usuario por email
    logInfo('Buscando usuario...');
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();

    if (searchError) {
      logError(`Error al buscar usuarios: ${searchError.message}`);
      return;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      logError(`Usuario con email ${email} no encontrado`);
      return;
    }

    logSuccess(`Usuario encontrado: ${user.id}`);

    // Reset password
    logInfo('Reseteando password...');
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (resetError) {
      logError(`Error al resetear password: ${resetError.message}`);
      return;
    }

    logSuccess('✅ Password reseteado exitosamente!');
    logInfo(`Usuario: ${email}`);
    logInfo(`Nueva password: ${newPassword}`);
    log('', 'reset');
    log('🔒 IMPORTANTE: Este script solo debe ejecutarse en backend', 'yellow');
    log('🔒 NUNCA incluir VITE_SUPABASE_SERVICE_ROLE_KEY en el frontend', 'red');

  } catch (error) {
    logError(`Error general: ${error.message}`);
    logError(`Stack: ${error.stack}`);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('reset-password-secure.js')) {
  resetPassword();
}

