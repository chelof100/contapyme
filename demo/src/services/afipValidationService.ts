import { webhookService } from './webhookService';

export interface AFIPValidationResult {
  isValid: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface CUITValidationResult extends AFIPValidationResult {
  cuit: string;
  tipoPersona?: 'FISICA' | 'JURIDICA';
  nombre?: string;
  domicilio?: string;
  condicionIVA?: string;
}

export interface CAEValidationResult extends AFIPValidationResult {
  cae: string;
  fechaVencimiento?: string;
  puntoVenta?: string;
  tipoComprobante?: string;
}

export interface PuntoVentaResult extends AFIPValidationResult {
  puntoVenta: string;
  tipoComprobante: string;
  descripcion?: string;
  activo: boolean;
}

export interface UltimoNumeroResult extends AFIPValidationResult {
  ultimoNumero: number;
  puntoVenta: string;
  tipoComprobante: string;
}

class AFIPValidationService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCacheInternal(): void {
    this.cache.clear();
  }

  /**
   * Validar formato de CUIT
   */
  validateCUITFormat(cuit: string): boolean {
    // Remover guiones y espacios
    const cleanCuit = cuit.replace(/[-\s]/g, '');
    
    // Verificar longitud
    if (cleanCuit.length !== 11) {
      return false;
    }
    
    // Verificar que sean solo números
    if (!/^\d{11}$/.test(cleanCuit)) {
      return false;
    }
    
    // Validar dígito verificador
    const digits = cleanCuit.split('').map(Number);
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * multipliers[i];
    }
    
    const remainder = sum % 11;
    const expectedDigit = remainder === 0 ? 0 : 11 - remainder;
    
    return digits[10] === expectedDigit;
  }

  /**
   * Consultar CUIT en AFIP
   */
  async consultarCUIT(cuit: string): Promise<CUITValidationResult> {
    // Validar formato primero
    if (!this.validateCUITFormat(cuit)) {
      return {
        isValid: false,
        cuit,
        message: 'Formato de CUIT inválido',
        error: 'FORMATO_INVALIDO'
      };
    }

    // Verificar cache
    const cacheKey = `cuit_${cuit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await webhookService.consultarCuitAfip({
        cuit: cuit.replace(/[-\s]/g, ''),
        timestamp: new Date().toISOString()
      });

      if (response.success && response.data) {
        const result: CUITValidationResult = {
          isValid: true,
          cuit,
          message: 'CUIT válido',
          tipoPersona: response.data.tipo_persona,
          nombre: response.data.nombre,
          domicilio: response.data.domicilio,
          condicionIVA: response.data.condicion_iva,
          data: response.data
        };

        this.setCachedData(cacheKey, result);
        return result;
      } else {
        return {
          isValid: false,
          cuit,
          message: response.error || 'Error al consultar CUIT',
          error: 'CONSULTA_ERROR'
        };
      }
    } catch (error) {
      console.error('Error consultando CUIT:', error);
      return {
        isValid: false,
        cuit,
        message: 'Error de conexión con AFIP',
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Validar CAE
   */
  async validarCAE(cae: string, puntoVenta: string, tipoComprobante: string): Promise<CAEValidationResult> {
    const cacheKey = `cae_${cae}_${puntoVenta}_${tipoComprobante}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await webhookService.validarCAEAfip({
        cae,
        punto_venta: puntoVenta,
        tipo_comprobante: tipoComprobante,
        timestamp: new Date().toISOString()
      });

      if (response.success && response.data) {
        const result: CAEValidationResult = {
          isValid: true,
          cae,
          message: 'CAE válido',
          fechaVencimiento: response.data.fecha_vencimiento,
          puntoVenta: response.data.punto_venta,
          tipoComprobante: response.data.tipo_comprobante,
          data: response.data
        };

        this.setCachedData(cacheKey, result);
        return result;
      } else {
        return {
          isValid: false,
          cae,
          message: response.error || 'CAE inválido',
          error: 'CAE_INVALIDO'
        };
      }
    } catch (error) {
      console.error('Error validando CAE:', error);
      return {
        isValid: false,
        cae,
        message: 'Error de conexión con AFIP',
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Obtener puntos de venta autorizados
   */
  async obtenerPuntosVenta(): Promise<PuntoVentaResult[]> {
    const cacheKey = 'puntos_venta';
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await webhookService.obtenerPuntosVentaAfip({
        timestamp: new Date().toISOString()
      });

      if (response.success && response.data) {
        const puntosVenta: PuntoVentaResult[] = response.data.puntos_venta.map((pv: any) => ({
          isValid: true,
          puntoVenta: pv.punto_venta,
          tipoComprobante: pv.tipo_comprobante,
          descripcion: pv.descripcion,
          activo: pv.activo,
          message: 'Punto de venta válido',
          data: pv
        }));

        this.setCachedData(cacheKey, puntosVenta);
        return puntosVenta;
      } else {
        toast.error('Error al obtener puntos de venta');
        return [];
      }
    } catch (error) {
      console.error('Error obteniendo puntos de venta:', error);
      toast.error('Error de conexión con AFIP');
      return [];
    }
  }

  /**
   * Consultar último número de comprobante
   */
  async consultarUltimoNumero(puntoVenta: string, tipoComprobante: string): Promise<UltimoNumeroResult> {
    const cacheKey = `ultimo_numero_${puntoVenta}_${tipoComprobante}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await webhookService.consultarUltimoNumeroAfip({
        punto_venta: puntoVenta,
        tipo_comprobante: tipoComprobante,
        timestamp: new Date().toISOString()
      });

      if (response.success && response.data) {
        const result: UltimoNumeroResult = {
          isValid: true,
          ultimoNumero: response.data.ultimo_numero,
          puntoVenta: response.data.punto_venta,
          tipoComprobante: response.data.tipo_comprobante,
          message: 'Último número obtenido correctamente',
          data: response.data
        };

        this.setCachedData(cacheKey, result);
        return result;
      } else {
        return {
          isValid: false,
          ultimoNumero: 0,
          puntoVenta,
          tipoComprobante,
          message: response.error || 'Error al consultar último número',
          error: 'CONSULTA_ERROR'
        };
      }
    } catch (error) {
      console.error('Error consultando último número:', error);
      return {
        isValid: false,
        ultimoNumero: 0,
        puntoVenta,
        tipoComprobante,
        message: 'Error de conexión con AFIP',
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Validar punto de venta
   */
  async validarPuntoVenta(puntoVenta: string, tipoComprobante: string): Promise<AFIPValidationResult> {
    try {
      const response = await webhookService.validarPuntoVentaAfip({
        punto_venta: puntoVenta,
        tipo_comprobante: tipoComprobante,
        timestamp: new Date().toISOString()
      });

      if (response.success && response.data) {
        return {
          isValid: true,
          message: 'Punto de venta válido',
          data: response.data
        };
      } else {
        return {
          isValid: false,
          message: response.error || 'Punto de venta inválido',
          error: 'PUNTO_VENTA_INVALIDO'
        };
      }
    } catch (error) {
      console.error('Error validando punto de venta:', error);
      return {
        isValid: false,
        message: 'Error de conexión con AFIP',
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Health check de AFIP
   */
  async healthCheck(): Promise<AFIPValidationResult> {
    try {
      const response = await webhookService.afipHealthCheck({
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        return {
          isValid: true,
          message: 'Conexión con AFIP establecida',
          data: response.data
        };
      } else {
        return {
          isValid: false,
          message: response.error || 'Error de conexión con AFIP',
          error: 'HEALTH_CHECK_FAILED'
        };
      }
    } catch (error) {
      console.error('Error en health check AFIP:', error);
      return {
        isValid: false,
        message: 'Error de conexión con AFIP',
        error: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Generar próximo número de factura
   */
  async generarProximoNumero(puntoVenta: string, tipoComprobante: string): Promise<number> {
    try {
      const ultimoNumero = await this.consultarUltimoNumero(puntoVenta, tipoComprobante);
      
      if (ultimoNumero.isValid) {
        return ultimoNumero.ultimoNumero + 1;
      } else {
        throw new Error(ultimoNumero.message);
      }
    } catch (error) {
      console.error('Error generando próximo número:', error);
      throw error;
    }
  }

  /**
   * Validar datos completos de factura
   */
  async validarDatosFactura(datos: {
    cuitCliente: string;
    puntoVenta: string;
    tipoComprobante: string;
    cae?: string;
  }): Promise<{
    cuitValido: boolean;
    puntoVentaValido: boolean;
    caeValido?: boolean;
    proximoNumero?: number;
    errores: string[];
  }> {
    const errores: string[] = [];
    let cuitValido = false;
    let puntoVentaValido = false;
    let caeValido: boolean | undefined;
    let proximoNumero: number | undefined;

    try {
      // Validar CUIT
      const cuitResult = await this.consultarCUIT(datos.cuitCliente);
      cuitValido = cuitResult.isValid;
      if (!cuitValido) {
        errores.push(`CUIT inválido: ${cuitResult.message}`);
      }

      // Validar punto de venta
      const pvResult = await this.validarPuntoVenta(datos.puntoVenta, datos.tipoComprobante);
      puntoVentaValido = pvResult.isValid;
      if (!puntoVentaValido) {
        errores.push(`Punto de venta inválido: ${pvResult.message}`);
      }

      // Validar CAE si se proporciona
      if (datos.cae) {
        const caeResult = await this.validarCAE(datos.cae, datos.puntoVenta, datos.tipoComprobante);
        caeValido = caeResult.isValid;
        if (!caeValido) {
          errores.push(`CAE inválido: ${caeResult.message}`);
        }
      }

      // Obtener próximo número si todo está válido
      if (cuitValido && puntoVentaValido) {
        try {
          proximoNumero = await this.generarProximoNumero(datos.puntoVenta, datos.tipoComprobante);
        } catch (error) {
          errores.push('Error al obtener próximo número de factura');
        }
      }

    } catch (error) {
      console.error('Error validando datos de factura:', error);
      errores.push('Error de conexión con AFIP');
    }

    return {
      cuitValido,
      puntoVentaValido,
      caeValido,
      proximoNumero,
      errores
    };
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache.clear();
    toast.success('Cache de AFIP limpiado');
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const afipValidationService = new AFIPValidationService();
export default afipValidationService;