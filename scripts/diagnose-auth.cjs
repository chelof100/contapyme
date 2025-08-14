const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno no configuradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseAuth() {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN Y PERMISOS\n');

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

    // 2. Verificar usuarios existentes
    console.log('2️⃣ Verificando usuarios existentes...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError.message);
      return;
    }

    console.log(`✅ ${users.length} usuarios encontrados:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Empresa: ${user.empresa_id}`);
    });
    console.log();

    // 3. Verificar empresas
    console.log('3️⃣ Verificando empresas...');
    const { data: empresas, error: empresasError } = await supabaseAdmin
      .from('empresa')
      .select('*');

    if (empresasError) {
      console.error('❌ Error al obtener empresas:', empresasError.message);
      return;
    }

    console.log(`✅ ${empresas.length} empresas encontradas:`);
    empresas.forEach(empresa => {
      console.log(`   - ${empresa.nombre} (${empresa.cuit}) - ID: ${empresa.id}`);
    });
    console.log();

    // 4. Verificar políticas RLS
    console.log('4️⃣ Verificando políticas RLS para profiles...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('get_rls_policies', { table_name: 'profiles' });

    if (policiesError) {
      console.log('⚠️ No se pudo obtener políticas RLS, verificando manualmente...');
      const { data: manualPolicies, error: manualError } = await supabaseAdmin
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'profiles');

      if (manualError) {
        console.error('❌ Error al obtener políticas:', manualError.message);
      } else {
        console.log(`✅ ${manualPolicies.length} políticas encontradas para profiles`);
        manualPolicies.forEach(policy => {
          console.log(`   - ${policy.policy_name}: ${policy.action} (${policy.permissive})`);
        });
      }
    } else {
      console.log(`✅ ${policies.length} políticas RLS encontradas`);
    }
    console.log();

    // 5. Probar autenticación como developer
    console.log('5️⃣ Probando autenticación como developer...');
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

    // 6. Verificar perfil del usuario autenticado
    console.log('6️⃣ Verificando perfil del usuario autenticado...');
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

    // 7. Probar acceso a todos los perfiles
    console.log('7️⃣ Probando acceso a todos los perfiles...');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (allProfilesError) {
      console.error('❌ Error al obtener todos los perfiles:', allProfilesError.message);
      console.log('   🔍 Esto indica un problema con las políticas RLS');
    } else {
      console.log(`✅ Acceso exitoso a ${allProfiles.length} perfiles`);
      allProfiles.forEach(p => {
        console.log(`   - ${p.email} (${p.role})`);
      });
    }
    console.log();

    // 8. Verificar función get_current_user_role
    console.log('8️⃣ Verificando función get_current_user_role...');
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_current_user_role');

    if (roleError) {
      console.error('❌ Error al obtener rol actual:', roleError.message);
    } else {
      console.log(`✅ Rol actual: ${roleData}`);
    }
    console.log();

    // 9. Verificar función get_current_user_empresa_id
    console.log('9️⃣ Verificando función get_current_user_empresa_id...');
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

diagnoseAuth();
