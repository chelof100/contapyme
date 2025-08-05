import { configManager } from '@/config/app';
import { errorHandler, ErrorType } from '@/utils/errorHandler';
import { validateData, facturaSchema, ordenCompraSchema, pagoSchema } from '@/utils/validation';
import { webhookService } from './webhookService';

export interface N8nEndpoints {
  facturaEmision: string;
  facturaRecepcion: string;
  ordenCompra: string;
  ordenRecepcion: string;
  pago: string;
  stockMovimiento: string;
  stockAlerta: string;
  recetaCreacion: string;
  recetaVenta: string;
  healthCheck: string;
  sync: string;
}

export interface N8nResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp?: string;
  executionId?: string;
  workflowId?: string;
}

export interface N8nBatchOperation {
  id: string;
  type: 'factura' | 'orden' | 'pago' | 'stock';
  data: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledFor?: Date;
}

class N8nService {
  private baseUrl: string;
  private apiKey?: string;
  private batchQueue: N8nBatchOperation[] = [];
  private isProcessingBatch = false;

  constructor() {
    const config = configManager.getConfig();
    this.baseUrl = config.api.n8n.baseUrl;
    this.apiKey = localStorage.getItem('n8n-api-key') || config.api.n8n.apiKey;
  }

  // Configuración dinámica
  public configure(baseUrl: string, apiKey?: string): void {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    
    if (apiKey) {
      localStorage.setItem('n8n-api-key', apiKey);
      webhookService.setApiKey(apiKey);
    }
    
    webhookService.setBaseUrl(baseUrl);
    configManager.updateN8nConfig({ baseUrl, apiKey });
  }

  // Verificar conectividad con n8n
  public async testConnection(): Promise<N8nResponse> {
    try {
      const response = await webhookService.testConnection();
      return {
        success: response.success,
        data: response.data,
        error: response.error,
        statusCode: response.statusCode,
        timestamp: response.timestamp,
        executionId: response.executionId
      };
    } catch (error) {
      console.warn('n8n connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión con n8n',
        statusCode: 0
      };
    }
  }


  // ===== MÉTODOS DE NEGOCIO =====

  // Emisión de facturas con validación
  public async emitirFactura(data: any): Promise<N8nResponse> {
    const response = await webhookService.emitirFactura(data);
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      statusCode: response.statusCode,
      timestamp: response.timestamp,
      executionId: response.executionId
    };
  }

  // Recepción de facturas
  public async recibirFactura(data: any): Promise<N8nResponse> {
    const response = await webhookService.recibirFactura(data);
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      statusCode: response.statusCode,
      timestamp: response.timestamp,
      executionId: response.executionId
    };
  }

  // Órdenes de compra con validación
  public async crearOrdenCompra(data: any): Promise<N8nResponse> {
    const response = await webhookService.crearOrdenCompra(data);
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      statusCode: response.statusCode,
      timestamp: response.timestamp,
      executionId: response.executionId
    };
  }

  // Registro de pagos con validación
  public async registrarPago(data: any): Promise<N8nResponse> {
    const response = await webhookService.registrarPago(data);
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      statusCode: response.statusCode,
      timestamp: response.timestamp,
      executionId: response.executionId
    };
  }

  // Movimientos de stock
  public async registrarMovimientoStock(data: any): Promise<N8nResponse> {
    const response = await webhookService.actualizarStock(data);
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      statusCode: response.statusCode,
      timestamp: response.timestamp,
      executionId: response.executionId
    };
  }

  // Alertas de stock
  public async enviarAlertaStock(data: any): Promise<N8nResponse> {
    const response = await webhookService.registrarEgresoStock(data);
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      statusCode: response.statusCode,
      timestamp: response.timestamp,
      executionId: response.executionId
    };
  }

  // ===== OPERACIONES BATCH =====

  public addToBatch(operation: Omit<N8nBatchOperation, 'id' | 'createdAt' | 'retryCount'>): void {
    const batchOperation: N8nBatchOperation = {
      ...operation,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      retryCount: 0
    };

    this.batchQueue.push(batchOperation);
    
    // Procesar automáticamente si no está en proceso
    if (!this.isProcessingBatch) {
      this.processBatchQueue();
    }
  }

  private async processBatchQueue(): Promise<void> {
    if (this.isProcessingBatch || this.batchQueue.length === 0) return;

    this.isProcessingBatch = true;

    try {
      // Ordenar por prioridad
      this.batchQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const operation = this.batchQueue.shift();
      if (!operation) return;

      await this.executeOperation(operation);

    } catch (error) {
      console.error('Error procesando batch operation:', error);
    } finally {
      this.isProcessingBatch = false;
      
      // Continuar con la siguiente operación
      if (this.batchQueue.length > 0) {
        setTimeout(() => this.processBatchQueue(), 1000);
      }
    }
  }

  private async executeOperation(operation: N8nBatchOperation): Promise<void> {
    switch (operation.type) {
      case 'factura':
        await this.emitirFactura(operation.data);
        break;
      case 'orden':
        await this.crearOrdenCompra(operation.data);
        break;
      case 'pago':
        await this.registrarPago(operation.data);
        break;
      case 'stock':
        await this.registrarMovimientoStock(operation.data);
        break;
      default:
        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
    }
  }

  // ===== UTILIDADES =====

  public getBatchQueueStatus(): {
    pending: number;
    processing: boolean;
    nextOperation?: N8nBatchOperation;
  } {
    return {
      pending: this.batchQueue.length,
      processing: this.isProcessingBatch,
      nextOperation: this.batchQueue[0]
    };
  }

  public clearBatchQueue(): void {
    this.batchQueue = [];
    this.isProcessingBatch = false;
  }

  public getConfig(): { baseUrl: string; hasAuth: boolean; endpoints: any } {
    return {
      baseUrl: this.baseUrl,
      hasAuth: !!this.apiKey,
      endpoints: webhookService.getEndpoints()
    };
  }
}

export const n8nService = new N8nService();
export default n8nService;