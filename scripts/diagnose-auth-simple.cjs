const { createClient } = require('@supabase/supabase-js');

// Configuración desde el archivo público
const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNk0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseAuthSimple() {
  console.log('🔍 DIAGNÓSTICO SIMPLE DE AUTENTICACIÓN\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('empresa')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError.message);
      return;
    }
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar usuarios existentes (sin autenticación)
    console.log('2️⃣ Verificando usuarios existentes (sin autenticación)...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError.message);
      console.log('   🔍 Esto indica que RLS está bloqueando el acceso');
    } else {
      console.log(`✅ ${users.length} usuarios encontrados (RLS deshabilitado o permisivo):`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Empresa: ${user.empresa_id}`);
      });
    }
    console.log();

    // 3. Verificar empresas (sin autenticación)
    console.log('3️⃣ Verificando empresas (sin autenticación)...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresa')
      .select('*');

    if (empresasError) {
      console.error('❌ Error al obtener empresas:', empresasError.message);
    } else {
      console.log(`✅ ${empresas.length} empresas encontradas:`);
      empresas.forEach(empresa => {
        console.log(`   - ${empresa.nombre} (${empresa.cuit}) - ID: ${empresa.id}`);
      });
    }
    console.log();

    // 4. Probar autenticación como developer
    console.log('4️⃣ Probando autenticación como developer...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'developer@onepyme.pro',
      password: 'developer123'
    });

    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      return;
    }

    console.log('✅ Autenticación exitosa como developer');
    console.log(`   - User ID: ${authData.user.id}`);
    console.log(`   - Email: ${authData.user.email}`);
    console.log();

    // 5. Verificar perfil del usuario autenticado
    console.log('5️⃣ Verificando perfil del usuario autenticado...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError.message);
      return;
    }

    console.log('✅ Perfil obtenido exitosamente:');
    console.log(`   - Role: ${profile.role}`);
    console.log(`   - Empresa ID: ${profile.empresa_id}`);
    console.log();

    // 6. Probar acceso a todos los perfiles (con autenticación)
    console.log('6️⃣ Probando acceso a todos los perfiles (con autenticación)...');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (allProfilesError) {
      console.error('❌ Error al obtener todos los perfiles:', allProfilesError.message);
      console.log('   🔍 Esto indica un problema con las políticas RLS');
      console.log('   📋 Verificando políticas RLS...');
      
      // Verificar políticas RLS
      const { data: policies, error: policiesError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'profiles');

      if (policiesError) {
        console.error('❌ Error al obtener políticas:', policiesError.message);
      } else {
        console.log(`✅ ${policies.length} políticas encontradas para profiles:`);
        policies.forEach(policy => {
          console.log(`   - ${policy.policy_name}: ${policy.action} (${policy.permissive})`);
        });
      }
    } else {
      console.log(`✅ Acceso exitoso a ${allProfiles.length} perfiles`);
      allProfiles.forEach(p => {
        console.log(`   - ${p.email} (${p.role})`);
      });
    }
    console.log();

    // 7. Verificar función get_current_user_role
    console.log('7️⃣ Verificando función get_current_user_role...');
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_current_user_role');

    if (roleError) {
      console.error('❌ Error al obtener rol actual:', roleError.message);
    } else {
      console.log(`✅ Rol actual: ${roleData}`);
    }
    console.log();

    // 8. Verificar función get_current_user_empresa_id
    console.log('8️⃣ Verificando función get_current_user_empresa_id...');
    const { data: empresaData, error: empresaError } = await supabase
      .rpc('get_current_user_empresa_id');

    if (empresaError) {
      console.error('❌ Error al obtener empresa actual:', empresaError.message);
    } else {
      console.log(`✅ Empresa actual: ${empresaData}`);
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
    console.log('📋 Revisa los resultados arriba para identificar problemas');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

diagnoseAuthSimple();

