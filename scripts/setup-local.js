#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando ContaPYME para entorno LOCAL...\n');

// Verificar si existe .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creando archivo .env.local...');
  
  const envContent = `# ContaPYME - Configuración Local
# ======================================

# Supabase Configuration (OBLIGATORIO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# n8n Configuration (OPCIONAL)
VITE_N8N_BASE_URL=https://tu-instancia-n8n.com
VITE_N8N_API_KEY=tu_api_key_de_n8n

# Application Configuration
VITE_APP_NAME=ContaPYME
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# ======================================
# INSTRUCCIONES:
# 1. Reemplaza las URLs y claves con tus credenciales reales
# 2. Para Supabase: Ve a tu proyecto en supabase.com
# 3. Para n8n: Configura tu instancia de n8n
# ======================================
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env.local creado');
} else {
  console.log('✅ Archivo .env.local ya existe');
}

console.log('\n📋 PRÓXIMOS PASOS:');
console.log('1. Edita el archivo .env.local con tus credenciales');
console.log('2. Ejecuta: npm run dev');
console.log('3. Ve a http://localhost:5173');
console.log('\n📖 Para más información, consulta docs/IMPLEMENTATION.md');

console.log('\n✅ Configuración LOCAL completada!'); 