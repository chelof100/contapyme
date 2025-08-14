const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testPasswords() {
  console.log('🔐 Probando diferentes contraseñas para developer@onepyme.pro...\n');
  
  const passwords = ['developer123', 'admin123', 'password', '123456', 'onepyme123'];
  
  for (const password of passwords) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'developer@onepyme.pro',
        password: password
      });
      
      if (error) {
        console.log(`❌ ${password}: ${error.message}`);
      } else {
        console.log(`✅ ${password}: ¡AUTENTICACIÓN EXITOSA!`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        break;
      }
    } catch (err) {
      console.log(`❌ ${password}: Error - ${err.message}`);
    }
  }
}

testPasswords();


