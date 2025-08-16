import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uymvmqbiapcnfqskkdny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bXZtcWJpYXBjbmZxc2trZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTU4MDYsImV4cCI6MjA2ODAzMTgwNn0.CWH8cta4J0-GQQASH62PP2pkjf3WBft8UEtHVD6KZ_c';

const supabase = createClient(supabaseUrl, supabaseKey);

const commonPasswords = [
  'password',
  '123456',
  'admin',
  'developer',
  'onepyme',
  'contapyme',
  'test123',
  'admin123',
  'developer123',
  'password123',
  '123456789',
  'qwerty',
  'abc123',
  'letmein',
  'welcome'
];

async function testPasswords() {
  console.log('🔐 Probando contraseñas comunes...');
  
  const users = [
    'developer@onepyme.pro',
    'admin@onepyme.pro',
    'dev@onepyme.pro'
  ];
  
  for (const user of users) {
    console.log(`\n📧 Probando usuario: ${user}`);
    
    for (const password of commonPasswords) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: user,
          password: password
        });
        
        if (!error) {
          console.log(`✅ ¡CONTRASEÑA ENCONTRADA! ${user} / ${password}`);
          return;
        }
      } catch (err) {
        // Continuar con la siguiente contraseña
      }
    }
    
    console.log(`❌ No se encontró contraseña para ${user}`);
  }
}

testPasswords();
