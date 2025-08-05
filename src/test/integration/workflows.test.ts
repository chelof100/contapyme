import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService } from '@/services/webhookService';

// Mock de fetch
global.fetch = vi.fn();

describe('Workflows Integration Tests', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService('https://test-n8n.com');
    vi.clearAllMocks();
  });

  describe('Flujo completo de facturación', () => {
    it('debería procesar una factura completa con stock y alertas', async () => {
      // Mock de respuestas para el flujo completo
      const mockResponses = [
        // 1. Emitir factura
        { success: true, data: { factura_id: 'fact-123', numero_factura: '0001-00000001' } },
        // 2. Actualizar stock
        { success: true, data: { productos_actualizados: 2, alertas_generadas: 1 } },
        // 3. Procesar alertas
        { success: true, data: { alertas_generadas: 1, email_enviado: true } },
      ];

      let responseIndex = 0;
      vi.mocked(fetch).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => mockResponses[responseIndex++],
        } as Response)
      );

      // 1. Emitir factura
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
        productos: [
          { producto_id: 'prod-1', sku: 'SKU001', cantidad: 5, precio: 100 },
          { producto_id: 'prod-2', sku: 'SKU002', cantidad: 3, precio: 166.67 },
        ],
      };

      const facturaResult = await webhookService.emitirFactura(facturaData);
      expect(facturaResult.success).toBe(true);
      expect(facturaResult.data?.factura_id).toBe('fact-123');

      // 2. Actualizar stock desde la factura
      const stockResult = await webhookService.actualizarStockDesdeFactura({
        ...facturaData,
        factura_id: facturaResult.data?.factura_id,
      }, 10000);
      expect(stockResult.success).toBe(true);
      expect(stockResult.data?.productos_actualizados).toBe(2);

      // 3. Procesar alertas de stock
      const alertasResult = await webhookService.procesarAlertasStock({
        empresa_id: facturaData.pyme_id,
        modo: 'automatico',
      }, 10000);
      expect(alertasResult.success).toBe(true);
      expect(alertasResult.data?.alertas_generadas).toBe(1);
      expect(alertasResult.data?.email_enviado).toBe(true);
    }, 10000);

    it('debería manejar errores en cualquier paso del flujo', async () => {
      // Mock de error en actualización de stock
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, factura_id: 'fact-123' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Stock service unavailable'));

      // 1. Emitir factura (éxito)
      const facturaResult = await webhookService.emitirFactura({
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
      }, 10000);
      expect(facturaResult.success).toBe(true);

      // 2. Actualizar stock (error)
      const stockResult = await webhookService.actualizarStockDesdeFactura({
        factura_id: facturaResult.data?.factura_id,
        empresa_id: 'test-empresa',
        productos: [{ producto_id: 'prod-1', sku: 'SKU001', cantidad: 5 }],
      }, 10000);
      expect(stockResult.success).toBe(false);
      expect(stockResult.error).toContain('Cannot read properties');
    }, 10000);
  });

  describe('Flujo de pagos', () => {
    it('debería procesar un pago completo', async () => {
      const mockResponse = { 
        success: true, 
        data: {
          pago_id: 'pago-123',
          factura_actualizada: true,
          notificacion_enviada: true 
        },
        statusCode: 200,
        timestamp: new Date().toISOString()
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const pagoData = {
        factura_id: 'fact-123',
        numero_factura: '0001-00000001',
        tipo_factura: 'emitida',
        monto: 1000,
        metodo_pago: 'transferencia',
        empresa_id: 'test-empresa',
      };

      const result = await webhookService.registrarPagoCompleto(pagoData);

      expect(result.success).toBe(true);
      expect(result.data?.pago_id).toBe('pago-123');
      expect(result.data?.factura_actualizada).toBe(true);
      expect(result.data?.notificacion_enviada).toBe(true);
    }, 10000);

    it('debería validar datos de pago requeridos', async () => {
      const invalidPagoData = {
        factura_id: 'fact-123',
        // Faltan campos requeridos
      };

      const result = await webhookService.registrarPagoCompleto(invalidPagoData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Campos faltantes');
    }, 10000);
  });

  describe('Monitoreo de salud del sistema', () => {
    it('debería verificar la salud de todos los servicios', async () => {
      const healthCheckResponse = { 
        success: true, 
        data: { services: ['n8n', 'supabase', 'afip'] },
        statusCode: 200,
        timestamp: new Date().toISOString()
      };
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => healthCheckResponse,
      } as Response);

      const result = await webhookService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.services).toBeDefined();
      expect(Array.isArray(result.data?.services)).toBe(true);
      expect(result.data?.services).toContain('n8n');
      expect(result.data?.services).toContain('supabase');
      expect(result.data?.services).toContain('afip');
    }, 10000);

    it('debería manejar servicios no disponibles', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ 
          success: false, 
          error: 'Service unavailable',
          statusCode: 503,
          timestamp: new Date().toISOString()
        }),
      } as Response);

      const result = await webhookService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    }, 10000);
  });

  describe('Métricas y analytics', () => {
    it('debería obtener métricas del sistema', async () => {
      const metricsResponse = {
        success: true,
        data: {
          total_facturas: 150,
          total_ventas: 50000,
          productos_bajo_stock: 3,
          alertas_activas: 2,
        },
        statusCode: 200,
        timestamp: new Date().toISOString()
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => metricsResponse,
      } as Response);

      const result = await webhookService.getSystemMetrics({ empresa_id: 'test-empresa' });

      expect(result.success).toBe(true);
      expect(result.data?.total_facturas).toBe(150);
      expect(result.data?.total_ventas).toBe(50000);
      expect(result.data?.productos_bajo_stock).toBe(3);
    }, 10000);
  });
}); 
