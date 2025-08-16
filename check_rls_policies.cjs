// Script para verificar políticas RLS y identificar recursión infinita
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLSPolicies() {
  console.log('🔍 [RLS CHECK] Verificando políticas RLS para identificar recursión...\n');

  try {
    // 1. Verificar si RLS está habilitado en profiles
    console.log('1️⃣ Verificando estado RLS en tabla profiles...');
    const { data: rlsStatus, error: rlsStatusError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'profiles' });
    
    if (rlsStatusError) {
      console.log('❌ Error verificando estado RLS:', rlsStatusError.message);
    } else {
      console.log('✅ Estado RLS:', rlsStatus);
    }

    // 2. Intentar obtener políticas RLS directamente
    console.log('\n2️⃣ Verificando políticas RLS existentes...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (policiesError) {
      console.log('❌ Error accediendo a pg_policies:', policiesError.message);
      console.log('🔍 Probablemente no tienes permisos para pg_policies');
    } else if (policies && policies.length > 0) {
      console.log('✅ Políticas encontradas:', policies.length);
      policies.forEach((policy, index) => {
        console.log(`  ${index + 1}. Política: ${policy.policyname}`);
        console.log(`     Rol: ${policy.roles}`);
        console.log(`     Comando: ${policy.cmd}`);
        console.log(`     Permisivo: ${policy.permissive}`);
        console.log(`     Usando: ${policy.qual}`);
        console.log(`     Con: ${policy.with_check}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron políticas en pg_policies');
    }

    // 3. Verificar si hay triggers problemáticos
    console.log('\n3️⃣ Verificando triggers en tabla profiles...');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'profiles');
    
    if (triggersError) {
      console.log('❌ Error verificando triggers:', triggersError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Triggers encontrados:', triggers.length);
      triggers.forEach((trigger, index) => {
        console.log(`  ${index + 1}. Trigger: ${trigger.trigger_name}`);
        console.log(`     Evento: ${trigger.event_manipulation}`);
        console.log(`     Timing: ${trigger.action_timing}`);
        console.log(`     Acción: ${trigger.action_statement}`);
        console.log('');
      });
    } else {
      console.log('✅ No hay triggers en la tabla profiles');
    }

    // 4. Verificar estructura de la tabla
    console.log('\n4️⃣ Verificando estructura de tabla profiles...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'profiles');
    
    if (columnsError) {
      console.log('❌ Error verificando estructura:', columnsError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ Columnas encontradas:', columns.length);
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('💥 Error general en verificación RLS:', error);
  }
}

// Ejecutar verificación
checkRLSPolicies().then(() => {
  console.log('\n🏁 Verificación RLS completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

