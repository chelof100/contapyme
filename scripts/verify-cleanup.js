#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando limpieza del proyecto...\n');

const checks = [
  {
    name: 'Migración limpia creada',
    check: () => fs.existsSync('supabase/migrations/20250201000006_final_clean_schema.sql'),
    status: ''
  },
  {
    name: '.env.example existe',
    check: () => fs.existsSync('.env.example'),
    status: ''
  },
  {
    name: 'Carpeta .bolt eliminada',
    check: () => !fs.existsSync('.bolt'),
    status: ''
  },
  {
    name: 'Backups de migraciones creados',
    check: () => fs.existsSync('backups/migrations_20250807'),
    status: ''
  },
  {
    name: 'Reglas de Cursor documentadas',
    check: () => fs.existsSync('docs/CURSOR_RULES.md'),
    status: ''
  },
  {
    name: 'No hay archivos temporales de migración',
    check: () => {
      const files = fs.readdirSync('.');
      return !files.some(f => 
        f.includes('-migration-') || 
        f.startsWith('auto-') ||
        f.startsWith('direct-') ||
        f.startsWith('execute-')
      );
    },
    status: ''
  }
];

let allPassed = true;

checks.forEach(check => {
  if (check.check()) {
    check.status = '✅';
  } else {
    check.status = '❌';
    allPassed = false;
  }
  console.log(`${check.status} ${check.name}`);
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('\n✅ ¡LIMPIEZA COMPLETADA EXITOSAMENTE!');
  console.log('📋 Todos los checks pasaron correctamente');
  console.log('🚀 El proyecto está listo para continuar');
  process.exit(0);
} else {
  console.log('\n⚠️ Algunos checks fallaron');
  console.log('📋 Revisa los items marcados con ❌');
  process.exit(1);
}
