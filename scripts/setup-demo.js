#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 Configurando ContaPYME para entorno DEMO...\n');

// Crear configuración demo
const demoConfigPath = path.join(__dirname, '..', 'demo', 'config', 'demo.js');
const demoConfigDir = path.dirname(demoConfigPath);

if (!fs.existsSync(demoConfigDir)) {
  fs.mkdirSync(demoConfigDir, { recursive: true });
}

const demoConfigContent = `// ContaPYME Demo Configuration
export const demoConfig = {
  supabase: {
    url: 'https://example.supabase.co',
    anonKey: 'demo-key',
    mock: true,
  },
  n8n: {
    baseUrl: 'https://example.com/webhook',
    apiKey: 'demo-key',
    mock: true,
  },
  app: {
    name: 'ContaPYME Demo',
    version: '1.0.0',
    environment: 'demo',
  },
  features: {
    facturas: true,
    stock: true,
    crm: true,
    reports: false, // Solo UI en demo
    analytics: false, // Solo UI en demo
  },
  mockData: {
    // Datos de ejemplo para el demo
    user: {
      id: 'demo-user-123',
      email: 'demo@contapyme.com',
      name: 'Usuario Demo',
    },
    empresa: {
      id: 'demo-empresa-123',
      nombre: 'Empresa Demo S.A.',
      cuit: '20-12345678-9',
    },
  },
};

export default demoConfig;
`;

fs.writeFileSync(demoConfigPath, demoConfigContent);
console.log('✅ Configuración demo creada');

console.log('\n📋 PRÓXIMOS PASOS:');
console.log('1. Ejecuta: npm run dev:demo');
console.log('2. Ve a http://localhost:5173');
console.log('3. Usa credenciales demo: demo@contapyme.com / demo123');

console.log('\n✅ Configuración DEMO completada!'); 