import { z } from 'zod';

// Esquemas de validación para datos argentinos
export const cuitSchema = z.string()
  .regex(/^\d{11}$/, 'CUIT debe tener 11 dígitos')
  .refine((cuit) => {
    // Validación de dígito verificador CUIT
    const digits = cuit.split('').map(Number);
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * multipliers[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return checkDigit === digits[10];
  }, 'CUIT inválido');

// Esquema para validar emails
export const emailSchema = z.string()
  .email('Email inválido')
  .min(5, 'Email muy corto')
  .max(100, 'Email muy largo');

// Esquema para validar montos monetarios
export const montoSchema = z.number()
  .positive('El monto debe ser positivo')
  .max(999999999.99, 'Monto demasiado grande')
  .refine((val) => Number.isFinite(val), 'Monto inválido');

// Esquema para fechas
export const fechaSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Fecha inválida');

export const facturaSchema = z.object({
  pyme_id: z.string().min(1, 'ID de PYME requerido'),
  cuit_cliente: cuitSchema,
  tipo_comprobante: z.enum(['Factura A', 'Factura B', 'Factura C']),
  punto_venta: z.string().regex(/^\d{4}$/, 'Punto de venta debe tener 4 dígitos'),
  subtotal: montoSchema,
  condicion_iva: z.string().min(1, 'Condición IVA es requerida'),
  porcentaje_iva: z.number().min(0).max(100),
  monto_iva: z.number().min(0, 'Monto IVA no puede ser negativo'),
  total: montoSchema,
  descripcion: z.string().min(1, 'Descripción es requerida'),
  fecha: fechaSchema
}).refine((data) => {
  // Validar que el total sea igual a subtotal + IVA
  const calculatedTotal = data.subtotal + data.monto_iva;
  return Math.abs(data.total - calculatedTotal) < 0.01;
}, {
  message: 'El total debe ser igual a subtotal + IVA',
  path: ['total']
});

export const ordenCompraSchema = z.object({
  pyme_id: z.string().min(1, 'ID de PYME requerido'),
  cuit_proveedor: cuitSchema,
  proveedor_nombre: z.string().min(1, 'Nombre del proveedor es requerido'),
  productos: z.array(z.object({
    id: z.string(),
    nombre: z.string().min(1, 'Nombre del producto es requerido'),
    cantidad: z.number().positive('Cantidad debe ser positiva'),
    precio: montoSchema
  })).min(1, 'Debe incluir al menos un producto'),
  total: montoSchema
}).refine((data) => {
  // Validar que el total coincida con la suma de productos
  const calculatedTotal = data.productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  return Math.abs(data.total - calculatedTotal) < 0.01;
}, {
  message: 'El total debe coincidir con la suma de productos',
  path: ['total']
});

export const pagoSchema = z.object({
  pyme_id: z.string().min(1, 'ID de PYME requerido'),
  factura_id: z.string().min(1, 'ID de factura es requerido'),
  tipo_factura: z.enum(['emitida', 'recibida']),
  monto: montoSchema,
  metodo: z.enum(['Mercado Pago', 'Transferencia', 'Efectivo', 'Cheque', 'Tarjeta']),
  transaccion_id: z.string().optional(),
  notas: z.string().optional(),
  fecha: fechaSchema
});

export const productoSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido').max(50, 'SKU muy largo'),
  descripcion: z.string().min(1, 'Descripción es requerida').max(200, 'Descripción muy larga'),
  unidad_medida: z.string().min(1, 'Unidad de medida es requerida'),
  precio_costo: z.number().min(0, 'Precio de costo no puede ser negativo').optional(),
  precio_venta_sugerido: z.number().min(0, 'Precio de venta no puede ser negativo').optional(),
  stock_inicial: z.number().int().min(0, 'Stock inicial no puede ser negativo'),
  categoria: z.string().optional(),
  proveedor_principal: z.string().optional(),
  ubicacion: z.string().optional(),
  stock_minimo: z.number().int().min(0, 'Stock mínimo no puede ser negativo').optional()
});

// Esquema para movimientos de stock
export const movimientoStockSchema = z.object({
  pyme_id: z.string().min(1, 'ID de PYME requerido'),
  sku: z.string().min(1, 'SKU es requerido'),
  cantidad_movimiento: z.number().int().refine(val => val !== 0, 'Cantidad no puede ser cero'),
  stock_nuevo: z.number().int().min(0, 'Stock nuevo no puede ser negativo'),
  tipo_movimiento: z.enum(['ingreso', 'egreso']),
  tipo_egreso: z.enum([
    'venta_facturada', 
    'venta_no_facturada', 
    'muestra_promocion', 
    'ajuste_inventario', 
    'devolucion_proveedor'
  ]).optional(),
  fecha_movimiento: fechaSchema,
  observaciones: z.string().optional()
}).refine((data) => {
  // Si es egreso, debe tener tipo_egreso
  if (data.tipo_movimiento === 'egreso' && !data.tipo_egreso) {
    return false;
  }
  return true;
}, {
  message: 'Los egresos deben especificar el tipo de egreso',
  path: ['tipo_egreso']
});

// Esquema para recetas
export const recetaSchema = z.object({
  pyme_id: z.string().min(1, 'ID de PYME requerido'),
  id_producto_venta_final: z.string().min(1, 'ID de producto final requerido'),
  nombre_receta: z.string().min(1, 'Nombre de receta requerido').max(100, 'Nombre muy largo'),
  descripcion: z.string().optional(),
  ingredientes: z.array(z.object({
    sku_ingrediente: z.string().min(1, 'SKU de ingrediente requerido'),
    cantidad_requerida: z.number().positive('Cantidad debe ser positiva'),
    unidad_medida: z.string().min(1, 'Unidad de medida requerida')
  })).min(1, 'Debe incluir al menos un ingrediente'),
  fecha_creacion: fechaSchema
});

// Esquema para venta de recetas
export const ventaRecetaSchema = z.object({
  pyme_id: z.string().min(1, 'ID de PYME requerido'),
  id_producto_venta_final: z.string().min(1, 'ID de producto final requerido'),
  cantidad_vendida: z.number().int().positive('Cantidad vendida debe ser positiva'),
  tipo_egreso: z.enum(['venta_facturada', 'venta_no_facturada']),
  fecha_egreso: fechaSchema,
  ingredientes_consumidos: z.array(z.object({
    sku: z.string().min(1, 'SKU requerido'),
    cantidad_consumida: z.number().positive('Cantidad consumida debe ser positiva'),
    unidad_medida: z.string().min(1, 'Unidad de medida requerida'),
    stock_anterior: z.number().int().min(0, 'Stock anterior no puede ser negativo'),
    stock_nuevo: z.number().int().min(0, 'Stock nuevo no puede ser negativo')
  })),
  numero_factura: z.string().optional(),
  cliente: z.string().optional()
});

// Esquema para configuración de n8n
export const n8nConfigSchema = z.object({
  baseUrl: z.string().url('URL inválida'),
  authToken: z.string().optional(),
  timeout: z.number().int().min(1000).max(60000).optional(),
  retryAttempts: z.number().int().min(0).max(10).optional(),
  retryDelay: z.number().int().min(100).max(10000).optional()
});

// Función helper para validar datos
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Error de validación desconocido']
    };
  }
}

// Función para validar múltiples esquemas
export function validateMultiple<T>(
  validations: Array<{ schema: z.ZodSchema<any>; data: unknown; name: string }>
): {
  success: boolean;
  results: Array<{ name: string; success: boolean; data?: any; errors?: string[] }>;
  allErrors: string[];
} {
  const results = validations.map(({ schema, data, name }) => ({
    name,
    ...validateData(schema, data)
  }));
  
  const allErrors = results.flatMap(r => r.errors || []);
  const success = results.every(r => r.success);
  
  return {
    success,
    results,
    allErrors
  };
}

// Función para sanitizar datos de entrada
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres peligrosos
    .substring(0, 1000); // Limitar longitud
}

// Función para validar archivos
export function validateFile(
  file: File, 
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { 
    maxSize = 10 * 1024 * 1024, // 10MB por defecto
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
  } = options;
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `Archivo muy grande. Máximo ${(maxSize / 1024 / 1024).toFixed(1)}MB` 
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}` 
    };
  }
  
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `Extensión no permitida. Permitidas: ${allowedExtensions.join(', ')}` 
    };
  }
  
  return { valid: true };
}
// Validaciones específicas para Argentina
export const argentineValidations = {
  cuit: (cuit: string) => cuitSchema.safeParse(cuit),
  
  puntoVenta: (punto: string) => {
    return /^\d{4}$/.test(punto);
  },
  
  numeroFactura: (numero: string) => {
    return /^\d{4}-\d{8}$/.test(numero);
  },
  
  condicionIVA: (condicion: string) => {
    const validConditions = [
      'responsable_inscripto',
      'monotributista', 
      'exento',
      'no_responsable',
      'consumidor_final'
    ];
    return validConditions.includes(condicion);
  },
  
  // Validar CBU (Clave Bancaria Uniforme)
  cbu: (cbu: string) => {
    if (!/^\d{22}$/.test(cbu)) return false;
    
    // Validar dígitos verificadores
    const banco = cbu.substring(0, 8);
    const cuenta = cbu.substring(8, 22);
    
    // Validar primer dígito verificador (banco)
    const weights1 = [7, 1, 3, 9, 7, 1, 3];
    let sum1 = 0;
    for (let i = 0; i < 7; i++) {
      sum1 += parseInt(banco[i]) * weights1[i];
    }
    const dv1 = (10 - (sum1 % 10)) % 10;
    if (dv1 !== parseInt(banco[7])) return false;
    
    // Validar segundo dígito verificador (cuenta)
    const weights2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += parseInt(cuenta[i]) * weights2[i];
    }
    const dv2 = (10 - (sum2 % 10)) % 10;
    return dv2 === parseInt(cuenta[13]);
  },
  
  // Validar alias de CBU
  alias: (alias: string) => {
    return /^[a-zA-Z0-9.]{6,20}$/.test(alias);
  }
}