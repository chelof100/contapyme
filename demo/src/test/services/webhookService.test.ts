import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService } from '@/services/webhookService';

// Mock de fetch
global.fetch = vi.fn();

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService('https://test-n8n.com');
    vi.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('debería retornar éxito cuando el servicio está disponible', async () => {
      const mockResponse = { success: true, message: 'Service healthy' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await webhookService.healthCheck();

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://test-n8n.com/webhook/health-check',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('debería manejar errores de red', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await webhookService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot read properties');
    }, 10000);

    it('debería manejar respuestas de error HTTP', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ 
          success: false, 
          error: 'Server error',
          statusCode: 500,
          timestamp: new Date().toISOString()
        }),
      } as Response);

      const result = await webhookService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    }, 10000);
  });

  describe('emitirFactura', () => {
    it('debería enviar datos de factura correctamente', async () => {
      const mockResponse = { 
        success: true, 
        data: { factura_id: 'test-123' },
        statusCode: 200,
        timestamp: new Date().toISOString()
      };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const facturaData = {
        pyme_id: 'test-empresa',
        cuit_cliente: '20409378472',
        tipo_comprobante: 'Factura A',
        punto_venta: '0001',
        subtotal: 1000,
        condicion_iva: 'Responsable Inscripto',
        porcentaje_iva: 21,
        monto_iva: 210,
        total: 1210,
        descripcion: 'Productos varios',
        fecha: '2024-01-15',
        email_cliente: 'cliente@test.com',
        nombre_cliente: 'Cliente Test',
      };

      const result = await webhookService.emitirFactura(facturaData);

      expect(result.success).toBe(true);
      expect(result.data?.factura_id).toBe('test-123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/webhook/factura-emision'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('debería validar datos requeridos', async () => {
      const invalidData = { pyme_id: 'test' }; // Faltan campos requeridos

      try {
        await webhookService.emitirFactura(invalidData);
        expect(true).toBe(false); // No debería llegar aquí
      } catch (error) {
        expect(error.message).toContain('Validation failed');
      }
    });
  });

  describe('actualizarStockDesdeFactura', () => {
    it('debería procesar actualización de stock correctamente', async () => {
      const mockResponse = { 
        success: true, 
        data: { productos_actualizados: 2 },
        statusCode: 200,
        timestamp: new Date().toISOString()
      };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const facturaData = {
        factura_id: 'test-123',
        empresa_id: 'test-empresa',
        productos: [
          { producto_id: 'prod-1', sku: 'SKU001', cantidad: 5 },
          { producto_id: 'prod-2', sku: 'SKU002', cantidad: 3 },
        ],
      };

      const result = await webhookService.actualizarStockDesdeFactura(facturaData);

      expect(result.success).toBe(true);
      expect(result.data?.productos_actualizados).toBe(2);
    });

    it('debería manejar facturas sin productos', async () => {
      const facturaData = {
        factura_id: 'test-123',
        empresa_id: 'test-empresa',
        productos: [],
      };

      const result = await webhookService.actualizarStockDesdeFactura(facturaData);

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('No hay productos');
    });
  });

  describe('procesarAlertasStock', () => {
    it('debería procesar alertas de stock correctamente', async () => {
      const mockResponse = { 
        success: true, 
        data: { alertas_generadas: 1 },
        statusCode: 200,
        timestamp: new Date().toISOString()
      };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const alertaData = {
        empresa_id: 'test-empresa',
        modo: 'automatico',
      };

      const result = await webhookService.procesarAlertasStock(alertaData);

      expect(result.success).toBe(true);
      expect(result.data?.alertas_generadas).toBe(1);
    });

    it('debería validar empresa_id requerido', async () => {
      const invalidData = { modo: 'automatico' }; // Falta empresa_id

      const result = await webhookService.procesarAlertasStock(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('empresa_id');
    });
  });

  describe('getHealthStatus', () => {
    it('debería retornar estado de salud del servicio', () => {
      const healthStatus = webhookService.getHealthStatus();

      expect(healthStatus).toHaveProperty('isHealthy');
      expect(healthStatus).toHaveProperty('successRate');
      expect(healthStatus).toHaveProperty('averageResponseTime');
      expect(healthStatus).toHaveProperty('lastRequestTime');
    });
  });
}); 
