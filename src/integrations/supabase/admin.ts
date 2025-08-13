import { createClient } from '@supabase/supabase-js';

// Cliente admin singleton para operaciones administrativas
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
