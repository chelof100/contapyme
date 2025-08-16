import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Verificando tablas existentes en el esquema...\n');
  
  try {
    // Login como developer
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'developer@test.com',
      password: 'developer123'
    });
    
    if (authError) {
      console.log('❌ Error de autenticación:', authError.message);
      return;
    }
    
    console.log('✅ Usuario autenticado:', authData.user.email);
    
    // Lista de tablas que deberían existir
    const expectedTables = [
      'profiles', 'clientes', 'productos', 'facturas', 'empresa', 'empresas',
      'configuracion_empresa', 'configuracion_sistema', 'system_config'
    ];
    
    console.log('📊 Verificando tablas esperadas...\n');
    
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${tableName}: NO EXISTE`);
          } else {
            console.log(`⚠️ ${tableName}: Error - ${error.message}`);
          }
        } else {
          console.log(`✅ ${tableName}: EXISTE (${data?.length || 0} registros)`);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: Error general - ${error.message}`);
      }
    }
    
    // Verificar si hay alguna tabla de configuración
    console.log('\n🔍 Buscando tablas de configuración...');
    
    const possibleConfigTables = [
      'empresa', 'empresas', 'configuracion_empresa', 'configuracion_sistema',
      'system_config', 'app_config', 'settings'
    ];
    
    for (const tableName of possibleConfigTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`✅ Tabla de configuración encontrada: ${tableName}`);
          console.log(`   Columnas disponibles:`, Object.keys(data[0] || {}));
        }
      } catch (error) {
        // Ignorar errores de tablas que no existen
      }
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

checkTables();
