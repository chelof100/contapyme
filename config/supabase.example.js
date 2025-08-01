// ContaPYME - Configuración de Supabase
// Copia este archivo como supabase.js y configura tus valores

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Configuración adicional para desarrollo
if (import.meta.env.DEV) {
  console.log('🔧 ContaPYME - Modo desarrollo activado')
  console.log('📊 Supabase URL:', supabaseUrl)
}

export default supabase 