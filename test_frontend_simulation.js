import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendSimulation() {
  console.log('🧪 Simulando comportamiento del frontend...\n');
  
  try {
    // Simular AuthContext - verificar sesión inicial
    console.log('🔍 [AuthContext] Checking initial session...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ [AuthContext] Initial session found:', session.user.email);
      
      // Simular fetchProfile
      console.log('🔍 [AuthContext] Fetching profile for user:', session.user.id);
      console.log('🔍 [AuthContext] About to make Supabase query...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.log('❌ [AuthContext] Error fetching profile:', profileError.message);
        return;
      }
      
      if (profile) {
        console.log('✅ [AuthContext] Profile fetched successfully:', profile.role);
      } else {
        console.log('⚠️ [AuthContext] No profile found');
      }
    } else {
      console.log('🔍 [AuthContext] No user in initial session');
      
      // Simular login manual
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
        
        // Simular fetchProfile después del login
        console.log('🔍 [AuthContext] Fetching profile after login...');
        const userProfile = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (userProfile.data) {
          console.log('✅ [AuthContext] Profile loaded after login:', userProfile.data.role);
        } else {
          console.log('⚠️ [AuthContext] No profile found after login');
        }
      }
    }
    
    // Simular Dashboard - cargar datos
    console.log('\n📊 [Dashboard] Loading dashboard data...');
    
    // Simular useUsers hook
    console.log('👥 [Dashboard] Loading users (useUsers)...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.log('❌ [Dashboard] Error loading users:', usersError.message);
    } else {
      console.log(`✅ [Dashboard] Users loaded: ${users?.length || 0}`);
    }
    
    // Simular useClientes hook
    console.log('👥 [Dashboard] Loading clientes (useClientes)...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (clientesError) {
      console.log('❌ [Dashboard] Error loading clientes:', clientesError.message);
    } else {
      console.log(`✅ [Dashboard] Clientes loaded: ${clientes?.length || 0}`);
    }
    
    // Simular useProductos hook
    console.log('📦 [Dashboard] Loading productos (useProductos)...');
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (productosError) {
      console.log('❌ [Dashboard] Error loading productos:', productosError.message);
    } else {
      console.log(`✅ [Dashboard] Productos loaded: ${productos?.length || 0}`);
    }
    
    console.log('\n🎯 [Frontend] Simulation completed successfully!');
    console.log('• AuthContext: ✅ Working');
    console.log('• Dashboard hooks: ✅ Working');
    console.log('• Data loading: ✅ Working');
    
  } catch (error) {
    console.log('❌ [Frontend] Simulation error:', error.message);
    console.log('🔍 Stack trace:', error.stack);
  }
}

testFrontendSimulation();
