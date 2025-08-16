import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewUsers() {
  console.log('🔐 Probando usuarios nuevos...');
  
  try {
    // Test 1: Login con developer nuevo
    console.log('\n📧 Probando developer@test.com...');
    const { data: devData, error: devError } = await supabase.auth.signInWithPassword({
      email: 'developer@test.com',
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
        console.log('📝 Creando perfil...');
        
        // Crear perfil
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: devData.user.id,
            email: devData.user.email,
            role: 'developer',
            username: 'developer',
            first_name: 'Developer',
            last_name: 'Test'
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Error creando perfil:', createError.message);
        } else {
          console.log('✅ Perfil creado:', newProfile.role);
        }
      } else {
        console.log('✅ Perfil obtenido:', profile.role);
      }
    }
    
    // Test 2: Login con admin nuevo
    console.log('\n📧 Probando admin@test.com...');
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (adminError) {
      console.log('❌ Error login admin:', adminError.message);
    } else {
      console.log('✅ Login admin exitoso:', adminData.user.email);
      
      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminData.user.id)
        .single();
      
      if (profileError) {
        console.log('❌ Error obteniendo perfil:', profileError.message);
        console.log('📝 Creando perfil...');
        
        // Crear perfil
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: adminData.user.id,
            email: adminData.user.email,
            role: 'admin',
            username: 'admin',
            first_name: 'Admin',
            last_name: 'Test'
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Error creando perfil:', createError.message);
        } else {
          console.log('✅ Perfil creado:', newProfile.role);
        }
      } else {
        console.log('✅ Perfil obtenido:', profile.role);
      }
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testNewUsers();
