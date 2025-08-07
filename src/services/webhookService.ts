import { configManager } from '@/config/app';
import { errorHandler } from '@/utils/errorHandler';
import { validateData, facturaSchema, ordenCompraSchema, pagoSchema } from '@/utils/validation';

interface WebhookResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  timestamp?: string;
  executionId?: string;
  requestId?: string;
}

interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoffMultiplier?: number;
}

interface WebhookEndpoints {
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
}

interface WebhookConfig {
  baseUrl: string;
  endpoints: WebhookEndpoints;
  timeout: number;
  defaultHeaders: Record<string, string>;
  retryConfig: RetryConfig;
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  apiKey?: string;
}

interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
}

class WebhookService {
  private config: WebhookConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitTokens: number;
  private lastTokenRefill: number;
  private metrics: RequestMetrics;
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    delay: 1000,
    backoffMultiplier: 2
  };

  constructor(baseUrl?: string) {
    const appConfig = configManager.getConfig();
    
    // Cargar configuración de webhooks desde localStorage
    const savedWebhookConfig = localStorage.getItem('webhook-endpoints');
    const webhookEndpoints = savedWebhookConfig 
      ? JSON.parse(savedWebhookConfig).endpoints 
      : this.getDefaultEndpoints();
    
    this.config = {
      baseUrl: baseUrl || appConfig.api.n8n.baseUrl,
      endpoints: webhookEndpoints,
      timeout: appConfig.api.n8n.timeout,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': `ContaPYME/${appConfig.app.version}`,
        'X-Client-Version': appConfig.app.version,
        'X-Environment': appConfig.app.environment
      },
      retryConfig: {
        maxRetries: appConfig.api.n8n.retryAttempts,
        delay: 1000, // Delay fijo de 1 segundo
        backoffMultiplier: 2
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 60,
        burstLimit: 10
      },
      apiKey: appConfig.api.n8n.apiKey
    };
    
    this.rateLimitTokens = this.config.rateLimiting.burstLimit;
    this.lastTokenRefill = Date.now();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    };
  }

  private getDefaultEndpoints(): WebhookEndpoints {
    return {
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
  }

  // Actualizar configuración de endpoints
  public updateEndpoints(endpoints: Partial<WebhookEndpoints>): void {
    this.config.endpoints = { ...this.config.endpoints, ...endpoints };
    
    // Guardar en localStorage
    const currentConfig = localStorage.getItem('webhook-endpoints');
    const config = currentConfig ? JSON.parse(currentConfig) : { endpoints: this.getDefaultEndpoints() };
    config.endpoints = this.config.endpoints;
    localStorage.setItem('webhook-endpoints', JSON.stringify(config));
  }

  // Configurar headers de autenticación
  setApiKey(apiKey: string) {
    this.config.defaultHeaders['X-N8N-API-KEY'] = apiKey;
    this.config.apiKey = apiKey;
    localStorage.setItem('n8n-api-key', apiKey);
  }

  // Método legacy para compatibilidad
  setAuthToken(token: string) {
    this.setApiKey(token);
  }

  // Configurar timeout
  setTimeout(timeout: number) {
    this.config.timeout = timeout;
  }

  // Configurar URL base
  setBaseUrl(url: string) {
    this.config.baseUrl = url;
    configManager.updateN8nConfig({ baseUrl: url });
  }

  // Rate limiting
  private async waitForRateLimit(): Promise<void> {
    if (!this.config.rateLimiting.enabled) return;
    
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastTokenRefill;
    
    // Rellenar tokens basado en tiempo transcurrido
    if (timeSinceLastRefill >= 60000) { // 1 minuto
      this.rateLimitTokens = this.config.rateLimiting.burstLimit;
      this.lastTokenRefill = now;
    }
    
    if (this.rateLimitTokens <= 0) {
      const waitTime = 60000 - timeSinceLastRefill;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitTokens = this.config.rateLimiting.burstLimit;
      this.lastTokenRefill = Date.now();
    }
    
    this.rateLimitTokens--;
  }

  // Validar configuración antes de hacer requests
  private validateConfig(): void {
    if (!this.config.baseUrl || this.config.baseUrl.trim() === '') {
      throw new Error('n8n URL not configured');
    }
    
    // Permitir localhost para desarrollo con proxy
    if (this.config.baseUrl.includes('tu-workspace') ||
        this.config.baseUrl.includes('placeholder')) {
      throw new Error('n8n URL not configured properly - using placeholder URL');
    }
    
    if (!this.config.baseUrl.startsWith('http')) {
      throw new Error('n8n URL must start with http or https');
    }
  }

  private async makeRequest(
    endpoint: string, 
    data: any, 
    options: {
      retryConfig?: RetryConfig;
      validate?: boolean;
      schema?: any;
      priority?: 'high' | 'medium' | 'low';
      method?: 'GET' | 'POST';
    } = {}
  ): Promise<WebhookResponse> {
    const { 
      retryConfig = this.config.retryConfig, 
      validate = false, 
      schema,
      priority = 'medium',
      method = 'POST'
    } = options;
    
    console.log('🔍 [WebhookService] Configuración actual:', {
      baseUrl: this.config.baseUrl,
      endpoint,
      method,
      priority
    });
    
    // Check if n8n is configured before making request
    try {
      this.validateConfig();
    } catch (error) {
      console.error('❌ [WebhookService] Error de validación:', error);
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 0,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      };
    }
    
    // Validar datos si se especifica
    if (validate && schema) {
      const validation = validateData(schema, data);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
      }
    }
    
    await this.waitForRateLimit();
    
    let lastError: Error | null = null;
    let currentDelay = retryConfig.delay;
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[${requestId}] Intento ${attempt + 1} - ${endpoint}`, { data, priority });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const enhancedHeaders = {
          ...this.config.defaultHeaders,
          'X-Request-ID': requestId,
          'X-Timestamp': new Date().toISOString(),
          'X-Attempt': (attempt + 1).toString(),
          'X-Priority': priority,
          'Accept': 'application/json'
        };

        // Agregar API Key si está configurada
        if (this.config.apiKey) {
          enhancedHeaders['X-N8N-API-KEY'] = this.config.apiKey;
        }

        const fetchOptions: RequestInit = {
          method,
          headers: enhancedHeaders,
          signal: controller.signal
        };

        // Solo agregar body para POST requests
        if (method === 'POST') {
          fetchOptions.body = JSON.stringify({
            ...data,
            metadata: {
              requestId,
              timestamp: new Date().toISOString(),
              source: 'ContaPYME-Frontend',
              version: configManager.getConfig().app.version,
              attempt: attempt + 1,
              priority
            }
          });
        }

        const fullUrl = `${this.config.baseUrl}${endpoint}`;
        console.log('🌐 [WebhookService] Haciendo petición a:', fullUrl);
        console.log('📤 [WebhookService] Opciones de fetch:', fetchOptions);
        
        const response = await fetch(fullUrl, fetchOptions);

        clearTimeout(timeoutId);

        console.log('📥 [WebhookService] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        const result = await response.json();
        const responseTime = Date.now() - startTime;
        
        // Actualizar métricas
        this.updateMetrics(true, responseTime);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${result.error || response.statusText}`);
        }
        
        console.log(`[${requestId}] Respuesta exitosa (${responseTime}ms):`, result);
        
        return {
          success: true,
          data: result.data || result,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          executionId: result.executionId,
          requestId
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`[${requestId}] Error en intento ${attempt + 1}:`, error);
        
        if (attempt < retryConfig.maxRetries) {
          console.log(`[${requestId}] Reintentando en ${currentDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          
          // Aplicar backoff exponencial
          if (retryConfig.backoffMultiplier) {
            currentDelay *= retryConfig.backoffMultiplier;
          }
        }
      }
    }

    // Actualizar métricas de fallo
    this.updateMetrics(false, Date.now() - startTime);

    return {
      success: false,
      error: lastError?.message || 'Error desconocido en webhook',
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = new Date();
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Calcular tiempo promedio de respuesta
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }

  // Método para probar conectividad
  async testConnection(): Promise<WebhookResponse> {
    try {
      return await this.healthCheck();
    } catch (error) {
      console.warn('n8n connection test failed:', error);
      return {
        success: false,
        error: 'n8n service not available',
        statusCode: 0
      };
    }
  }

  // Health check específico
  async healthCheck(): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.healthCheck, {
      timestamp: new Date().toISOString(),
      source: 'ContaPYME-Frontend',
      version: configManager.getConfig().app.version
    }, { 
      priority: 'high',
      method: 'GET'
    });
  }

  // Webhook para health check de AFIP
  async afipHealthCheck(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-health-check', data, {
      priority: 'medium'
    });
  }

  // Webhook para validar punto de venta AFIP
  async validarPuntoVentaAfip(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-validar-punto-venta', data, {
      priority: 'high'
    });
  }

  // Webhook para obtener puntos de venta autorizados
  async obtenerPuntosVentaAfip(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-puntos-venta', data, {
      priority: 'medium'
    });
  }

  // Webhook para validar CAE
  async validarCAEAfip(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-validar-cae', data, {
      priority: 'high'
    });
  }

  // Webhook para emisión de facturas con validación
  async emitirFactura(data: any): Promise<WebhookResponse> {
    // Agregar credenciales del usuario a los datos
    const enrichedData = {
      ...data,
      // Credenciales del usuario
      afip_token: import.meta.env.VITE_AFIP_TOKEN,
      afip_sign: import.meta.env.VITE_AFIP_SIGN,
      afip_cuit: import.meta.env.VITE_AFIP_CUIT,
      supabase_url: import.meta.env.VITE_SUPABASE_URL,
      supabase_anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY
    };

    return this.makeRequest(this.config.endpoints.facturaEmision, enrichedData, {
      validate: true,
      schema: facturaSchema,
      priority: 'high'
    });
  }

  // Webhook para recepción de facturas
  async recibirFactura(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.facturaRecepcion, data);
  }

  // Órdenes de compra con validación
  async crearOrdenCompra(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.ordenCompra, data, {
      validate: true,
      schema: ordenCompraSchema,
      priority: 'high'
    });
  }

  // Registro de pagos con validación
  async registrarPago(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.pago, data, {
      validate: true,
      schema: pagoSchema,
      priority: 'high'
    });
  }

  async registrarPagoCompleto(pagoData: any): Promise<WebhookResponse> {
    // Validar datos requeridos
    const requiredFields = ['factura_id', 'numero_factura', 'tipo_factura', 'monto', 'metodo_pago', 'empresa_id'];
    const missingFields = requiredFields.filter(field => !pagoData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Campos faltantes: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    return this.makeRequest(this.config.endpoints.pago, pagoData, {
      validate: true,
      priority: 'high'
    });
  }

  async procesarAlertasStock(alertaData: any): Promise<WebhookResponse> {
    // Validar datos requeridos
    const requiredFields = ['empresa_id'];
    const missingFields = requiredFields.filter(field => !alertaData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Campos faltantes: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    return this.makeRequest(this.config.endpoints.stockAlerta, alertaData, {
      validate: true,
      priority: 'medium'
    });
  }

  // Webhook para descarga masiva de facturas
  async descargarFacturasMasivo(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/facturas-descarga-masiva', data, {
      priority: 'medium'
    });
  }

  // Webhook para envío de facturas por email
  async enviarFacturaPorEmail(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/facturas-enviar-email', data, {
      priority: 'medium'
    });
  }

  // Webhook para órdenes de recepción
  async registrarRecepcion(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.ordenRecepcion, data);
  }

  // ====== NUEVOS WEBHOOKS PARA STOCK ======

  // Webhook para nuevo producto creado
  async crearProducto(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/stock-producto-nuevo', data);
  }

  // Webhook para actualización de stock (ingreso/egreso)
  async actualizarStock(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.stockMovimiento, data);
  }

  async actualizarStockDesdeFactura(facturaData: any): Promise<WebhookResponse> {
    // Extraer productos de la factura para actualizar stock
    if (!facturaData.productos || facturaData.productos.length === 0) {
      return {
        success: true,
        data: { message: 'No hay productos para actualizar stock' },
        timestamp: new Date().toISOString()
      };
    }

    const stockData = {
      factura_id: facturaData.factura_id || facturaData.id,
      empresa_id: facturaData.empresa_id,
      productos: facturaData.productos.map((producto: any) => ({
        producto_id: producto.producto_id || producto.id,
        sku: producto.sku,
        cantidad_vendida: producto.cantidad || producto.cantidad_vendida
      }))
    };

    return this.makeRequest(this.config.endpoints.stockMovimiento, stockData, {
      validate: true,
      priority: 'high'
    });
  }

  // Webhook para ingreso de stock
  async registrarIngresoStock(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/stock-ingreso', data);
  }

  // Webhook para egreso de stock
  async registrarEgresoStock(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/stock-egreso', data);
  }

  // Webhook para egreso por venta (facturada/no facturada)
  async registrarEgresoVenta(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/stock-egreso-venta', data);
  }

  // ====== WEBHOOKS PARA RECETAS (RESTAURANTES/BARES) ======

  // Webhook para nueva receta creada
  async crearReceta(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.recetaCreacion, data);
  }

  // Webhook para venta de producto con receta
  async registrarVentaReceta(data: any): Promise<WebhookResponse> {
    return this.makeRequest(this.config.endpoints.recetaVenta, data);
  }

  // ====== NUEVOS WEBHOOKS PARA CRM ======

  // Webhook para crear cliente
  async crearCliente(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-cliente-crear', data);
  }

  // Webhook para actualizar cliente
  async actualizarCliente(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-cliente-actualizar', data);
  }

  // Webhook para importar clientes desde facturas
  async importarClientesFacturas(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-cliente-importar-facturas', data);
  }

  // Webhook para consultar CUIT en AFIP
  async consultarCuitAfip(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-consultar-cuit', data);
  }

  // ====== NUEVOS WEBHOOKS PARA VALIDACIÓN AFIP ======

  // Webhook para consultar último número de comprobante
  async consultarUltimoNumeroAfip(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-ultimo-numero', data, {
      priority: 'high'
    });
  }

  // Webhook para crear oportunidad
  async crearOportunidad(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-oportunidad-crear', data);
  }

  // Webhook para mover oportunidad entre etapas
  async moverOportunidadEtapa(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-oportunidad-mover-etapa', data);
  }

  // Webhook para ganar oportunidad (crear factura)
  async ganarOportunidad(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-oportunidad-ganar', data);
  }

  // Webhook para métricas del pipeline
  async obtenerMetricasPipeline(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-pipeline-metricas', data);
  }

  // Webhook para crear actividad
  async crearActividad(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-actividad-crear', data);
  }

  // Webhook para completar actividad
  async completarActividad(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-actividad-completar', data);
  }

  // Webhook para enviar recordatorio
  async enviarRecordatorio(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-recordatorio-enviar', data);
  }

  // Webhook para enviar WhatsApp
  async enviarWhatsApp(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/whatsapp-enviar-mensaje', data);
  }

  // Webhook para crear campaña
  async crearCampana(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-campana-crear', data);
  }

  // Webhook para enviar campaña
  async enviarCampana(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/crm-campana-enviar', data);
  }

  // Webhook para email masivo
  async enviarEmailMasivo(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/email-masivo-enviar', data);
  }

  // Webhook para WhatsApp masivo
  async enviarWhatsAppMasivo(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/whatsapp-masivo-enviar', data);
  }

  // ====== NUEVOS WEBHOOKS PARA ERP ======

  // Webhook para crear presupuesto
  async crearPresupuesto(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-presupuesto-crear', data);
  }

  // Webhook para actualizar presupuesto vs real
  async actualizarPresupuesto(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-presupuesto-actualizar', data);
  }

  // Webhook para crear proyección cash flow
  async crearCashFlow(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-cash-flow-crear', data);
  }

  // Webhook para actualizar cash flow realizado
  async actualizarCashFlow(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-cash-flow-actualizar', data);
  }

  // Webhook para crear empleado
  async crearEmpleado(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-empleado-crear', data);
  }

  // Webhook para registrar asistencia
  async registrarAsistencia(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-asistencia-registrar', data);
  }

  // Webhook para calcular liquidación
  async calcularLiquidacion(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-liquidacion-calcular', data);
  }

  // Webhook para crear proyecto
  async crearProyecto(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-proyecto-crear', data);
  }

  // Webhook para registrar tiempo trabajado
  async registrarTiempo(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-tiempo-registrar', data);
  }

  // Webhook para facturar proyecto
  async facturarProyecto(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-proyecto-facturar', data);
  }

  // Webhook para reportes financieros
  async generarReporteFinanciero(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/erp-reporte-financiero', data);
  }

  // Webhook para conciliación bancaria
  async conciliacionBancaria(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/banco-conciliacion', data);
  }

  // Webhook para integración AFIP empleados
  async integrarAfipEmpleados(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/afip-empleados-integrar', data);
  }

  // ====== NUEVOS WEBHOOKS PARA MONITOREO ======

  // Webhook para registrar métrica de workflow
  async logWorkflowMetric(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/monitoring-workflow-metric', data, {
      priority: 'low'
    });
  }

  // Webhook para registrar error detallado
  async logDetailedError(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/monitoring-error-log', data, {
      priority: 'medium'
    });
  }

  // Webhook para actualizar estado de integración
  async updateIntegrationStatus(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/monitoring-integration-status', data, {
      priority: 'medium'
    });
  }

  // Webhook para obtener métricas del sistema
  async getSystemMetrics(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/monitoring-system-metrics', data, {
      priority: 'low'
    });
  }

  // Webhook para configurar alertas
  async configureAlert(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/monitoring-configure-alert', data, {
      priority: 'low'
    });
  }

  // Webhook para enviar alerta
  async sendAlert(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/monitoring-send-alert', data, {
      priority: 'high'
    });
  }

  // Webhook para importación masiva de productos
  async importarProductosMasivo(data: any): Promise<WebhookResponse> {
    return this.makeRequest('/webhook/productos-importacion-masiva', data, {
      priority: 'low'
    });
  }

  // Obtener endpoints configurados
  getEndpoints(): WebhookEndpoints {
    return { ...this.config.endpoints };
  }

  // Actualizar un endpoint específico
  updateEndpoint(key: keyof WebhookEndpoints, endpoint: string): void {
    this.config.endpoints[key] = endpoint;
    
    // Guardar en localStorage
    const currentConfig = localStorage.getItem('webhook-endpoints');
    const config = currentConfig ? JSON.parse(currentConfig) : { endpoints: this.getDefaultEndpoints() };
    config.endpoints = this.config.endpoints;
    localStorage.setItem('webhook-endpoints', JSON.stringify(config));
  }

  // Obtener métricas del servicio
  getMetrics(): RequestMetrics {
    return { ...this.metrics };
  }

  // Obtener estado de salud del servicio
  getHealthStatus(): {
    isHealthy: boolean;
    successRate: number;
    averageResponseTime: number;
    lastRequestTime: Date | null;
  } {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;
      
    return {
      isHealthy: successRate >= 80 && this.metrics.averageResponseTime < 5000,
      successRate,
      averageResponseTime: this.metrics.averageResponseTime,
      lastRequestTime: this.metrics.lastRequestTime
    };
  }

  // Resetear métricas
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null
    };
  }

  // Obtener configuración actual
  getConfig(): WebhookConfig {
    return { ...this.config };
  }

  // Configurar rate limiting
  setRateLimiting(enabled: boolean, requestsPerMinute?: number, burstLimit?: number): void {
    this.config.rateLimiting.enabled = enabled;
    if (requestsPerMinute) this.config.rateLimiting.requestsPerMinute = requestsPerMinute;
    if (burstLimit) this.config.rateLimiting.burstLimit = burstLimit;
  }
}

export const webhookService = new WebhookService();
export default webhookService;
export { WebhookService };