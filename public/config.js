// Configuración pública para GitHub Pages
// ⚠️ IMPORTANTE: Reemplazar con tus credenciales reales
// Para testing, usar valores de ejemplo que no causen errores DNS

window.ENV_CONFIG = {
  VITE_SUPABASE_URL: 'https://example.supabase.co', // URL de ejemplo para evitar DNS errors
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example', // Key de ejemplo
  VITE_N8N_WEBHOOK_URL: 'https://example.com/webhook', // URL de ejemplo
  VITE_AFIP_CUIT: '20409378472', // CUIT de ejemplo válido
  VITE_GMAIL_FROM: 'test@example.com' // Email de ejemplo
};

// Función para detectar si estamos en GitHub Pages
if (window.location.hostname === 'chelof100.github.io') {
  console.log('Running on GitHub Pages - using example config');
  // Aquí podrías cargar configuración específica para GitHub Pages
} 