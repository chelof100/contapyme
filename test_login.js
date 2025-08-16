import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('🔐 Probando login...');
  
  try {
    // Test 1: Login con developer
    console.log('\n📧 Probando developer@contapyme.com...');
    const { data: devData, error: devError } = await supabase.auth.signInWithPassword({
      email: 'developer@contapyme.com',
      password: 'developer123'
    });
    
    if (devError) {
      console.log('❌ Error login developer:', devError.message);
    } else {
      console.log('✅ Login developer exitoso:', devData.user.email);
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', devData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Error obteniendo perfil:', profileError.message);
      } else {
        console.log('✅ Perfil obtenido:', profile.role);
      }
    }
    
    // Test 2: Login con admin
    console.log('\n📧 Probando admin@onepyme.pro...');
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@onepyme.pro',
      password: 'admin123'
    });
    
    if (adminError) {
      console.log('❌ Error login admin:', adminError.message);
    } else {
      console.log('✅ Login admin exitoso:', adminData.user.email);
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testLogin();
