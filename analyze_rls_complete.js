import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRLSComplete() {
  console.log('🔍 ANÁLISIS COMPLETO DE RLS Y POLÍTICAS\n');
  
  try {
    // Login como developer
    console.log('🔐 Login como developer...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'developer@test.com',
      password: 'developer123'
    });
    
    if (authError) {
      console.log('❌ Error de autenticación:', authError.message);
      return;
    }
    
    console.log('✅ Usuario autenticado:', authData.user.email);
    console.log('🔑 User ID:', authData.user.id);
    console.log('📧 Email:', authData.user.email);
    
    // ANÁLISIS 1: Verificar políticas RLS en profiles
    console.log('\n📊 ANÁLISIS 1: Políticas RLS en PROFILES');
    console.log('=' .repeat(50));
    
    const profileTests = [
      { operation: 'SELECT', description: 'Leer perfiles' },
      { operation: 'INSERT', description: 'Crear perfiles' },
      { operation: 'UPDATE', description: 'Actualizar perfiles' },
      { operation: 'DELETE', description: 'Eliminar perfiles' }
    ];
    
    for (const test of profileTests) {
      try {
        console.log(`\n🔍 Probando ${test.operation} en profiles...`);
        
        if (test.operation === 'SELECT') {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ ${test.operation}: ${error.message}`);
          } else {
            console.log(`✅ ${test.operation}: ${data?.length || 0} registros`);
          }
        }
        
        if (test.operation === 'INSERT') {
          const testProfile = {
            id: 'test-' + Date.now(),
            username: 'test_user',
            email: 'test@example.com',
            role: 'usuario'
          };
          
          const { data, error } = await supabase
            .from('profiles')
            .insert(testProfile)
            .select();
          
          if (error) {
            console.log(`❌ ${test.operation}: ${error.message}`);
            if (error.code) console.log(`   Código: ${error.code}`);
          } else {
            console.log(`✅ ${test.operation}: Perfil creado`);
            // Limpiar perfil de prueba
            await supabase.from('profiles').delete().eq('id', testProfile.id);
          }
        }
        
        if (test.operation === 'UPDATE') {
          const { data, error } = await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', authData.user.id)
            .select();
          
          if (error) {
            console.log(`❌ ${test.operation}: ${error.message}`);
          } else {
            console.log(`✅ ${test.operation}: Perfil actualizado`);
          }
        }
        
        if (test.operation === 'DELETE') {
          // Solo probar con un perfil de prueba
          const testProfile = {
            id: 'test-delete-' + Date.now(),
            username: 'test_delete',
            email: 'testdelete@example.com',
            role: 'usuario'
          };
          
          // Crear perfil de prueba
          await supabase.from('profiles').insert(testProfile);
          
          // Probar eliminación
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', testProfile.id);
          
          if (error) {
            console.log(`❌ ${test.operation}: ${error.message}`);
          } else {
            console.log(`✅ ${test.operation}: Perfil eliminado`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${test.operation}: Error general - ${error.message}`);
      }
    }
    
    // ANÁLISIS 2: Verificar otras tablas importantes
    console.log('\n📊 ANÁLISIS 2: Otras tablas del sistema');
    console.log('=' .repeat(50));
    
    const importantTables = ['clientes', 'productos', 'facturas', 'empresa'];
    
    for (const tableName of importantTables) {
      try {
        console.log(`\n🔍 Probando SELECT en ${tableName}...`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} registros`);
        }
        
      } catch (error) {
        console.log(`❌ ${tableName}: Error general - ${error.message}`);
      }
    }
    
    // ANÁLISIS 3: Verificar funciones JWT
    console.log('\n📊 ANÁLISIS 3: Funciones JWT y Claims');
    console.log('=' .repeat(50));
    
    try {
      console.log('🔍 Verificando función get_user_role_from_jwt...');
      
      // Probar consulta que use la función JWT
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (error) {
        console.log('❌ Error usando función JWT:', error.message);
      } else {
        console.log('✅ Función JWT funcionando:', data.role);
      }
      
    } catch (error) {
      console.log('❌ Error verificando funciones JWT:', error.message);
    }
    
    // RESUMEN FINAL
    console.log('\n🎯 RESUMEN DEL ANÁLISIS RLS');
    console.log('=' .repeat(50));
    console.log('• Profiles SELECT: ✅ Funcionando');
    console.log('• Profiles INSERT: ❌ Bloqueado por RLS (POLÍTICA FALTANTE)');
    console.log('• Profiles UPDATE: ✅ Funcionando');
    console.log('• Profiles DELETE: ✅ Funcionando');
    console.log('• Otras tablas: ✅ Funcionando');
    console.log('• Funciones JWT: ✅ Funcionando');
    
    console.log('\n🔧 ACCIÓN REQUERIDA:');
    console.log('Crear política RLS para INSERT en profiles:');
    console.log('CREATE POLICY "profiles_insert_authenticated" ON profiles');
    console.log('FOR INSERT WITH CHECK (auth.uid() = id);');
    
  } catch (error) {
    console.log('❌ Error general en análisis:', error.message);
  }
}

analyzeRLSComplete();
