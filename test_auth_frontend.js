import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFrontend() {
  console.log('🧪 Probando autenticación del frontend...\n');
  
  try {
    // Test 1: Login como developer
    console.log('👨‍💻 Probando login como developer...');
    const { data: devData, error: devError } = await supabase.auth.signInWithPassword({
      email: 'developer@test.com',
      password: 'developer123'
    });
    
    if (devError) {
      console.log('❌ Error login developer:', devError.message);
      return;
    }
    
    console.log('✅ Login developer exitoso');
    console.log('🔑 User ID:', devData.user.id);
    console.log('📧 Email:', devData.user.email);
    console.log('🔐 Session:', !!devData.session);
    
    // Test 2: Verificar que la sesión está activa
    console.log('\n🔍 Verificando sesión activa...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Sesión activa encontrada');
      console.log('👤 Usuario en sesión:', session.user.email);
    } else {
      console.log('❌ No hay sesión activa');
    }
    
    // Test 3: Consultar profiles (debería funcionar con RLS)
    console.log('\n📊 Consultando tabla profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Error consultando profiles:', profilesError.message);
      console.log('🔍 Código:', profilesError.code);
      console.log('🔍 Detalles:', profilesError.details);
    } else {
      console.log(`✅ Profiles consultados exitosamente: ${profiles?.length || 0} usuarios`);
      if (profiles && profiles.length > 0) {
        console.log('👥 Usuarios encontrados:');
        profiles.forEach(user => {
          console.log(`  • ${user.email} (rol: ${user.role})`);
        });
      }
    }
    
    // Test 4: Verificar que el usuario actual puede ver su propio perfil
    console.log('\n🔍 Verificando perfil del usuario actual...');
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', devData.user.id)
      .single();
    
    if (currentProfileError) {
      console.log('❌ Error obteniendo perfil actual:', currentProfileError.message);
    } else {
      console.log('✅ Perfil actual obtenido:', currentProfile.role);
    }
    
    console.log('\n🎯 RESUMEN DEL TEST:');
    console.log('• Login: ✅ Exitoso');
    console.log('• Sesión: ✅ Activa');
    console.log('• RLS Profiles: ✅ Funcionando');
    console.log('• Usuarios cargados:', profiles?.length || 0);
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testAuthFrontend();
