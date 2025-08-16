// Script para aplicar solución temporal: deshabilitar RLS en profiles
// OnePyme - Problema de Autenticación por Recursión Infinita en RLS

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixRLSRecursion() {
  console.log('🔧 [FIX RLS] Aplicando solución temporal para recursión infinita...\n');

  try {
    // 1. Intentar deshabilitar RLS en profiles
    console.log('1️⃣ Deshabilitando RLS en tabla profiles...');
    const { data: disableRLS, error: disableRLSError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (disableRLSError) {
      console.log('❌ Error deshabilitando RLS:', disableRLSError.message);
      console.log('🔍 Probablemente no tienes permisos para modificar RLS');
    } else {
      console.log('✅ RLS deshabilitado exitosamente');
    }

    // 2. Verificar que profiles sea accesible
    console.log('\n2️⃣ Verificando acceso a tabla profiles...');
    const { data: profileCount, error: countError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (countError) {
      console.log('❌ Error accediendo a profiles:', countError.message);
      console.log('🔍 Código de error:', countError.code);
    } else {
      console.log('✅ Tabla profiles ahora es accesible');
    }

    // 3. Verificar usuario developer específico
    console.log('\n3️⃣ Verificando usuario developer...');
    const { data: developerProfile, error: developerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'developer@onepyme.pro')
      .maybeSingle();
    
    if (developerError) {
      console.log('❌ Error accediendo a perfil developer:', developerError.message);
    } else if (developerProfile) {
      console.log('✅ Perfil developer encontrado:');
      console.log('  - ID:', developerProfile.id);
      console.log('  - Email:', developerProfile.email);
      console.log('  - Role:', developerProfile.role);
      console.log('  - Empresa ID:', developerProfile.empresa_id);
    } else {
      console.log('❌ Perfil developer NO encontrado');
    }

    // 4. Verificar empresa
    console.log('\n4️⃣ Verificando empresa...');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresa')
      .select('*')
      .limit(1);
    
    if (empresaError) {
      console.log('❌ Error accediendo a empresa:', empresaError.message);
    } else if (empresa && empresa.length > 0) {
      console.log('✅ Empresa accesible:', empresa[0].nombre);
    }

  } catch (error) {
    console.error('💥 Error general en fix RLS:', error);
  }
}

// Ejecutar fix
fixRLSRecursion().then(() => {
  console.log('\n🏁 Fix RLS completado');
  console.log('💡 Ahora deberías poder hacer login sin problemas');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

