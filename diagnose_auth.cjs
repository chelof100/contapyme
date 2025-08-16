// Script de diagnóstico para OnePyme - Problema de Autenticación
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseAuth() {
  console.log('🔍 [DIAGNÓSTICO] Iniciando diagnóstico de autenticación...\n');

  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Verificando conexión básica a Supabase...');
    const { data: healthData, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Error de conexión:', healthError.message);
      console.log('🔍 Código de error:', healthError.code);
      console.log('🔍 Detalles:', healthError.details);
    } else {
      console.log('✅ Conexión básica exitosa');
    }

    // 2. Verificar si existe el usuario developer
    console.log('\n2️⃣ Verificando usuario developer en auth.users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error accediendo a auth.users:', authError.message);
      console.log('🔍 Probablemente no tienes permisos de admin');
    } else {
      const developerUser = authData.users.find(u => u.email === 'developer@onepyme.pro');
      if (developerUser) {
        console.log('✅ Usuario developer encontrado en auth.users');
        console.log('🔍 ID:', developerUser.id);
        console.log('🔍 Email confirmado:', developerUser.email_confirmed_at);
        console.log('🔍 Último sign in:', developerUser.last_sign_in_at);
      } else {
        console.log('❌ Usuario developer NO encontrado en auth.users');
      }
    }

    // 3. Verificar perfil del usuario developer
    console.log('\n3️⃣ Verificando perfil del usuario developer...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'developer@onepyme.pro')
      .maybeSingle();
    
    if (profileError) {
      console.log('❌ Error accediendo a profiles:', profileError.message);
      console.log('🔍 Código de error:', profileError.code);
      console.log('🔍 Detalles:', profileError.details);
    } else if (profileData) {
      console.log('✅ Perfil encontrado en profiles');
      console.log('🔍 ID:', profileData.id);
      console.log('🔍 Role:', profileData.role);
      console.log('🔍 Empresa ID:', profileData.empresa_id);
    } else {
      console.log('❌ Perfil NO encontrado en profiles');
    }

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'profiles' });
    
    if (rlsError) {
      console.log('❌ Error verificando RLS:', rlsError.message);
      console.log('🔍 Probablemente la función no existe');
    } else {
      console.log('✅ Políticas RLS obtenidas:', rlsData);
    }

    // 5. Verificar empresa
    console.log('\n5️⃣ Verificando empresa...');
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresa')
      .select('*')
      .limit(1);
    
    if (empresaError) {
      console.log('❌ Error accediendo a empresa:', empresaError.message);
      console.log('🔍 Código de error:', empresaError.code);
    } else if (empresaData && empresaData.length > 0) {
      console.log('✅ Empresa encontrada');
      console.log('🔍 ID:', empresaData[0].id);
      console.log('🔍 Nombre:', empresaData[0].nombre);
    } else {
      console.log('❌ No hay empresas en la tabla');
    }

  } catch (error) {
    console.error('💥 Error general en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseAuth().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

