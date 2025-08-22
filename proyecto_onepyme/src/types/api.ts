// Tipos para la API de n8n
export interface N8nWebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp?: string;
  executionId?: string;
  requestId?: string;
  workflowId?: string;
  processingTime?: number;
}

// Tipos base para todas las entidades
export interface BaseEntity {
  id?: string;
  pyme_id: string;
  created_at?: string;
  updated_at?: string;
}

// Metadatos para requests
export interface RequestMetadata {
  requestId: string;
  timestamp: string;
  source: string;
  version: string;
  attempt?: number;
  priority?: 'high' | 'medium' | 'low';
  userId?: string;
  sessionId?: string;
}

export interface N8nFacturaEmision {
  pyme_id: string;
  cuit_cliente: string;
  tipo_comprobante: 'Factura A' | 'Factura B' | 'Factura C';
  punto_venta: string;
  subtotal: number;
  condicion_iva: string;
  porcentaje_iva: number;
  monto_iva: number;
  total: number;
  descripcion: string;
  fecha: string;
  items?: Array<{
    codigo?: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  observaciones?: string;
  condiciones_pago?: string;
}

export interface N8nFacturaEmisionResponse {
  cae: string;
  numero_comprobante: string;
  fecha_vencimiento_cae: string;
  pdf_url?: string;
  qr_code?: string;
  barcode?: string;
  estado_afip?: string;
  observaciones_afip?: string;
}

export interface N8nOrdenCompra {
  pyme_id: string;
  cuit_proveedor: string;
  proveedor_nombre?: string;
  proveedor_email?: string;
  proveedor_telefono?: string;
  productos: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    descripcion?: string;
    unidad_medida?: string;
  }>;
  total: number;
  fecha_entrega_estimada?: string;
  condiciones_pago?: string;
  observaciones?: string;
  moneda?: 'ARS' | 'USD' | 'EUR';
}

export interface N8nOrdenCompraResponse {
  orden_id: string;
  numero_orden: string;
  estado: 'abierta' | 'cerrada' | 'cancelada';
  pdf_url?: string;
  fecha_estimada_entrega?: string;
  tracking_number?: string;
  proveedor_confirmacion?: boolean;
  fecha_confirmacion?: string;
}

export interface N8nPago {
  pyme_id: string;
  factura_id: string;
  tipo_factura: 'emitida' | 'recibida';
  monto: number;
  metodo: string;
  transaccion_id?: string;
  notas?: string;
  fecha: string;
  moneda?: 'ARS' | 'USD' | 'EUR';
  tipo_cambio?: number;
  comision?: number;
  impuestos?: number;
  monto_neto?: number;
}

export interface N8nPagoResponse {
  pago_id: string;
  estado: 'confirmado' | 'pendiente' | 'rechazado';
  comprobante_url?: string;
  fecha_procesamiento: string;
  referencia_externa?: string;
  codigo_autorizacion?: string;
  gateway_response?: any;
}

export interface N8nStockMovimiento {
  pyme_id: string;
  sku: string;
  cantidad_movimiento: number;
  stock_nuevo: number;
  tipo_movimiento: 'ingreso' | 'egreso';
  tipo_egreso?: 'venta_facturada' | 'venta_no_facturada' | 'muestra_promocion' | 'ajuste_inventario' | 'devolucion_proveedor';
  fecha_movimiento: string;
  observaciones?: string;
  costo_unitario?: number;
  lote?: string;
  fecha_vencimiento?: string;
  ubicacion?: string;
  responsable?: string;
}

export interface N8nStockResponse {
  movimiento_id: string;
  stock_actualizado: number;
  alertas_generadas?: Array<{
    tipo: 'stock_bajo' | 'stock_critico';
    mensaje: string;
    sku: string;
    stock_actual: number;
    stock_minimo: number;
  }>;
  costo_promedio?: number;
  valor_total_stock?: number;
}

// Tipos para recetas
export interface N8nReceta {
  pyme_id: string;
  id_producto_venta_final: string;
  nombre_receta: string;
  descripcion?: string;
  ingredientes: Array<{
    sku_ingrediente: string;
    cantidad_requerida: number;
    unidad_medida: string;
  }>;
  fecha_creacion: string;
  costo_estimado?: number;
  precio_venta_sugerido?: number;
  tiempo_preparacion?: number;
  categoria?: string;
}

export interface N8nRecetaResponse {
  receta_id: string;
  costo_total_calculado: number;
  margen_sugerido: number;
  precio_venta_sugerido: number;
  alertas_ingredientes?: Array<{
    sku: string;
    stock_insuficiente: boolean;
    stock_actual: number;
    cantidad_requerida: number;
  }>;
}

export interface N8nVentaReceta {
  pyme_id: string;
  id_producto_venta_final: string;
  cantidad_vendida: number;
  tipo_egreso: 'venta_facturada' | 'venta_no_facturada';
  fecha_egreso: string;
  ingredientes_consumidos: Array<{
    sku: string;
    cantidad_consumida: number;
    unidad_medida: string;
    stock_anterior: number;
    stock_nuevo: number;
  }>;
  numero_factura?: string;
  cliente?: string;
  precio_venta?: number;
  descuento?: number;
  mesa?: string;
  mozo?: string;
}

export interface N8nVentaRecetaResponse {
  venta_id: string;
  ingredientes_actualizados: Array<{
    sku: string;
    stock_anterior: number;
    stock_nuevo: number;
    movimiento_id: string;
  }>;
  costo_total: number;
  margen_obtenido: number;
  alertas_stock?: Array<{
    sku: string;
    mensaje: string;
  }>;
}

// Tipos para configuración de n8n
export interface N8nConfig {
  baseUrl: string;
  authToken?: string;
  timeout: number;
  retryConfig: {
    maxRetries: number;
    delay: number;
    backoffMultiplier: number;
  };
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  endpoints: {
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
  };
  features: {
    batchProcessing: boolean;
    realTimeSync: boolean;
    offlineSupport: boolean;
    encryption: boolean;
  };
}

// Tipos para errores de API
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  requestId?: string;
  stackTrace?: string;
  userMessage?: string;
}

// Tipos para respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  metadata?: {
    totalCount: number;
    filteredCount: number;
    processingTime: number;
  };
}

// Tipos para filtros de consulta
export interface QueryFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  tipo?: string;
  cliente?: string;
  proveedor?: string;
  categoria?: string;
  sku?: string;
  monto_min?: number;
  monto_max?: number;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Tipos para métricas y monitoreo
export interface SystemMetrics {
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    uptime: number;
  };
  database: {
    connectionPool: number;
    activeConnections: number;
    queryTime: number;
  };
  business: {
    facturas: {
      emitidas: number;
      recibidas: number;
      pendientes: number;
    };
    ordenes: {
      abiertas: number;
      cerradas: number;
    };
    stock: {
      productos: number;
      movimientos: number;
      alertas: number;
    };
  };
}

// Tipos para webhooks de n8n
export interface N8nWebhookConfig {
  url: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key';
    credentials?: any;
  };
  retries: number;
  timeout: number;
}

// Tipos para batch operations
export interface BatchOperation {
  id: string;
  type: 'factura' | 'orden' | 'pago' | 'stock' | 'receta';
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  scheduledFor?: string;
  completedAt?: string;
  error?: string;
  retries: number;
  maxRetries: number;
}

export interface BatchResponse {
  batch_id: string;
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  processing_time: number;
  results: Array<{
    operation_id: string;
    status: 'success' | 'error';
    data?: any;
    error?: string;
  }>;
}