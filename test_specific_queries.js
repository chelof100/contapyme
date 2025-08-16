import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificQueries() {
  console.log('🧪 Probando consultas específicas del frontend...\n');
  
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
    
    // Test 1: Consulta profiles (como se hace en useUsers)
    console.log('\n📊 Test 1: Consulta profiles (useUsers)...');
    console.log('⏱️ Iniciando consulta...');
    
    const startTime = Date.now();
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (profilesError) {
      console.log('❌ Error en profiles:', profilesError.message);
      console.log('🔍 Código:', profilesError.code);
      console.log('🔍 Detalles:', profilesError.details);
    } else {
      console.log(`✅ Profiles consultados en ${duration}ms: ${profiles?.length || 0} usuarios`);
    }
    
    // Test 2: Consulta clientes (como se hace en useClientes)
    console.log('\n👥 Test 2: Consulta clientes (useClientes)...');
    console.log('⏱️ Iniciando consulta...');
    
    const startTime2 = Date.now();
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });
    
    const endTime2 = Date.now();
    const duration2 = endTime2 - startTime2;
    
    if (clientesError) {
      console.log('❌ Error en clientes:', clientesError.message);
      console.log('🔍 Código:', clientesError.code);
    } else {
      console.log(`✅ Clientes consultados en ${duration2}ms: ${clientes?.length || 0} clientes`);
    }
    
    // Test 3: Consulta productos (como se hace en useProductos)
    console.log('\n📦 Test 3: Consulta productos (useProductos)...');
    console.log('⏱️ Iniciando consulta...');
    
    const startTime3 = Date.now();
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    
    const endTime3 = Date.now();
    const duration3 = endTime3 - startTime3;
    
    if (productosError) {
      console.log('❌ Error en productos:', productosError.message);
      console.log('🔍 Código:', productosError.code);
    } else {
      console.log(`✅ Productos consultados en ${duration3}ms: ${productos?.length || 0} productos`);
    }
    
    // Test 4: Verificar estructura de las tablas
    console.log('\n🏗️ Test 4: Verificar estructura de tablas...');
    
    const tables = ['profiles', 'clientes', 'productos'];
    for (const table of tables) {
      try {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', table)
          .eq('table_schema', 'public');
        
        if (columnsError) {
          console.log(`❌ Error verificando ${table}:`, columnsError.message);
        } else {
          const hasCreatedAt = columns?.some(col => col.column_name === 'created_at');
          console.log(`✅ ${table}: ${columns?.length || 0} columnas, created_at: ${hasCreatedAt ? 'SÍ' : 'NO'}`);
        }
      } catch (error) {
        console.log(`❌ Error general en ${table}:`, error.message);
      }
    }
    
    console.log('\n🎯 RESUMEN DEL TEST:');
    console.log('• Profiles:', profilesError ? '❌' : '✅', `(${duration}ms)`);
    console.log('• Clientes:', clientesError ? '❌' : '✅', `(${duration2}ms)`);
    console.log('• Productos:', productosError ? '❌' : '✅', `(${duration3}ms)`);
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testSpecificQueries();
