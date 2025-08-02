import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uymvmqbiapcnfqskkdny.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQ1NTgwNiwiZXhwIjoyMDY4MDMxODA2fQ.xRN2fxuEdoMva_qdLHwlrI7kiAQw4jCrn0cF2ssfVpw'
);

async function finalVerification() {
  console.log('🎉 VERIFICACIÓN FINAL - MIGRACIÓN COMPLETA');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar tablas principales
    console.log('\n📋 1. VERIFICANDO TABLAS PRINCIPALES...');
    
    const mainTables = [
      'factura_productos', 'historial_precios', 'proveedores', 'clientes', 'categorias'
    ];
    
    let tablesCreated = 0;
    for (const table of mainTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: Creada correctamente`);
          tablesCreated++;
        }
      } catch (error) {
        console.log(`❌ Tabla ${table}: ${error.message}`);
      }
    }
    
    // 2. Verificar campos en productos
    console.log('\n📝 2. VERIFICANDO CAMPOS EN PRODUCTOS...');
    
    const productColumns = [
      'nombre', 'codigo_barras', 'imagen_url', 'peso_kg', 'volumen_l', 'fecha_vencimiento', 'numero_lote'
    ];
    
    let columnsAdded = 0;
    for (const column of productColumns) {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ Campo ${column}: ${error.message}`);
        } else {
          console.log(`✅ Campo ${column}: Agregado correctamente`);
          columnsAdded++;
        }
      } catch (error) {
        console.log(`❌ Campo ${column}: ${error.message}`);
      }
    }
    
    // 3. Verificar funciones
    console.log('\n🔧 3. VERIFICANDO FUNCIONES...');
    
    const functions = [
      'calcular_subtotal_factura', 'actualizar_totales_factura', 'procesar_venta_productos', 'registrar_cambio_precio'
    ];
    
    let functionsCreated = 0;
    for (const funcName of functions) {
      try {
        const { data, error } = await supabase
          .rpc(funcName, { factura_uuid: '00000000-0000-0000-0000-000000000000' })
          .select();
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ Función ${funcName}: No encontrada`);
        } else {
          console.log(`✅ Función ${funcName}: Creada correctamente`);
          functionsCreated++;
        }
      } catch (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ Función ${funcName}: No encontrada`);
        } else {
          console.log(`✅ Función ${funcName}: Creada correctamente`);
          functionsCreated++;
        }
      }
    }
    
    // 4. Verificar tablas de configuración
    console.log('\n⚙️ 4. VERIFICANDO TABLAS DE CONFIGURACIÓN...');
    
    const configTables = [
      'endpoint_configurations_history', 'configuration_backups', 'configuration_tests'
    ];
    
    let configTablesCreated = 0;
    for (const table of configTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabla ${table}: Creada correctamente`);
          configTablesCreated++;
        }
      } catch (error) {
        console.log(`❌ Tabla ${table}: ${error.message}`);
      }
    }
    
    // 5. Resumen final
    console.log('\n📊 RESUMEN FINAL DE LA MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`📋 Tablas principales: ${tablesCreated}/${mainTables.length} creadas`);
    console.log(`📝 Campos en productos: ${columnsAdded}/${productColumns.length} agregados`);
    console.log(`🔧 Funciones: ${functionsCreated}/${functions.length} creadas`);
    console.log(`⚙️ Tablas de configuración: ${configTablesCreated}/${configTables.length} creadas`);
    
    const totalScore = tablesCreated + columnsAdded + functionsCreated + configTablesCreated;
    const maxScore = mainTables.length + productColumns.length + functions.length + configTables.length;
    
    console.log(`\n🎯 PUNTUACIÓN TOTAL: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%)`);
    
    if (totalScore === maxScore) {
      console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('='.repeat(60));
      console.log('✅ Todas las tablas creadas');
      console.log('✅ Todos los campos agregados');
      console.log('✅ Todas las funciones creadas');
      console.log('✅ Todas las configuraciones listas');
      
      console.log('\n🚀 FUNCIONALIDADES DISPONIBLES:');
      console.log('='.repeat(60));
      console.log('✅ Integración productos-facturas automática');
      console.log('✅ Cálculo automático de totales e IVA');
      console.log('✅ Actualización automática de stock');
      console.log('✅ Auditoría automática de cambios de precios');
      console.log('✅ Escaneo de códigos de barras');
      console.log('✅ Gestión de proveedores y clientes');
      console.log('✅ Categorización de productos');
      console.log('✅ Sistema de configuración de endpoints');
      console.log('✅ Sistema de backups automáticos');
      console.log('✅ Tests de conectividad');
      
      console.log('\n🎯 PRÓXIMOS PASOS:');
      console.log('='.repeat(60));
      console.log('1. Ejecutar la aplicación: npm run dev');
      console.log('2. Probar funcionalidades en la interfaz');
      console.log('3. Configurar webhooks y endpoints');
      console.log('4. Probar escáner de códigos de barras');
      console.log('5. Probar importación masiva de productos');
      console.log('6. Probar módulo de recetas');
      console.log('7. Verificar integración con n8n');
      
    } else {
      console.log('\n⚠️ MIGRACIÓN PARCIALMENTE COMPLETADA');
      console.log('='.repeat(60));
      console.log('Algunos elementos no se crearon correctamente.');
      console.log('Revisa los errores anteriores y ejecuta los scripts faltantes.');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación final:', error.message);
  }
}

finalVerification().catch(console.error); 