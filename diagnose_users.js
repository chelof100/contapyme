import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseUsers() {
  console.log('🔍 Diagnóstico de carga de usuarios...\n');
  
  try {
    // Test 1: Verificar que la tabla profiles existe y tiene datos
    console.log('📊 Verificando tabla profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Error accediendo a profiles:', profilesError.message);
    } else {
      console.log(`✅ Tabla profiles accesible: ${profiles?.length || 0} usuarios`);
      if (profiles && profiles.length > 0) {
        console.log('👥 Usuarios encontrados:');
        profiles.forEach(user => {
          console.log(`  • ${user.email} (rol: ${user.role})`);
        });
      }
    }
    
    // Test 2: Verificar RLS policies en profiles
    console.log('\n🔒 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (policiesError) {
      console.log('❌ Error verificando políticas:', policiesError.message);
    } else {
      console.log(`✅ Políticas RLS encontradas: ${policies?.length || 0}`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  • ${policy.policyname}: ${policy.cmd} - ${policy.qual}`);
        });
      }
    }
    
    // Test 3: Simular consulta como usuario autenticado
    console.log('\n🔐 Simulando consulta autenticada...');
    
    // Login como developer
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'developer@test.com',
      password: 'developer123'
    });
    
    if (authError) {
      console.log('❌ Error de autenticación:', authError.message);
    } else {
      console.log('✅ Usuario autenticado:', authData.user.email);
      
      // Ahora consultar profiles como usuario autenticado
      const { data: authProfiles, error: authProfilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (authProfilesError) {
        console.log('❌ Error consultando profiles autenticado:', authProfilesError.message);
        console.log('🔍 Código de error:', authProfilesError.code);
        console.log('🔍 Detalles:', authProfilesError.details);
      } else {
        console.log(`✅ Consulta autenticada exitosa: ${authProfiles?.length || 0} usuarios`);
      }
    }
    
    // Test 4: Verificar estructura de la tabla
    console.log('\n🏗️ Verificando estructura de la tabla...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.log('❌ Error verificando estructura:', columnsError.message);
    } else {
      console.log(`✅ Estructura de profiles: ${columns?.length || 0} columnas`);
      if (columns && columns.length > 0) {
        columns.forEach(col => {
          console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

diagnoseUsers();
