// =====================================================
// ONEPYME - CONFIGURACIÓN PÚBLICA
// =====================================================
// Este archivo contiene la configuración necesaria para el cliente Supabase
// Se carga antes que la aplicación para asegurar que las variables estén disponibles
// =====================================================

window.ENV_CONFIG = {
  // ===== SUPABASE =====
  VITE_SUPABASE_URL: 'https://xglewrlsvdqenowithal.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbGV3cmxzdmRxZW5vd2l0aGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDMwODUsImV4cCI6MjA3MTIxOTA4NX0.EJwJPBuf-essuZYKfO1onu6UByrD3ijsJPuC3DOuXH0',
  
  // ===== N8N INTEGRATION (OPCIONAL) =====
  VITE_N8N_WEBHOOK_URL: '',
  
  // ===== CONFIGURACIÓN DE EMPRESA =====
  VITE_AFIP_CUIT: '30-00000000-0',
  VITE_GMAIL_FROM: '',
  
  // ===== ENTORNO =====
  NODE_ENV: 'development'
};

// =====================================================
// VERIFICACIÓN DE CONFIGURACIÓN
// =====================================================
console.log('🔧 [Config] Configuración cargada:', {
  SUPABASE_URL: window.ENV_CONFIG.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: window.ENV_CONFIG.VITE_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado',
  NODE_ENV: window.ENV_CONFIG.NODE_ENV
});

// =====================================================
// VALIDACIÓN DE CONFIGURACIÓN
// =====================================================
if (!window.ENV_CONFIG.VITE_SUPABASE_URL) {
  console.error('❌ [Config] VITE_SUPABASE_URL no está configurado');
}

if (!window.ENV_CONFIG.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ [Config] VITE_SUPABASE_ANON_KEY no está configurado');
}

console.log('✅ [Config] Configuración de OnePyme cargada exitosamente');
