export interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
    mock: boolean;
  };
  n8n: {
    baseUrl: string;
    apiKey: string;
    mock: boolean;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'demo';
  };
  features: {
    facturas: boolean;
    stock: boolean;
    crm: boolean;
    reports: boolean;
    analytics: boolean;
  };
}

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'dev-key',
      mock: false,
    },
    n8n: {
      baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678',
      apiKey: import.meta.env.VITE_N8N_API_KEY || 'dev-key',
      mock: false,
    },
    app: {
      name: 'ContaPYME',
      version: '1.0.0',
      environment: 'development',
    },
    features: {
      facturas: true,
      stock: true,
      crm: true,
      reports: true,
      analytics: true,
    },
  },
  production: {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      mock: false,
    },
    n8n: {
      baseUrl: import.meta.env.VITE_N8N_BASE_URL || '',
      apiKey: import.meta.env.VITE_N8N_API_KEY || '',
      mock: false,
    },
    app: {
      name: 'ContaPYME',
      version: '1.0.0',
      environment: 'production',
    },
    features: {
      facturas: true,
      stock: true,
      crm: true,
      reports: true,
      analytics: true,
    },
  },
  demo: {
    supabase: {
      url: 'https://example.supabase.co',
      anonKey: 'demo-key',
      mock: true,
    },
    n8n: {
      baseUrl: 'https://example.com/webhook',
      apiKey: 'demo-key',
      mock: true,
    },
    app: {
      name: 'ContaPYME Demo',
      version: '1.0.0',
      environment: 'demo',
    },
    features: {
      facturas: true,
      stock: true,
      crm: true,
      reports: false, // Solo UI en demo
      analytics: false, // Solo UI en demo
    },
  },
};

export const getCurrentEnvironment = (): EnvironmentConfig => {
  const env = import.meta.env.MODE || 'development';
  return environments[env] || environments.development;
};

export const isDemo = (): boolean => {
  return getCurrentEnvironment().app.environment === 'demo';
};

export const isProduction = (): boolean => {
  return getCurrentEnvironment().app.environment === 'production';
};

export const isDevelopment = (): boolean => {
  return getCurrentEnvironment().app.environment === 'development';
}; 