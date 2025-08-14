const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnosing OnePyme system...\n');

  try {
    // 1. Check if we can connect to Supabase
    console.log('1️⃣ Testing Supabase connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else {
      console.log('✅ Supabase connection OK');
      console.log('   Session:', !!session);
    }

    // 2. Try to sign in as developer
    console.log('\n2️⃣ Attempting developer login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'developer@onepyme.pro',
      password: 'developer123'
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError.message);
      return;
    }

    if (signInData.user) {
      console.log('✅ Developer login successful');
      console.log('   User ID:', signInData.user.id);
      console.log('   Email:', signInData.user.email);
    }

    // 3. Check user profile
    console.log('\n3️⃣ Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      console.error('   Details:', profileError);
    } else if (profile) {
      console.log('✅ Profile fetched successfully');
      console.log('   Role:', profile.role);
      console.log('   Empresa ID:', profile.empresa_id);
      console.log('   Username:', profile.username);
    }

    // 4. Test admin access
    console.log('\n4️⃣ Testing admin access...');
    const { data: adminTest, error: adminError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (adminError) {
      console.error('❌ Admin access test failed:', adminError.message);
    } else {
      console.log('✅ Admin access test passed');
    }

    // 5. Check if user_actions table exists and is accessible
    console.log('\n5️⃣ Testing user_actions table...');
    const { data: actionsTest, error: actionsError } = await supabase
      .from('user_actions')
      .select('count')
      .limit(1);

    if (actionsError) {
      console.error('❌ user_actions access failed:', actionsError.message);
    } else {
      console.log('✅ user_actions access OK');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n🔒 Signed out');
  }
}

diagnose();
