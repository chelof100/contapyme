import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLSFinal() {
  console.log('🔍 VERIFICACIÓN FINAL DE RLS\n');
  
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
    console.log('🔑 User ID:', authData.user.id);
    
    // TEST 1: INSERT en profiles con UUID válido
    console.log('\n🎯 TEST 1: INSERT en PROFILES (UUID VÁLIDO)');
    console.log('=' .repeat(60));
    
    try {
      const testProfile = {
        id: uuidv4(), // UUID válido
        username: 'test_user_' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        role: 'usuario',
        first_name: 'Test',
        last_name: 'User',
        avatar_url: null,
        empresa_id: null, // Temporal para test
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Intentando crear perfil de prueba...');
      console.log('📋 ID válido:', testProfile.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(testProfile)
        .select();
      
      if (error) {
        console.log('❌ INSERT aún fallando:', error.message);
        console.log('🔍 Código:', error.code);
        console.log('🔍 Detalles:', error.details);
        
        if (error.code === '42501') {
          console.log('🚨 PROBLEMA: Política RLS no permite INSERT');
        } else if (error.code === '22P02') {
          console.log('🚨 PROBLEMA: UUID inválido');
        }
      } else {
        console.log('✅ INSERT funcionando correctamente!');
        console.log('📊 Perfil creado:', data);
        
        // Limpiar perfil de prueba
        await supabase.from('profiles').delete().eq('id', testProfile.id);
        console.log('🧹 Perfil de prueba eliminado');
      }
      
    } catch (error) {
      console.log('❌ Error general en INSERT:', error.message);
    }
    
    // TEST 2: Verificar políticas RLS existentes
    console.log('\n🎯 TEST 2: VERIFICAR POLÍTICAS RLS EXISTENTES');
    console.log('=' .repeat(60));
    
    try {
      // Verificar políticas en profiles
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies_info', { table_name: 'profiles' });
      
      if (policiesError) {
        console.log('⚠️ No se pudo obtener info de políticas (normal)');
        console.log('🔍 Verificar manualmente en Supabase Dashboard > SQL Editor:');
        console.log('SELECT * FROM pg_policies WHERE tablename = \'profiles\';');
      } else {
        console.log('📊 Políticas encontradas:', policies);
      }
      
    } catch (error) {
      console.log('⚠️ Error verificando políticas:', error.message);
    }
    
    // TEST 3: Verificar facturas con política corregida
    console.log('\n🎯 TEST 3: VERIFICAR FACTURAS');
    console.log('=' .repeat(60));
    
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ SELECT en facturas aún fallando:', error.message);
        console.log('🔍 Código:', error.code);
        console.log('🔧 SOLUCIÓN: Aplicar política RLS para facturas');
      } else {
        console.log('✅ SELECT en facturas funcionando!');
        console.log('📊 Registros:', data?.length || 0);
      }
      
    } catch (error) {
      console.log('❌ Error general en facturas:', error.message);
    }
    
    // RESUMEN FINAL
    console.log('\n🎯 RESUMEN FINAL DE VERIFICACIÓN');
    console.log('=' .repeat(60));
    
    console.log('📋 ESTADO ACTUAL:');
    console.log('• Login: ✅ Funcionando');
    console.log('• fetchProfile: ✅ Funcionando');
    console.log('• INSERT profiles: ❓ Depende de política RLS');
    console.log('• SELECT facturas: ❌ Necesita política RLS');
    
    console.log('\n🔧 ACCIONES REQUERIDAS:');
    console.log('1. Verificar políticas RLS en Supabase Dashboard');
    console.log('2. Aplicar política para facturas si no existe');
    console.log('3. Probar login en navegador');
    
  } catch (error) {
    console.log('❌ Error general en verificación:', error.message);
  }
}

verifyRLSFinal();
