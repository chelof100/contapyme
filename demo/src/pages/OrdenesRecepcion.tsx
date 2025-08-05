import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Package, Eye, CheckCircle, Clock, Minus, Plus } from 'lucide-react';
import webhookService from '../services/webhookService';

interface ProductoRecibido {
  id: string;
  nombre: string;
  cantidad_ordenada: number;
  cantidad_recibida: number;
}

const OrdenesRecepcion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState('');
  
  const [productosRecibidos, setProductosRecibidos] = useState<ProductoRecibido[]>([]);

  // Datos simulados de órdenes abiertas
  const ordenesAbiertas = [
    {
      id: 'OC-001',
      proveedor: 'Proveedor SA',
      fecha: '2025-07-08',
      productos: [
        { id: 'P1', nombre: 'Producto A', cantidad: 10 },
        { id: 'P2', nombre: 'Producto B', cantidad: 5 },
        { id: 'P3', nombre: 'Producto C', cantidad: 20 }
      ]
    },
    {
      id: 'OC-002',
      proveedor: 'Servicios SRL',
      fecha: '2025-07-07',
      productos: [
        { id: 'P4', nombre: 'Servicio X', cantidad: 2 },
        { id: 'P5', nombre: 'Servicio Y', cantidad: 3 }
      ]
    },
    {
      id: 'OC-003',
      proveedor: 'Materiales LTDA',
      fecha: '2025-07-06',
      productos: [
        { id: 'P6', nombre: 'Material 1', cantidad: 15 },
        { id: 'P7', nombre: 'Material 2', cantidad: 8 },
        { id: 'P8', nombre: 'Material 3', cantidad: 12 },
        { id: 'P9', nombre: 'Material 4', cantidad: 25 },
        { id: 'P10', nombre: 'Material 5', cantidad: 6 }
      ]
    }
  ];

  // Datos simulados de recepciones
  const recepciones = [
    {
      id: 'REC-001',
      fecha: '2025-07-08',
      orden_compra: 'OC-004',
      proveedor: 'Electrónicos SA',
      productos_recibidos: 3,
      estado: 'Completa'
    },
    {
      id: 'REC-002',
      fecha: '2025-07-07',
      orden_compra: 'OC-005',
      proveedor: 'Oficina SRL',
      productos_recibidos: 2,
      estado: 'Parcial'
    },
    {
      id: 'REC-003',
      fecha: '2025-07-06',
      orden_compra: 'OC-006',
      proveedor: 'Limpieza LTDA',
      productos_recibidos: 4,
      estado: 'Completa'
    }
  ];

  const handleOrdenChange = (ordenId: string) => {
    setOrdenSeleccionada(ordenId);
    const orden = ordenesAbiertas.find(o => o.id === ordenId);
    
    if (orden) {
      setProductosRecibidos(orden.productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cantidad_ordenada: p.cantidad,
        cantidad_recibida: 0
      })));
    }
  };

  const actualizarCantidadRecibida = (id: string, cantidad: number) => {
    setProductosRecibidos(prev => 
      prev.map(p => 
        p.id === id ? { ...p, cantidad_recibida: Math.max(0, cantidad) } : p
      )
    );
  };

  const incrementarCantidad = (id: string) => {
    const producto = productosRecibidos.find(p => p.id === id);
    if (producto && producto.cantidad_recibida < producto.cantidad_ordenada) {
      actualizarCantidadRecibida(id, producto.cantidad_recibida + 1);
    }
  };

  const decrementarCantidad = (id: string) => {
    const producto = productosRecibidos.find(p => p.id === id);
    if (producto && producto.cantidad_recibida > 0) {
      actualizarCantidadRecibida(id, producto.cantidad_recibida - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ordenSeleccionada) {
      toast({
        title: "Error",
        description: "Selecciona una orden de compra.",
        variant: "destructive",
      });
      return;
    }

    const productosConRecepcion = productosRecibidos.filter(p => p.cantidad_recibida > 0);
    
    if (productosConRecepcion.length === 0) {
      toast({
        title: "Error",
        description: "Debes recibir al menos un producto.",
        variant: "destructive",
      });
      return;
    }

    const n8nUrl = localStorage.getItem('n8n-url');
    if (!n8nUrl) {
      toast({
        title: "Error",
        description: "Configura la URL de n8n en Configuración.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      webhookService.setBaseUrl(n8nUrl);

      const response = await webhookService.registrarRecepcion({
        pyme_id: user?.pyme_id || '',
        orden_compra_id: ordenSeleccionada,
        productos_recibidos: productosConRecepcion.map(p => ({
          id: p.id,
          nombre: p.nombre,
          cantidad_ordenada: p.cantidad_ordenada,
          cantidad_recibida: p.cantidad_recibida
        }))
      });

      if (response.success) {
        const totalRecibido = productosConRecepcion.reduce((sum, p) => sum + p.cantidad_recibida, 0);
        const totalOrdenado = productosRecibidos.reduce((sum, p) => sum + p.cantidad_ordenada, 0);
        const esCompleta = productosRecibidos.every(p => p.cantidad_recibida === p.cantidad_ordenada);

        toast({
          title: "¡Recepción registrada exitosamente!",
          description: `${totalRecibido} de ${totalOrdenado} productos recibidos. ${esCompleta ? 'Recepción completa.' : 'Recepción parcial.'}`,
        });

        // Limpiar formulario
        setOrdenSeleccionada('');
        setProductosRecibidos([]);
      } else {
        throw new Error(response.error);
      }

    } catch (error) {
      console.error('Error al registrar recepción:', error);
      toast({
        title: "Error",
        description: `Error al registrar la recepción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'Completa': 'default',
      'Parcial': 'secondary',
      'Pendiente': 'destructive'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  const calcularProgreso = (cantidad_recibida: number, cantidad_ordenada: number) => {
    return Math.round((cantidad_recibida / cantidad_ordenada) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Recepción</h1>
        <p className="mt-2 text-gray-600">Registra la recepción de productos via n8n</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Registrar Recepción
            </CardTitle>
            <CardDescription>
              Registra los productos recibidos de una orden de compra via n8n
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orden_compra">Orden de Compra *</Label>
                <Select onValueChange={handleOrdenChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar orden de compra" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordenesAbiertas.map((orden) => (
                      <SelectItem key={orden.id} value={orden.id}>
                        {orden.id} - {orden.proveedor} ({orden.productos.length} productos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {productosRecibidos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Productos a Recibir</h3>
                  <div className="space-y-3">
                    {productosRecibidos.map((producto) => (
                      <div key={producto.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{producto.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              Ordenado: {producto.cantidad_ordenada} unidades
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              producto.cantidad_recibida === producto.cantidad_ordenada 
                                ? 'text-green-600' 
                                : producto.cantidad_recibida > 0 
                                ? 'text-yellow-600' 
                                : 'text-gray-500'
                            }`}>
                              {calcularProgreso(producto.cantidad_recibida, producto.cantidad_ordenada)}% recibido
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Label className="text-sm">Cantidad recibida:</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => decrementarCantidad(producto.id)}
                              disabled={producto.cantidad_recibida === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={producto.cantidad_ordenada}
                              value={producto.cantidad_recibida}
                              onChange={(e) => actualizarCantidadRecibida(
                                producto.id, 
                                Math.min(producto.cantidad_ordenada, parseInt(e.target.value) || 0)
                              )}
                              className="w-20 text-center"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => incrementarCantidad(producto.id)}
                              disabled={producto.cantidad_recibida === producto.cantidad_ordenada}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-gray-500">
                            / {producto.cantidad_ordenada}
                          </span>
                        </div>

                        {/* Barra de progreso visual */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                producto.cantidad_recibida === producto.cantidad_ordenada 
                                  ? 'bg-green-500' 
                                  : producto.cantidad_recibida > 0 
                                  ? 'bg-yellow-500' 
                                  : 'bg-gray-300'
                              }`}
                              style={{ 
                                width: `${calcularProgreso(producto.cantidad_recibida, producto.cantidad_ordenada)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Total recibido:</span>
                      <span className="font-medium">
                        {productosRecibidos.reduce((sum, p) => sum + p.cantidad_recibida, 0)} de{' '}
                        {productosRecibidos.reduce((sum, p) => sum + p.cantidad_ordenada, 0)} productos
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || productosRecibidos.length === 0} 
                className="w-full"
              >
                {loading ? 'Enviando a n8n...' : 'Registrar Recepción'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes Pendientes de Recepción</CardTitle>
            <CardDescription>Órdenes de compra que esperan recepción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordenesAbiertas.map((orden) => (
                <div key={orden.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{orden.id}</h4>
                      <p className="text-sm text-gray-600">{orden.fecha}</p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Proveedor:</span>
                      <span className="font-medium">{orden.proveedor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productos:</span>
                      <span>{orden.productos.length} items</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => handleOrdenChange(orden.id)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Seleccionar para Recepción
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Recepciones</CardTitle>
          <CardDescription>Recepciones registradas anteriormente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recepción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Orden de Compra</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recepciones.map((recepcion) => (
                  <TableRow key={recepcion.id}>
                    <TableCell className="font-mono font-medium">{recepcion.id}</TableCell>
                    <TableCell>{recepcion.fecha}</TableCell>
                    <TableCell className="font-mono">{recepcion.orden_compra}</TableCell>
                    <TableCell className="font-medium">{recepcion.proveedor}</TableCell>
                    <TableCell>{recepcion.productos_recibidos} items</TableCell>
                    <TableCell>
                      {getEstadoBadge(recepcion.estado)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdenesRecepcion;
