import { z } from 'zod';

interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  api: {
    n8n: {
      baseUrl: string;
      apiKey?: string; // Mantener para webhooks
      timeout: number;
      retryAttempts: number;
      retryDelay: number;
      rateLimiting: {
        enabled: boolean;
        requestsPerMinute: number;
        burstLimit: number;
      };
      batchSize: number;
      healthCheckInterval: number;
      webhookEndpoints: {
        healthCheck: string;
        facturaEmision: string;
        facturaRecepcion: string;
        ordenCompra: string;
        ordenRecepcion: string;
        pago: string;
        stockMovimiento: string;
        stockAlerta: string;
        recetaCreacion: string;
        recetaVenta: string;
      };
    };
    supabase: {
      url: string;
      anonKey: string;
      serviceRoleKey?: string;
      maxConnections: number;
      connectionTimeout: number;
    };
  };
  features: {
    recetasEnabled: boolean;
    stockAlertsEnabled: boolean;
    mercadoPagoEnabled: boolean;
    afipIntegrationEnabled: boolean;
    offlineSupport: boolean;
    realTimeSync: boolean;
    batchProcessing: boolean;
    advancedReports: boolean;
    multiCompany: boolean;
  };
  validation: {
    cuitRequired: boolean;
    stockMinimoDefault: number;
    facturaExpirationDays: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    strictValidation: boolean;
  };
  ui: {
    itemsPerPage: number;
    autoSaveInterval: number;
    notificationDuration: number;
    theme: 'light' | 'dark' | 'auto';
    language: 'es' | 'en';
    dateFormat: string;
    currencyFormat: string;
    showAdvancedFeatures: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    encryptLocalStorage: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableErrorTracking: boolean;
    enablePerformanceTracking: boolean;
    sampleRate: number;
  };
}

// Esquema de validación para la configuración
const configSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    environment: z.enum(['development', 'staging', 'production']),
    debug: z.boolean(),
    logLevel: z.enum(['error', 'warn', 'info', 'debug'])
  }),
  api: z.object({
    n8n: z.object({
      baseUrl: z.string().url(),
      apiKey: z.string().optional(),
      timeout: z.number().min(1000).max(60000),
      retryAttempts: z.number().min(0).max(10),
      retryDelay: z.number().min(100).max(10000),
      rateLimiting: z.object({
        enabled: z.boolean(),
        requestsPerMinute: z.number().min(1).max(1000),
        burstLimit: z.number().min(1).max(100)
      }),
      batchSize: z.number().min(1).max(100),
      healthCheckInterval: z.number().min(10000).max(600000),
      webhookEndpoints: z.object({
        healthCheck: z.string(),
        facturaEmision: z.string(),
        facturaRecepcion: z.string(),
        ordenCompra: z.string(),
        ordenRecepcion: z.string(),
        pago: z.string(),
        stockMovimiento: z.string(),
        stockAlerta: z.string(),
        recetaCreacion: z.string(),
        recetaVenta: z.string()
      })
    }),
    supabase: z.object({
      url: z.string().url(),
      anonKey: z.string(),
      serviceRoleKey: z.string().optional(),
      maxConnections: z.number().min(1).max(100),
      connectionTimeout: z.number().min(1000).max(30000)
    })
  }),
  features: z.object({
    recetasEnabled: z.boolean(),
    stockAlertsEnabled: z.boolean(),
    mercadoPagoEnabled: z.boolean(),
    afipIntegrationEnabled: z.boolean(),
    offlineSupport: z.boolean(),
    realTimeSync: z.boolean(),
    batchProcessing: z.boolean(),
    advancedReports: z.boolean(),
    multiCompany: z.boolean()
  }),
  validation: z.object({
    cuitRequired: z.boolean(),
    stockMinimoDefault: z.number().min(0),
    facturaExpirationDays: z.number().min(1),
    maxFileSize: z.number().min(1024),
    allowedFileTypes: z.array(z.string()),
    strictValidation: z.boolean()
  }),
  ui: z.object({
    itemsPerPage: z.number().min(5).max(100),
    autoSaveInterval: z.number().min(5000),
    notificationDuration: z.number().min(1000),
    theme: z.enum(['light', 'dark', 'auto']),
    language: z.enum(['es', 'en']),
    dateFormat: z.string(),
    currencyFormat: z.string(),
    showAdvancedFeatures: z.boolean()
  }),
  security: z.object({
    sessionTimeout: z.number().min(300000), // 5 minutos mínimo
    maxLoginAttempts: z.number().min(3).max(10),
    passwordMinLength: z.number().min(6).max(50),
    requireTwoFactor: z.boolean(),
    encryptLocalStorage: z.boolean()
  }),
  monitoring: z.object({
    enableMetrics: z.boolean(),
    enableErrorTracking: z.boolean(),
    enablePerformanceTracking: z.boolean(),
    sampleRate: z.number().min(0).max(1)
  })
});

const defaultConfig: AppConfig = {
  app: {
    name: 'ContaPYME',
    version: '1.0.0',
    environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
    debug: import.meta.env.MODE === 'development',
    logLevel: import.meta.env.MODE === 'development' ? 'debug' : 'info'
  },
  api: {
    n8n: {
      baseUrl: import.meta.env.VITE_N8N_URL || 'http://localhost:5678',
      apiKey: import.meta.env.VITE_N8N_API_KEY, // Para webhooks
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 60,
        burstLimit: 10
      },
      batchSize: 10,
      healthCheckInterval: 300000, // 5 minutos
      webhookEndpoints: {
        healthCheck: '/webhook/health-check',
        facturaEmision: '/webhook/factura-emision',
        facturaRecepcion: '/webhook/factura-recepcion',
        ordenCompra: '/webhook/orden-compra',
        ordenRecepcion: '/webhook/orden-recepcion',
        pago: '/webhook/pago',
        stockMovimiento: '/webhook/stock-movimiento',
        stockAlerta: '/webhook/stock-alerta',
        recetaCreacion: '/webhook/receta-creacion',
        recetaVenta: '/webhook/receta-venta'
      }
    },
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      maxConnections: 10,
      connectionTimeout: 10000
    }
  },
  features: {
    recetasEnabled: false,
    stockAlertsEnabled: true,
    mercadoPagoEnabled: true,
    afipIntegrationEnabled: false,
    offlineSupport: true,
    realTimeSync: true,
    batchProcessing: true,
    advancedReports: false,
    multiCompany: false
  },
  validation: {
    cuitRequired: true,
    stockMinimoDefault: 10,
    facturaExpirationDays: 30,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/csv'],
    strictValidation: true
  },
  ui: {
    itemsPerPage: 20,
    autoSaveInterval: 30000,
    notificationDuration: 5000,
    theme: 'light',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    currencyFormat: 'es-AR',
    showAdvancedFeatures: false
  },
  security: {
    sessionTimeout: 1800000, // 30 minutos
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    encryptLocalStorage: false
  },
  monitoring: {
    enableMetrics: true,
    enableErrorTracking: true,
    enablePerformanceTracking: import.meta.env.MODE === 'production',
    sampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1
  }
};

class ConfigManager {
  private config: AppConfig;
  private listeners: Array<(config: AppConfig) => void> = [];
  private readonly STORAGE_KEY = 'contapyme-config';
  private readonly CONFIG_VERSION = '1.0';

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
    this.setupAutoSave();
  }

  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        
        // Verificar versión de configuración
        if (parsedConfig.version !== this.CONFIG_VERSION) {
          console.warn('Config version mismatch, using defaults');
          localStorage.removeItem(this.STORAGE_KEY);
          return defaultConfig;
        }
        
        // Merge con configuración por defecto para nuevas propiedades
        const mergedConfig = this.mergeConfigs(defaultConfig, parsedConfig.config);
        
        // Validar la configuración mergeada
        try {
          configSchema.parse(mergedConfig);
          return mergedConfig;
        } catch (validationError) {
          console.warn('Invalid merged config, using defaults:', validationError);
          localStorage.removeItem(this.STORAGE_KEY);
          return defaultConfig;
        }
      }
    } catch (error) {
      console.warn('Error loading stored config, using defaults:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
    
    return defaultConfig;
  }

  private mergeConfigs(defaultConfig: AppConfig, storedConfig: any): AppConfig {
    const merged = { ...defaultConfig };
    
    // Merge recursivo manteniendo la estructura
    Object.keys(defaultConfig).forEach(key => {
      if (storedConfig[key] && typeof defaultConfig[key as keyof AppConfig] === 'object') {
        merged[key as keyof AppConfig] = {
          ...defaultConfig[key as keyof AppConfig],
          ...storedConfig[key]
        } as any;
      } else if (storedConfig[key] !== undefined) {
        (merged as any)[key] = storedConfig[key];
      }
    });
    
    return merged;
  }

  private validateConfig(): void {
    try {
      configSchema.parse(this.config);
    } catch (error) {
      console.error('Invalid configuration detected:', error);
      // En caso de configuración inválida, limpiar localStorage y usar defaults
      console.warn('Resetting to default configuration due to validation error');
      localStorage.removeItem(this.STORAGE_KEY);
      this.config = defaultConfig;
      this.saveConfig();
    }
  }

  private setupAutoSave(): void {
    // Auto-guardar configuración cada 5 minutos
    setInterval(() => {
      this.saveConfig();
    }, 5 * 60 * 1000);
    
    // Guardar antes de cerrar la ventana
    window.addEventListener('beforeunload', () => {
      this.saveConfig();
    });
  }
  public getConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config)); // Deep clone
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    const newConfig = this.mergeConfigs(this.config, updates);
    
    try {
      configSchema.parse(newConfig);
      this.config = newConfig;
      this.saveConfig();
      this.notifyListeners();
    } catch (error) {
      console.error('Invalid config update:', error);
      throw new Error('Configuración inválida');
    }
  }

  public updateSection<K extends keyof AppConfig>(
    section: K, 
    updates: Partial<AppConfig[K]>
  ): void {
    const newConfig = {
      ...this.config,
      [section]: {
        ...this.config[section],
        ...updates
      }
    };
    
    try {
      configSchema.parse(newConfig);
      this.config = newConfig;
      this.saveConfig();
      this.notifyListeners();
    } catch (error) {
      console.error('Invalid section update:', error);
      throw new Error(`Configuración inválida para sección ${section}`);
    }
    this.saveConfig();
  }

  public updateN8nConfig(n8nConfig: Partial<AppConfig['api']['n8n']>): void {
    this.updateSection('api', {
      ...this.config.api,
      n8n: { ...this.config.api.n8n, ...n8nConfig }
    });
  }

  public updateFeatures(features: Partial<AppConfig['features']>): void {
    this.updateSection('features', features);
  }

  private saveConfig(): void {
    try {
      const configToSave = {
        version: this.CONFIG_VERSION,
        timestamp: new Date().toISOString(),
        config: this.config
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    });
  }

  public subscribe(listener: (config: AppConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  public resetToDefaults(): void {
    this.config = defaultConfig;
    localStorage.removeItem(this.STORAGE_KEY);
    this.notifyListeners();
  }

  public exportConfig(): string {
    return JSON.stringify({
      version: this.CONFIG_VERSION,
      timestamp: new Date().toISOString(),
      config: this.config
    }, null, 2);
  }

  public importConfig(configJson: string): void {
    try {
      const imported = JSON.parse(configJson);
      
      if (imported.version !== this.CONFIG_VERSION) {
        throw new Error('Versión de configuración incompatible');
      }
      
      configSchema.parse(imported.config);
      this.config = imported.config;
      this.saveConfig();
      this.notifyListeners();
    } catch (error) {
      console.error('Error importing config:', error);
      throw new Error('Configuración inválida para importar');
    }
  }

  // Getters específicos para facilitar el uso
  public get n8nBaseUrl(): string {
    return this.config.api.n8n.baseUrl;
  }

  public get isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  public get isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public get isDebugMode(): boolean {
    return this.config.app.debug;
  }

  public get logLevel(): string {
    return this.config.app.logLevel;
  }

  public get offlineSupportEnabled(): boolean {
    return this.config.features.offlineSupport;
  }

  public get realTimeSyncEnabled(): boolean {
    return this.config.features.realTimeSync;
  }

  public get batchProcessingEnabled(): boolean {
    return this.config.features.batchProcessing;
  }

  // Métodos para validaciones específicas
  public validateN8nUrl(url: string): boolean {
    try {
      new URL(url);
      return !url.includes('n8n.n8ncloud.top') && 
             !url.includes('localhost') && 
             !url.includes('127.0.0.1') &&
             url.trim() !== '';
    } catch {
      return false;
    }
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getUIConfig() {
    return this.config.ui;
  }

  public getSecurityConfig() {
    return this.config.security;
  }

  public getMonitoringConfig() {
    return this.config.monitoring;
  }
}

export const configManager = new ConfigManager();
export type { AppConfig };