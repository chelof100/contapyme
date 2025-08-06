// Configuración centralizada de entornos
export interface EnvironmentConfig {
  name: string;
  supabase: {
    url: string;
    anonKey: string;
  };
  n8n: {
    baseUrl: string;
    apiKey?: string;
  };
  features: {
    recetasEnabled: boolean;
    stockAlertsEnabled: boolean;
    afipIntegrationEnabled: boolean;
    realTimeSync: boolean;
  };
  debug: boolean;
}

// Configuración por defecto
const defaultConfig: EnvironmentConfig = {
  name: 'development',
  supabase: {
    url: '',
    anonKey: ''
  },
  n8n: {
    baseUrl: 'https://n8n.n8ncloud.top',
    apiKey: undefined
  },
  features: {
    recetasEnabled: true,
    stockAlertsEnabled: true,
    afipIntegrationEnabled: true,
    realTimeSync: true
  },
  debug: true
};

// Detectar entorno
const getEnvironment = (): string => {
  if (typeof window !== 'undefined') {
    // Cliente
    if (window.location.hostname === 'chelof100.github.io') {
      return 'demo';
    }
    if (window.location.hostname === 'localhost') {
      return 'development';
    }
    return 'production';
  }
  // Servidor
  return process.env.NODE_ENV || 'development';
};

// Cargar configuración específica del entorno
const loadEnvironmentConfig = (): EnvironmentConfig => {
  const env = getEnvironment();
  
  switch (env) {
    case 'demo':
      return {
        ...defaultConfig,
        name: 'demo',
        supabase: {
          url: 'https://example.supabase.co',
          anonKey: 'demo-key'
        },
        n8n: {
          baseUrl: 'https://demo.n8n.cloud',
          apiKey: 'demo-key'
        },
        features: {
          recetasEnabled: true,
          stockAlertsEnabled: true,
          afipIntegrationEnabled: false,
          realTimeSync: false
        },
        debug: false
      };
      
    case 'production':
      return {
        ...defaultConfig,
        name: 'production',
        supabase: {
          url: import.meta.env.VITE_SUPABASE_URL || '',
          anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        n8n: {
          baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.n8ncloud.top',
          apiKey: import.meta.env.VITE_N8N_API_KEY
        },
        features: {
          recetasEnabled: true,
          stockAlertsEnabled: true,
          afipIntegrationEnabled: true,
          realTimeSync: true
        },
        debug: false
      };
      
    default: // development
      return {
        ...defaultConfig,
        name: 'development',
        supabase: {
          url: import.meta.env.VITE_SUPABASE_URL || '',
          anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },
        n8n: {
          baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.n8ncloud.top',
          apiKey: import.meta.env.VITE_N8N_API_KEY
        },
        features: {
          recetasEnabled: true,
          stockAlertsEnabled: true,
          afipIntegrationEnabled: true,
          realTimeSync: true
        },
        debug: true
      };
  }
};

// Configuración global
export const environmentConfig = loadEnvironmentConfig();

// Helpers
export const isDevelopment = () => environmentConfig.name === 'development';
export const isProduction = () => environmentConfig.name === 'production';
export const isDemo = () => environmentConfig.name === 'demo';
export const isDebug = () => environmentConfig.debug;

// Validación de configuración
export const validateConfig = (): void => {
  if (!environmentConfig.supabase.url && !isDemo()) {
    throw new Error('VITE_SUPABASE_URL is required for non-demo environments');
  }
  if (!environmentConfig.supabase.anonKey && !isDemo()) {
    throw new Error('VITE_SUPABASE_ANON_KEY is required for non-demo environments');
  }
};

// Exportar configuración
export default environmentConfig; 