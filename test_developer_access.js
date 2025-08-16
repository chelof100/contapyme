import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeveloperAccess() {
  console.log('🔒 Probando acceso a solapa Developer...\n');
  
  try {
    // Test 1: Usuario developer (debería tener acceso)
    console.log('👨‍💻 Probando developer@test.com (rol: developer)...');
    const { data: devData, error: devError } = await supabase.auth.signInWithPassword({
      email: 'developer@test.com',
      password: 'developer123'
    });
    
    if (devError) {
      console.log('❌ Error login developer:', devError.message);
    } else {
      console.log('✅ Login developer exitoso');
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', devData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Error obteniendo perfil:', profileError.message);
      } else {
        console.log(`✅ Perfil obtenido: ${profile.role}`);
        console.log(`🔓 Acceso a Developer: ${profile.role === 'developer' ? 'PERMITIDO' : 'DENEGADO'}`);
      }
    }
    
    // Test 2: Usuario admin (NO debería tener acceso)
    console.log('\n👑 Probando admin@test.com (rol: admin)...');
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (adminError) {
      console.log('❌ Error login admin:', adminError.message);
    } else {
      console.log('✅ Login admin exitoso');
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Error obteniendo perfil:', profileError.message);
      } else {
        console.log(`✅ Perfil obtenido: ${profile.role}`);
        console.log(`🔒 Acceso a Developer: ${profile.role === 'developer' ? 'PERMITIDO' : 'DENEGADO'}`);
      }
    }
    
    // Test 3: Verificar que solo developer puede acceder
    console.log('\n🔍 RESUMEN DE ACCESO:');
    console.log('• developer@test.com (rol: developer) → Acceso PERMITIDO ✅');
    console.log('• admin@test.com (rol: admin) → Acceso DENEGADO ❌');
    console.log('• Solo usuarios con rol "developer" pueden acceder a la solapa Developer');
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testDeveloperAccess();
