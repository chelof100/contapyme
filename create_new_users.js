import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNewUsers() {
  console.log('👥 Creando usuarios nuevos...');
  
  try {
    // Crear usuario developer nuevo
    console.log('\n📧 Creando developer@test.com...');
    const { data: devData, error: devError } = await supabase.auth.signUp({
      email: 'developer@test.com',
      password: 'developer123',
      options: {
        data: {
          role: 'developer'
        }
      }
    });
    
    if (devError) {
      console.log('❌ Error creando developer:', devError.message);
    } else {
      console.log('✅ Developer creado:', devData.user?.email);
      console.log('📧 Verificar email para confirmar cuenta');
    }
    
    // Crear usuario admin nuevo
    console.log('\n📧 Creando admin@test.com...');
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'admin@test.com',
      password: 'admin123',
      options: {
        data: {
          role: 'admin'
        }
      }
    });
    
    if (adminError) {
      console.log('❌ Error creando admin:', adminError.message);
    } else {
      console.log('✅ Admin creado:', adminData.user?.email);
      console.log('📧 Verificar email para confirmar cuenta');
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

createNewUsers();
