import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, ShoppingCart, Eye, Download, Settings } from 'lucide-react';
import { useOrdenesCompra } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';

interface ProductoOrden {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

const OrdenesCompra = () => {
  const { user } = useAuth();
  const { data: ordenes, loading: loadingOrdenes, create: createOrden } = useOrdenesCompra();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    cuit_proveedor: '',
    proveedor_nombre: '',
    productos: [{ id: '1', nombre: '', cantidad: 1, precio: 0 }] as ProductoOrden[]
  });

  const validateCUIT = (cuit: string) => {
    const regex = /^\d{11}$/;
    return regex.test(cuit);
  };

  const agregarProducto = () => {
    const newId = (form.productos.length + 1).toString();
    setForm({
      ...form,
      productos: [...form.productos, { id: newId, nombre: '', cantidad: 1, precio: 0 }]
    });
  };

  const eliminarProducto = (id: string) => {
    if (form.productos.length > 1) {
      setForm({
        ...form,
        productos: form.productos.filter(p => p.id !== id)
      });
    }
  };

  const actualizarProducto = (id: string, campo: keyof ProductoOrden, valor: string | number) => {
    setForm({
      ...form,
      productos: form.productos.map(p => 
        p.id === id ? { ...p, [campo]: valor } : p
      )
    });
  };

  const calcularTotal = () => {
    return form.productos.reduce((total, p) => total + (p.cantidad * p.precio), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCUIT(form.cuit_proveedor)) {
      toast({
        title: "Error",
        description: "CUIT inválido. Debe tener 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    const productosValidos = form.productos.every(p => 
      p.nombre.trim() !== '' && p.cantidad > 0 && p.precio > 0
    );

    if (!productosValidos) {
      toast({
        title: "Error",
        description: "Todos los productos deben tener nombre, cantidad y precio válidos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generar número de orden automático
      const ultimaOrden = ordenes[0];
      const ultimoNumero = ultimaOrden ? 
        parseInt(ultimaOrden.numero_orden.split('-')[1]) : 0;
      const numeroOrden = `OC-${(ultimoNumero + 1).toString().padStart(3, '0')}`;
      
      const ordenData = {
        numero_orden: numeroOrden,
        cuit_proveedor: form.cuit_proveedor,
        proveedor_nombre: form.proveedor_nombre,
        fecha_orden: new Date().toISOString().split('T')[0],
        total: calcularTotal()
      };

      const nuevaOrden = await createOrden(ordenData);
      
      if (nuevaOrden) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.crearOrdenCompra({
            ...ordenData,
            orden_id: nuevaOrden.id,
            productos: form.productos
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n, pero orden guardada en Supabase:', webhookError);
        }

        toast({
          title: "¡Orden de compra creada exitosamente!",
          description: `${numeroOrden} - Total: $${calcularTotal().toLocaleString('es-AR')}`,
        });

        // Limpiar formulario
        setForm({
          cuit_proveedor: '',
          proveedor_nombre: '',
          productos: [{ id: '1', nombre: '', cantidad: 1, precio: 0 }]
        });
      }

    } catch (error) {
      console.error('Error al crear orden de compra:', error);
      toast({
        title: "Error",
        description: "Error al crear la orden de compra",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'abierta': 'default',
      'cerrada': 'secondary',
      'pendiente': 'destructive'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
        <p className="mt-2 text-gray-600">Gestiona las órdenes de compra a proveedores via n8n</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de creación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Nueva Orden de Compra
            </CardTitle>
            <CardDescription>
              Crea una nueva orden de compra para un proveedor via n8n
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos del proveedor */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Datos del Proveedor</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuit_proveedor">CUIT del Proveedor *</Label>
                    <Input
                      id="cuit_proveedor"
                      value={form.cuit_proveedor}
                      onChange={(e) => setForm({...form, cuit_proveedor: e.target.value})}
                      placeholder="30506070809"
                      maxLength={11}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proveedor_nombre">Nombre del Proveedor</Label>
                    <Input
                      id="proveedor_nombre"
                      value={form.proveedor_nombre}
                      onChange={(e) => setForm({...form, proveedor_nombre: e.target.value})}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Productos</h3>
                  <Button type="button" onClick={agregarProducto} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {form.productos.map((producto, index) => (
                    <div key={producto.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Producto {index + 1}</h4>
                        {form.productos.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => eliminarProducto(producto.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Nombre *</Label>
                          <Input
                            value={producto.nombre}
                            onChange={(e) => actualizarProducto(producto.id, 'nombre', e.target.value)}
                            placeholder="Nombre del producto"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={producto.cantidad}
                            onChange={(e) => actualizarProducto(producto.id, 'cantidad', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio Unitario *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={producto.precio}
                            onChange={(e) => actualizarProducto(producto.id, 'precio', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-600">
                        Subtotal: ${(producto.cantidad * producto.precio).toLocaleString('es-AR')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      Total: ${calcularTotal().toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Enviando a n8n...' : 'Crear Orden de Compra'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de órdenes */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes Recientes</CardTitle>
            <CardDescription>Últimas órdenes de compra creadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingOrdenes ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando órdenes...</p>
                </div>
              ) : ordenes.slice(0, 5).map((orden) => (
                <div key={orden.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{orden.numero_orden}</h4>
                      <p className="text-sm text-gray-600">{new Date(orden.fecha_orden).toLocaleDateString()}</p>
                    </div>
                    {getEstadoBadge(orden.estado)}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Proveedor:</span>
                      <span className="font-medium">{orden.proveedor_nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CUIT:</span>
                      <span className="font-mono">{orden.cuit_proveedor}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total:</span>
                      <span>${orden.total?.toLocaleString('es-AR') || '0'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla completa de órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Órdenes de Compra</CardTitle>
          <CardDescription>Historial completo de órdenes de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loadingOrdenes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando órdenes...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay órdenes de compra. Crea tu primera orden usando el formulario de arriba.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordenes.map((orden) => (
                      <TableRow key={orden.id}>
                        <TableCell className="font-mono font-medium">{orden.numero_orden}</TableCell>
                        <TableCell>{new Date(orden.fecha_orden).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{orden.proveedor_nombre}</TableCell>
                        <TableCell className="font-mono text-sm">{orden.cuit_proveedor}</TableCell>
                        <TableCell className="font-semibold">
                          ${orden.total?.toLocaleString('es-AR') || '0'}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(orden.estado)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdenesCompra;