import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { webhookService } from '@/services/webhookService';
import { toast } from 'sonner';
import { useProductos, useMovimientosStock } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';

interface ProductoVenta {
  sku: string;
  cantidad: number;
  precio_venta: number;
  descripcion: string;
}

interface VentaFacturada {
  numero_factura: string;
  fecha: string;
  cliente: string;
  productos: ProductoVenta[];
  total: number;
}

interface VentaFacturadaFormProps {
  productos: any[];
  onVentaProcesada: () => void;
}

export default function VentaFacturadaForm({ productos, onVentaProcesada }: VentaFacturadaFormProps) {
  const { user } = useAuth();
  const { update: updateProducto } = useProductos();
  const { create: createMovimiento } = useMovimientosStock();
  const [venta, setVenta] = useState<Omit<VentaFacturada, 'total'>>({
    numero_factura: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente: '',
    productos: []
  });

  const [productoTemp, setProductoTemp] = useState({
    sku: '',
    cantidad: 0,
    precio_venta: 0
  });

  const [processing, setProcessing] = useState(false);

  const agregarProducto = () => {
    if (!productoTemp.sku || productoTemp.cantidad <= 0 || productoTemp.precio_venta <= 0) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos del producto',
        variant: 'destructive'
      });
      return;
    }

    const producto = productos.find(p => p.sku === productoTemp.sku);
    if (!producto) {
      toast({
        title: 'Error',
        description: 'Producto no encontrado',
        variant: 'destructive'
      });
      return;
    }

    if (producto.stock_actual < productoTemp.cantidad) {
      toast({
        title: 'Stock Insuficiente',
        description: `Solo hay ${producto.stock_actual} unidades disponibles`,
        variant: 'destructive'
      });
      return;
    }

    const nuevosProductos: ProductoVenta[] = [...venta.productos, {
      sku: productoTemp.sku,
      cantidad: productoTemp.cantidad,
      precio_venta: productoTemp.precio_venta,
      descripcion: producto.descripcion
    }];

    setVenta({
      ...venta,
      productos: nuevosProductos
    });

    setProductoTemp({
      sku: '',
      cantidad: 0,
      precio_venta: 0
    });
  };

  const eliminarProducto = (index: number) => {
    const nuevosProductos = venta.productos.filter((_, i) => i !== index);
    setVenta({
      ...venta,
      productos: nuevosProductos
    });
  };

  const calcularTotal = () => {
    return venta.productos.reduce((total, p) => total + (p.cantidad * p.precio_venta), 0);
  };

  const procesarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venta.numero_factura || !venta.cliente || venta.productos.length === 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setProcessing(true);

    try {
      const ventaCompleta: VentaFacturada = {
        ...venta,
        total: calcularTotal()
      };

      // Validar stock disponible
      for (const productoVenta of venta.productos) {
        const producto = productos.find(p => p.sku === productoVenta.sku);
        if (!producto || producto.stock_actual < productoVenta.cantidad) {
          toast.error(`Stock insuficiente para ${productoVenta.sku}`);
          return;
        }
      }

      // Procesar cada producto vendido
      for (const productoVenta of venta.productos) {
        const producto = productos.find(p => p.sku === productoVenta.sku);
        if (producto) {
          const nuevoStock = producto.stock_actual - productoVenta.cantidad;
          
          // Actualizar stock en Supabase
          await updateProducto(producto.id, { stock_actual: nuevoStock });
          
          // Registrar movimiento
          await createMovimiento({
            producto_id: producto.id,
            sku: producto.sku,
            tipo_movimiento: 'egreso',
            cantidad: productoVenta.cantidad,
            stock_anterior: producto.stock_actual,
            stock_nuevo: nuevoStock,
            tipo_egreso: 'venta_facturada',
            referencia: venta.numero_factura,
            observaciones: `Venta facturada - Cliente: ${venta.cliente}`,
            usuario_id: user?.id
          });
        }
      }

      // Enviar a n8n para procesamiento adicional
      try {
        await webhookService.registrarEgresoVenta({
          numero_factura: venta.numero_factura,
          fecha_venta: venta.fecha,
          cliente: venta.cliente,
          productos: venta.productos,
          total: ventaCompleta.total
        });
      } catch (webhookError) {
        console.warn('Error enviando a n8n, pero venta procesada en Supabase:', webhookError);
      }

      toast.success(`Factura ${venta.numero_factura} procesada exitosamente. Stock actualizado automáticamente.`);

      // Limpiar formulario
      setVenta({
        numero_factura: '',
        fecha: new Date().toISOString().split('T')[0],
        cliente: '',
        productos: []
      });

      // Notificar al componente padre para actualizar datos
      onVentaProcesada();
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error al procesar la venta. Intente nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧾 Procesar Venta Facturada 
          <Badge variant="secondary">Automático</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Esta venta descuenta automáticamente el stock y envía webhooks a n8n
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={procesarVenta} className="space-y-4">
          {/* Datos de la factura */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numero_factura">Número de Factura *</Label>
              <Input
                id="numero_factura"
                value={venta.numero_factura}
                onChange={(e) => setVenta({...venta, numero_factura: e.target.value})}
                placeholder="0001-00000001"
                required
              />
            </div>
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={venta.fecha}
                onChange={(e) => setVenta({...venta, fecha: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                value={venta.cliente}
                onChange={(e) => setVenta({...venta, cliente: e.target.value})}
                placeholder="Nombre del cliente"
                required
              />
            </div>
          </div>

          {/* Agregar productos */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Agregar Productos</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="producto_sku">Producto</Label>
                <Select value={productoTemp.sku} onValueChange={(value) => {
                  const producto = productos.find(p => p.sku === value);
                  setProductoTemp({
                    ...productoTemp, 
                    sku: value,
                    precio_venta: producto?.precio_venta_sugerido || 0
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((producto) => (
                      <SelectItem key={producto.sku} value={producto.sku}>
                        {producto.descripcion} ({producto.sku}) - Stock: {producto.stock_actual}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  step="1"
                  value={productoTemp.cantidad}
                  onChange={(e) => setProductoTemp({...productoTemp, cantidad: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="precio_venta">Precio Unitario</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productoTemp.precio_venta}
                  onChange={(e) => setProductoTemp({...productoTemp, precio_venta: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={agregarProducto} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de productos agregados */}
          {venta.productos.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Productos en la Factura</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venta.productos.map((producto, index) => (
                    <TableRow key={index}>
                      <TableCell>{producto.sku}</TableCell>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>{producto.cantidad}</TableCell>
                      <TableCell>${producto.precio_venta.toFixed(2)}</TableCell>
                      <TableCell>${(producto.cantidad * producto.precio_venta).toFixed(2)}</TableCell>
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
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">Total:</TableCell>
                    <TableCell className="font-bold">${calcularTotal().toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <Button type="submit" disabled={processing || venta.productos.length === 0} className="w-full">
            {processing ? 'Procesando...' : 'Procesar Venta Facturada'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}