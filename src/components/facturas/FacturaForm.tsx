import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Shield, Plus, Trash2, Package } from 'lucide-react';
import CalculadoraIVA from '../CalculadoraIVA';
import { afipValidationService, AFIPValidationResult } from '@/services/afipValidationService';
import { useProductos } from '@/hooks/useSupabaseData';

interface ProductoVenta {
  sku: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descripcion?: string;
}

interface FacturaFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

const FacturaForm: React.FC<FacturaFormProps> = ({ onSubmit, loading }) => {
  const { data: productos } = useProductos();
  
  const [formData, setFormData] = useState({
    cuit_cliente: '',
    tipo_comprobante: '',
    punto_venta: '0001',
    numero_factura: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const [calculoIVA, setCalculoIVA] = useState({
    subtotal: 0,
    condicionIVA: '',
    porcentajeIVA: 0,
    montoIVA: 0,
    total: 0,
    manual: false
  });

  // Estados para productos
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    sku: '',
    cantidad: 1,
    precio_unitario: 0,
    descripcion: ''
  });

  const [afipValidation, setAfipValidation] = useState<AFIPValidationResult | null>(null);
  const [validatingAFIP, setValidatingAFIP] = useState(false);
  const [autoNumero, setAutoNumero] = useState(true);

  // Validar punto de venta cuando cambian los datos relevantes
  useEffect(() => {
    if (formData.cuit_cliente && formData.punto_venta && formData.tipo_comprobante) {
      validatePuntoVenta();
    }
  }, [formData.cuit_cliente, formData.punto_venta, formData.tipo_comprobante]);

  // Auto-generar número de factura
  useEffect(() => {
    if (autoNumero && afipValidation?.autorizado && afipValidation.siguienteNumero) {
      const numeroGenerado = `${formData.punto_venta}-${afipValidation.siguienteNumero.toString().padStart(8, '0')}`;
      setFormData(prev => ({ ...prev, numero_factura: numeroGenerado }));
    }
  }, [autoNumero, afipValidation, formData.punto_venta]);

  // Calcular subtotal y generar descripción automática cuando cambian los productos
  useEffect(() => {
    const subtotal = productosVenta.reduce((total, p) => total + p.subtotal, 0);
    
    // Generar descripción automática desde los productos
    const descripcionAutomatica = productosVenta.map(p => {
      const descripcionProducto = p.descripcion ? ` (${p.descripcion})` : '';
      return `${p.cantidad}x ${p.nombre}${descripcionProducto}`;
    }).join(', ');
    
    setCalculoIVA(prev => ({ 
      ...prev, 
      subtotal,
      // Calcular IVA automáticamente (21% por defecto)
      porcentajeIVA: 21,
      montoIVA: subtotal * 0.21,
      total: subtotal * 1.21
    }));
    
    // Actualizar descripción general automáticamente
    if (descripcionAutomatica) {
      setFormData(prev => ({ ...prev, descripcion: descripcionAutomatica }));
    }
  }, [productosVenta]);

  const validatePuntoVenta = async () => {
    if (!formData.cuit_cliente || !formData.punto_venta || !formData.tipo_comprobante) {
      return;
    }

    setValidatingAFIP(true);
    
    try {
      const result = await afipValidationService.validatePuntoVenta({
        cuit: formData.cuit_cliente,
        puntoVenta: formData.punto_venta,
        tipoComprobante: formData.tipo_comprobante as any
      });

      setAfipValidation(result);

      if (!result.autorizado) {
        toast.error('Punto de venta no autorizado', {
          description: `El punto ${formData.punto_venta} no está autorizado para ${formData.tipo_comprobante}`
        });
      } else if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning('Advertencia AFIP', { description: warning });
        });
      }

    } catch (error) {
      console.error('Error validating AFIP:', error);
      setAfipValidation({
        valid: false,
        autorizado: false,
        ultimoNumero: 0,
        siguienteNumero: 1,
        cacheValido: false,
        error: error instanceof Error ? error.message : 'Error de validación'
      });
      
      toast.error('Error validando con AFIP', {
        description: 'Continuando con numeración local'
      });
    } finally {
      setValidatingAFIP(false);
    }
  };

  // Funciones para manejar productos
  const agregarProducto = () => {
    if (!nuevoProducto.sku || nuevoProducto.cantidad <= 0 || nuevoProducto.precio_unitario <= 0) {
      toast.error('Complete todos los campos del producto');
      return;
    }

    const producto = productos.find(p => p.sku === nuevoProducto.sku);
    if (!producto) {
      toast.error('Producto no encontrado');
      return;
    }

    if (producto.stock_actual < nuevoProducto.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${producto.stock_actual}`);
      return;
    }

    const productoVenta: ProductoVenta = {
      sku: nuevoProducto.sku,
      nombre: producto.nombre,
      cantidad: nuevoProducto.cantidad,
      precio_unitario: nuevoProducto.precio_unitario,
      subtotal: nuevoProducto.cantidad * nuevoProducto.precio_unitario,
      descripcion: nuevoProducto.descripcion || undefined
    };

    setProductosVenta(prev => [...prev, productoVenta]);
    setNuevoProducto({ sku: '', cantidad: 1, precio_unitario: 0, descripcion: '' });
  };

  const eliminarProducto = (index: number) => {
    setProductosVenta(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.cuit_cliente || !formData.tipo_comprobante || !formData.numero_factura) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    if (calculoIVA.subtotal <= 0) {
      toast.error('El subtotal debe ser mayor a 0');
      return;
    }

    if (!calculoIVA.condicionIVA) {
      toast.error('Seleccione la condición IVA del cliente');
      return;
    }

    // Validar stock para todos los productos
    for (const productoVenta of productosVenta) {
      const producto = productos.find(p => p.sku === productoVenta.sku);
      if (!producto || producto.stock_actual < productoVenta.cantidad) {
        toast.error(`Stock insuficiente para ${productoVenta.sku}`);
        return;
      }
    }

    // Validar número de factura si AFIP está disponible
    if (afipValidation?.autorizado) {
      try {
        const numeroValidation = await afipValidationService.validateNumeroFactura(
          formData.cuit_cliente,
          formData.punto_venta,
          formData.tipo_comprobante,
          formData.numero_factura
        );

        if (!numeroValidation.valid) {
          toast.error('Número de factura inválido', {
            description: numeroValidation.errors.join(', ')
          });
          return;
        }

        if (numeroValidation.warnings.length > 0) {
          numeroValidation.warnings.forEach(warning => {
            toast.warning('Advertencia', { description: warning });
          });
        }
      } catch (error) {
        console.warn('Error validating invoice number:', error);
      }
    }

    // Preparar datos para envío
    const facturaData = {
      ...formData,
      ...calculoIVA,
      productos: productosVenta,
      afip_validation: afipValidation,
      metadata: {
        afip_autorizado: afipValidation?.autorizado || false,
        cache_usado: afipValidation?.metadata?.source === 'cache',
        tiempo_validacion: afipValidation?.tiempoRespuesta
      }
    };

    await onSubmit(facturaData);
  };

  const getValidationBadge = () => {
    if (validatingAFIP) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Validando...
        </Badge>
      );
    }

    if (!afipValidation) {
      return (
        <Badge variant="outline">
          Sin validar
        </Badge>
      );
    }

    if (afipValidation.autorizado) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Autorizado
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        No Autorizado
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Emitir Nueva Factura
          {getValidationBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validación AFIP Status */}
          {afipValidation && (
            <Alert className={afipValidation.autorizado ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Estado AFIP: {afipValidation.autorizado ? 'Autorizado' : 'No Autorizado'}
                    </span>
                    <div className="flex items-center gap-2">
                      {afipValidation.metadata?.source === 'cache' && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Cache
                        </Badge>
                      )}
                      {afipValidation.tiempoRespuesta && (
                        <span className="text-xs text-muted-foreground">
                          {afipValidation.tiempoRespuesta}ms
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {afipValidation.autorizado && (
                    <div className="text-sm">
                      <p>Último número: <strong>{afipValidation.ultimoNumero}</strong></p>
                      <p>Siguiente número: <strong>{afipValidation.siguienteNumero}</strong></p>
                    </div>
                  )}
                  
                  {afipValidation.error && (
                    <p className="text-sm text-red-600">Error: {afipValidation.error}</p>
                  )}
                  
                  {afipValidation.warnings && afipValidation.warnings.length > 0 && (
                    <div className="text-sm text-orange-600">
                      {afipValidation.warnings.map((warning, index) => (
                        <p key={index}>⚠️ {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Datos del Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit_cliente">CUIT del Cliente *</Label>
              <Input
                id="cuit_cliente"
                value={formData.cuit_cliente}
                onChange={(e) => setFormData({...formData, cuit_cliente: e.target.value})}
                placeholder="20304050607"
                maxLength={11}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo de Comprobante *</Label>
              <Select 
                value={formData.tipo_comprobante} 
                onValueChange={(value) => setFormData({...formData, tipo_comprobante: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Factura A">Factura A</SelectItem>
                  <SelectItem value="Factura B">Factura B</SelectItem>
                  <SelectItem value="Factura C">Factura C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Punto de Venta y Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="punto_venta">Punto de Venta</Label>
              <div className="flex gap-2">
                <Input
                  id="punto_venta"
                  value={formData.punto_venta}
                  onChange={(e) => setFormData({...formData, punto_venta: e.target.value})}
                  placeholder="0001"
                  maxLength={4}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => validatePuntoVenta()}
                  disabled={validatingAFIP}
                >
                  {validatingAFIP ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numero_factura">Número de Factura *</Label>
              <div className="flex gap-2">
                <Input
                  id="numero_factura"
                  value={formData.numero_factura}
                  onChange={(e) => {
                    setFormData({...formData, numero_factura: e.target.value});
                    setAutoNumero(false);
                  }}
                  placeholder="0001-00000001"
                  required
                  disabled={autoNumero}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoNumero(!autoNumero)}
                  className={autoNumero ? 'bg-blue-50' : ''}
                >
                  Auto
                </Button>
              </div>
              {autoNumero && (
                <p className="text-xs text-muted-foreground">
                  Número generado automáticamente desde AFIP
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              />
            </div>
          </div>

          <Separator />

          {/* Sección de Productos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <h3 className="text-lg font-medium">Productos</h3>
            </div>

            {/* Agregar Producto */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Select 
                    value={nuevoProducto.sku} 
                    onValueChange={(value) => setNuevoProducto({...nuevoProducto, sku: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map(producto => (
                        <SelectItem key={producto.sku} value={producto.sku}>
                          {producto.sku} - {producto.nombre} (Stock: {producto.stock_actual})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad *</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(e.target.value) || 1})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio Unitario *</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoProducto.precio_unitario}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, precio_unitario: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={agregarProducto}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
              
              {/* Campo de descripción del producto */}
              <div className="space-y-2">
                <Label htmlFor="descripcion_producto">Descripción del Producto (Opcional)</Label>
                <Textarea
                  id="descripcion_producto"
                  value={nuevoProducto.descripcion}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                  placeholder="Especificaciones, variantes, notas especiales..."
                  rows={2}
                />
              </div>
            </div>

            {/* Lista de Productos */}
            {productosVenta.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Productos en la Factura</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosVenta.map((producto, index) => (
                      <TableRow key={index}>
                        <TableCell>{producto.sku}</TableCell>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell>{producto.cantidad}</TableCell>
                        <TableCell>${producto.precio_unitario.toLocaleString('es-AR')}</TableCell>
                        <TableCell>${producto.subtotal.toLocaleString('es-AR')}</TableCell>
                        <TableCell>
                          {producto.descripcion ? (
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-600">{producto.descripcion}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarProducto(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <Separator />

          {/* Calculadora IVA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">Cálculo IVA</h3>
              {productosVenta.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Automático
                </Badge>
              )}
            </div>
            
            {productosVenta.length > 0 ? (
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subtotal:</span>
                    <span className="ml-2">${calculoIVA.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="font-medium">IVA (21%):</span>
                    <span className="ml-2">${calculoIVA.montoIVA.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Total:</span>
                    <span className="ml-2 font-bold">${calculoIVA.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">
                    💡 El IVA se calcula automáticamente al 21%. Puedes usar la calculadora manual si necesitas un porcentaje diferente.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCalculoIVA(prev => ({ ...prev, manual: true }))}
                  >
                    Cálculo Manual
                  </Button>
                </div>
              </div>
            ) : (
              <CalculadoraIVA onCalculoChange={setCalculoIVA} />
            )}
            
            {/* Mostrar calculadora manual si se activa */}
            {productosVenta.length > 0 && calculoIVA.manual && (
              <div className="mt-4">
                <CalculadoraIVA onCalculoChange={setCalculoIVA} />
              </div>
            )}
          </div>

          <Separator />

          {/* Descripción */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              {productosVenta.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Generada automáticamente
                </Badge>
              )}
            </div>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder={productosVenta.length > 0 ? "Descripción generada automáticamente desde los productos" : "Descripción de productos o servicios"}
              rows={3}
              className={productosVenta.length > 0 ? "bg-blue-50 border-blue-200" : ""}
            />
            {productosVenta.length > 0 && (
              <p className="text-xs text-muted-foreground">
                💡 La descripción se genera automáticamente desde los productos agregados. Puedes editarla si necesitas agregar información adicional.
              </p>
            )}
          </div>

          {/* Botón de envío */}
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || validatingAFIP || !afipValidation?.autorizado || productosVenta.length === 0} 
              className="flex-1"
            >
              {loading ? 'Emitiendo Factura...' : 'Emitir Factura'}
            </Button>
            
            {!afipValidation?.autorizado && formData.cuit_cliente && formData.punto_venta && formData.tipo_comprobante && (
              <Button
                type="button"
                variant="outline"
                onClick={() => validatePuntoVenta()}
                disabled={validatingAFIP}
              >
                <Shield className="h-4 w-4 mr-2" />
                Validar AFIP
              </Button>
            )}
          </div>

          {/* Información adicional */}
          {afipValidation && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                ✓ Validación AFIP: {afipValidation.metadata?.source === 'cache' ? 'Cache' : 'Tiempo real'}
              </p>
              {afipValidation.tiempoRespuesta && (
                <p>⏱️ Tiempo de respuesta: {afipValidation.tiempoRespuesta}ms</p>
              )}
              {afipValidation.metadata?.ambiente && (
                <p>🌐 Ambiente: {afipValidation.metadata.ambiente}</p>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default FacturaForm;