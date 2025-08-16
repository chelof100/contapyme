import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendHang() {
  console.log('🧪 Probando el problema específico del frontend colgado...\n');
  
  try {
    // Simular exactamente el flujo del frontend
    console.log('🔍 [AuthContext] Checking initial session...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('🔍 [AuthContext] No user in initial session');
      console.log('🔍 [AuthContext] Attempting signin for: developer@test.com');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'developer@test.com',
        password: 'developer123'
      });
      
      if (authError) {
        console.log('❌ [AuthContext] Signin error:', authError.message);
        return;
      }
      
      if (authData.user) {
        console.log('✅ [AuthContext] Signin successful for: developer@test.com');
        console.log('🔍 [AuthContext] User data received:', authData.user.id);
        
        // AQUÍ ES DONDE SE COLGA EL FRONTEND
        console.log('🔍 [AuthContext] Fetching profile for user:', authData.user.id);
        console.log('🔍 [AuthContext] About to make Supabase query...');
        
        // Agregar timeout para detectar si se cuelga
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT: Query se colgó después de 10 segundos')), 10000);
        });
        
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        // Ejecutar con timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        if (result.error) {
          console.log('❌ [AuthContext] Error fetching profile:', result.error.message);
          console.log('🔍 Código:', result.error.code);
          console.log('🔍 Detalles:', result.error.details);
        } else {
          console.log('✅ [AuthContext] Profile fetched successfully:', result.data?.role);
        }
      }
    } else {
      console.log('✅ [AuthContext] Initial session found:', session.user.email);
      
      // Probar la consulta problemática
      console.log('🔍 [AuthContext] Fetching profile for user:', session.user.id);
      console.log('🔍 [AuthContext] About to make Supabase query...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.log('❌ [AuthContext] Error fetching profile:', profileError.message);
      } else {
        console.log('✅ [AuthContext] Profile fetched successfully:', profile?.role);
      }
    }
    
    console.log('\n🎯 Test completado - Frontend no se colgó');
    
  } catch (error) {
    if (error.message.includes('TIMEOUT')) {
      console.log('❌ [Frontend] PROBLEMA CONFIRMADO: Query se colgó');
      console.log('🔍 Causa: Timeout después de 10 segundos');
      console.log('🔍 Ubicación: Consulta a tabla profiles');
    } else {
      console.log('❌ [Frontend] Error general:', error.message);
    }
  }
}

testFrontendHang();
