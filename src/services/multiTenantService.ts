import { configManager } from '@/config/app';
import { webhookService } from './webhookService';

export interface ClientConfig {
  clientId: string;
  clientName: string;
  webhookPrefix: string;
  baseUrl: string;
  apiKey?: string;
  customEndpoints?: Record<string, string>;
  features: {
    facturacion: boolean;
    stock: boolean;
    pagos: boolean;
    alertas: boolean;
    recetas: boolean;
    crm: boolean;
    erp: boolean;
    monitoreo: boolean;
  };
  settings: {
    timeout: number;
    retryAttempts: number;
    rateLimiting: boolean;
    requestsPerMinute: number;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface MultiTenantConfig {
  enabled: boolean;
  defaultClientId: string;
  clients: Record<string, ClientConfig>;
  globalSettings: {
    defaultTimeout: number;
    defaultRetryAttempts: number;
    defaultRateLimiting: boolean;
    defaultRequestsPerMinute: number;
  };
}

class MultiTenantService {
  private config: MultiTenantConfig;
  private currentClientId: string;

  constructor() {
    this.config = this.loadConfig();
    this.currentClientId = this.config.defaultClientId || 'client_1';
  }

  private loadConfig(): MultiTenantConfig {
    const saved = localStorage.getItem('multi-tenant-config');
    if (saved) {
      return JSON.parse(saved);
    }

    // Configuración por defecto
    return {
      enabled: true,
      defaultClientId: 'client_1',
      clients: {
        'client_1': {
          clientId: 'client_1',
          clientName: 'Usuario 1 (Desarrollo)',
          webhookPrefix: '/webhook/client-1',
          baseUrl: '',
          apiKey: '',
          customEndpoints: {},
          features: {
            facturacion: true,
            stock: true,
            pagos: true,
            alertas: true,
            recetas: true,
            crm: true,
            erp: true,
            monitoreo: true
          },
          settings: {
            timeout: 30000,
            retryAttempts: 3,
            rateLimiting: true,
            requestsPerMinute: 60
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        }
      },
      globalSettings: {
        defaultTimeout: 30000,
        defaultRetryAttempts: 3,
        defaultRateLimiting: true,
        defaultRequestsPerMinute: 60
      }
    };
  }

  private saveConfig(): void {
    localStorage.setItem('multi-tenant-config', JSON.stringify(this.config));
  }

  // Gestión de clientes
  async createClient(clientData: Omit<ClientConfig, 'clientId' | 'createdAt' | 'updatedAt'>): Promise<ClientConfig> {
    const clientId = `client_${Date.now()}`;
    const client: ClientConfig = {
      ...clientData,
      clientId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.config.clients[clientId] = client;
    this.saveConfig();

    return client;
  }

  async updateClient(clientId: string, updates: Partial<ClientConfig>): Promise<ClientConfig> {
    if (!this.config.clients[clientId]) {
      throw new Error(`Cliente ${clientId} no encontrado`);
    }

    this.config.clients[clientId] = {
      ...this.config.clients[clientId],
      ...updates,
      updatedAt: new Date()
    };

    this.saveConfig();
    return this.config.clients[clientId];
  }

  async deleteClient(clientId: string): Promise<void> {
    if (!this.config.clients[clientId]) {
      throw new Error(`Cliente ${clientId} no encontrado`);
    }

    delete this.config.clients[clientId];
    this.saveConfig();
  }

  async getClient(clientId: string): Promise<ClientConfig | null> {
    return this.config.clients[clientId] || null;
  }

  async getAllClients(): Promise<ClientConfig[]> {
    return Object.values(this.config.clients);
  }

  async getActiveClients(): Promise<ClientConfig[]> {
    return Object.values(this.config.clients).filter(client => client.isActive);
  }

  // Gestión de cliente actual
  setCurrentClient(clientId: string): void {
    if (!this.config.clients[clientId]) {
      throw new Error(`Cliente ${clientId} no encontrado`);
    }
    this.currentClientId = clientId;
    this.applyClientConfig(clientId);
  }

  getCurrentClient(): ClientConfig | null {
    return this.config.clients[this.currentClientId] || null;
  }

  getCurrentClientId(): string {
    return this.currentClientId;
  }

  // Aplicar configuración de cliente
  private applyClientConfig(clientId: string): void {
    const client = this.config.clients[clientId];
    if (!client) return;

    // Configurar webhookService con la configuración del cliente
    webhookService.setBaseUrl(client.baseUrl);
    if (client.apiKey) {
      webhookService.setApiKey(client.apiKey);
    }
    webhookService.setTimeout(client.settings.timeout);
    webhookService.setRateLimiting(
      client.settings.rateLimiting,
      client.settings.requestsPerMinute
    );

    // Actualizar endpoints con prefijo del cliente
    const endpoints = this.buildClientEndpoints(client);
    webhookService.updateEndpoints(endpoints);
  }

  // Construir endpoints específicos del cliente
  private buildClientEndpoints(client: ClientConfig): Record<string, string> {
    const baseEndpoints = {
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
    };

    // Aplicar prefijo del cliente
    const clientEndpoints: Record<string, string> = {};
    Object.entries(baseEndpoints).forEach(([key, endpoint]) => {
      clientEndpoints[key] = `${client.webhookPrefix}${endpoint}`;
    });

    // Aplicar endpoints personalizados si existen
    if (client.customEndpoints) {
      Object.assign(clientEndpoints, client.customEndpoints);
    }

    return clientEndpoints;
  }

  // Obtener URL de webhook para cliente específico
  getWebhookUrl(clientId: string, endpoint: string): string {
    const client = this.config.clients[clientId];
    if (!client) {
      throw new Error(`Cliente ${clientId} no encontrado`);
    }

    const endpoints = this.buildClientEndpoints(client);
    return `${client.baseUrl}${endpoints[endpoint] || endpoint}`;
  }

  // Validar configuración de cliente
  async validateClientConfig(clientId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const client = this.config.clients[clientId];
    if (!client) {
      return {
        isValid: false,
        errors: [`Cliente ${clientId} no encontrado`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar campos requeridos
    if (!client.baseUrl) {
      errors.push('URL base no configurada');
    } else if (!client.baseUrl.startsWith('http')) {
      errors.push('URL base debe comenzar con http:// o https://');
    }

    if (!client.webhookPrefix) {
      errors.push('Prefijo de webhook no configurado');
    }

    if (!client.clientName) {
      errors.push('Nombre del cliente no configurado');
    }

    // Validar configuración de features
    const activeFeatures = Object.values(client.features).filter(Boolean).length;
    if (activeFeatures === 0) {
      warnings.push('No hay features activas configuradas');
    }

    // Validar configuración de settings
    if (client.settings.timeout < 1000) {
      warnings.push('Timeout muy bajo (< 1000ms)');
    }

    if (client.settings.retryAttempts > 10) {
      warnings.push('Demasiados reintentos (> 10)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Backup y restore
  async exportClientConfig(clientId: string): Promise<string> {
    const client = this.config.clients[clientId];
    if (!client) {
      throw new Error(`Cliente ${clientId} no encontrado`);
    }

    return JSON.stringify(client, null, 2);
  }

  async importClientConfig(configData: string): Promise<ClientConfig> {
    try {
      const clientData = JSON.parse(configData);
      const clientId = clientData.clientId || `client_${Date.now()}`;
      
      const client: ClientConfig = {
        ...clientData,
        clientId,
        updatedAt: new Date()
      };

      this.config.clients[clientId] = client;
      this.saveConfig();

      return client;
    } catch (error) {
      throw new Error('Formato de configuración inválido');
    }
  }

  // Configuración global
  updateGlobalSettings(settings: Partial<MultiTenantConfig['globalSettings']>): void {
    this.config.globalSettings = {
      ...this.config.globalSettings,
      ...settings
    };
    this.saveConfig();
  }

  getGlobalSettings(): MultiTenantConfig['globalSettings'] {
    return { ...this.config.globalSettings };
  }

  // Habilitar/deshabilitar multi-tenant
  setMultiTenantEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  isMultiTenantEnabled(): boolean {
    return this.config.enabled;
  }

  // Obtener configuración completa
  getConfig(): MultiTenantConfig {
    return { ...this.config };
  }

  // Resetear configuración
  resetConfig(): void {
    localStorage.removeItem('multi-tenant-config');
    this.config = this.loadConfig();
  }
}

export const multiTenantService = new MultiTenantService();
export default multiTenantService;
