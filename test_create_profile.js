import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateProfile() {
  console.log('🧪 Testeando función createProfile paso a paso...\n');
  
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
    
    // Test 1: Verificar tabla empresa
    console.log('\n📊 Test 1: Verificando tabla empresa...');
    console.log('⏱️ Iniciando consulta a empresa...');
    
    const startTime = Date.now();
    const { data: configEmpresa, error: configError } = await supabase
      .from('empresa')
      .select('id, nombre')
      .limit(1)
      .single();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (configError) {
      console.log('❌ Error consultando empresa:', configError.message);
      console.log('🔍 Código:', configError.code);
      return;
    }
    
    console.log(`✅ Empresa consultada en ${duration}ms:`, configEmpresa);
    
    // Test 2: Crear perfil
    console.log('\n👤 Test 2: Creando perfil...');
    
    const profileData = {
      id: authData.user.id,
      username: 'developer_test',
      first_name: 'Developer',
      last_name: 'Test',
      email: authData.user.email,
      role: 'developer',
      avatar_url: null,
      empresa_id: configEmpresa.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Profile data:', profileData);
    console.log('⏱️ Iniciando inserción...');
    
    const startTime2 = Date.now();
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    const endTime2 = Date.now();
    const duration2 = endTime2 - startTime2;
    
    if (insertError) {
      console.log('❌ Error creando perfil:', insertError.message);
      console.log('🔍 Código:', insertError.code);
      console.log('🔍 Detalles:', insertError.details);
    } else {
      console.log(`✅ Perfil creado en ${duration2}ms:`, newProfile);
    }
    
    console.log('\n🎯 Test completado exitosamente');
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('🔍 Stack trace:', error.stack);
  }
}

testCreateProfile();
