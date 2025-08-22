
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ChefHat, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRecetas, useProductos } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import { useAuth } from '@/contexts/AuthContext';
import RecetasForm from '@/components/RecetasForm';

interface VentaReceta {
  id: string;
  id_producto_venta_final: string;
  nombre_receta: string;
  cantidad_vendida: number;
  tipo_egreso: string;
  fecha_venta: string;
  ingredientes_consumidos: Array<{
    sku: string;
    nombre: string;
    cantidad_consumida: number;
    unidad_medida: string;
    stock_anterior: number;
    stock_nuevo: number;
  }>;
  total_venta: number;
  cliente?: string;
  numero_factura?: string;
}

const Recetas = () => {
  const { user } = useAuth();
  const { data: recetas, loading: loadingRecetas } = useRecetas();
  const { data: productos, loading: loadingProductos } = useProductos();
  const [ventasRecetas, setVentasRecetas] = useState<VentaReceta[]>([]);
  const [activeTab, setActiveTab] = useState('recetas');

  // Estados para venta de receta
  const [ventaReceta, setVentaReceta] = useState({
    id_producto_venta_final: '',
    cantidad_vendida: 1,
    tipo_egreso: 'venta_facturada',
    cliente: '',
    numero_factura: ''
  });

  // Función para verificar disponibilidad de receta
  const verificarDisponibilidad = (receta: any) => {
    if (!receta.ingredientes || receta.ingredientes.length === 0) return false;
    
    return receta.ingredientes.every((ing: any) => {
      const producto = productos.find(p => p.id === ing.producto_id);
      return producto && producto.stock_actual >= ing.cantidad_requerida;
    });
  };

  // Función para procesar venta de receta
  const handleVentaReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ventaReceta.id_producto_venta_final || !ventaReceta.cantidad_vendida) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    const receta = recetas.find(r => r.id_producto_venta_final === ventaReceta.id_producto_venta_final);
    if (!receta) {
      toast.error('Receta no encontrada');
      return;
    }

    // Verificar stock disponible para todos los ingredientes
    const stockInsuficiente = receta.ingredientes?.some((ing: any) => {
      const producto = productos.find(p => p.id === ing.producto_id);
      if (!producto) return true;
      const stockRequerido = ing.cantidad_requerida * ventaReceta.cantidad_vendida;
      return producto.stock_actual < stockRequerido;
    });

    if (stockInsuficiente) {
      toast.error('Stock insuficiente para uno o más ingredientes');
      return;
    }

    try {
      // Calcular ingredientes consumidos
      const ingredientesConsumidos = receta.ingredientes?.map((ing: any) => {
        const producto = productos.find(p => p.id === ing.producto_id);
        if (!producto) return null;
        
        const cantidadConsumida = ing.cantidad_requerida * ventaReceta.cantidad_vendida;
        const stockAnterior = producto.stock_actual;
        const stockNuevo = stockAnterior - cantidadConsumida;
        
        return {
          sku: producto.sku,
          nombre: producto.descripcion,
          cantidad_consumida: cantidadConsumida,
          unidad_medida: ing.unidad_medida,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo
        };
      }).filter(Boolean);

      const response = await webhookService.registrarVentaReceta({
        pyme_id: user?.empresa_id || 'current_pyme',
        id_producto_venta_final: ventaReceta.id_producto_venta_final,
        cantidad_vendida: ventaReceta.cantidad_vendida,
        tipo_egreso: ventaReceta.tipo_egreso as any,
        fecha_egreso: new Date().toISOString(),
        ingredientes_consumidos: ingredientesConsumidos,
        numero_factura: ventaReceta.numero_factura,
        cliente: ventaReceta.cliente
      });

      if (response.success) {
        toast.success('Venta de receta registrada exitosamente');
        
        // Crear registro de venta
        const nuevaVenta: VentaReceta = {
          id: Date.now().toString(),
          id_producto_venta_final: ventaReceta.id_producto_venta_final,
          nombre_receta: receta.nombre_receta,
          cantidad_vendida: ventaReceta.cantidad_vendida,
          tipo_egreso: ventaReceta.tipo_egreso,
          fecha_venta: new Date().toISOString(),
          ingredientes_consumidos: ingredientesConsumidos,
          total_venta: receta.precio_venta_sugerido * ventaReceta.cantidad_vendida,
          cliente: ventaReceta.cliente,
          numero_factura: ventaReceta.numero_factura
        };

        setVentasRecetas([nuevaVenta, ...ventasRecetas]);
        
        // Limpiar formulario
        setVentaReceta({
          id_producto_venta_final: '',
          cantidad_vendida: 1,
          tipo_egreso: 'venta_facturada',
          cliente: '',
          numero_factura: ''
        });
      } else {
        toast.error(response.error || 'Error al registrar venta');
      }
    } catch (error) {
      console.error('Error al registrar venta de receta:', error);
      toast.error('Error al registrar venta de receta');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Recetas</h1>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <ChefHat className="h-5 w-5 mr-2" />
          Módulo para Restaurantes y Bares
        </Badge>
      </div>

      {/* Resumen de Recetas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recetas</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recetas?.length || 0}</div>
            <p className="text-xs text-muted-foreground">recetas creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recetas Disponibles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recetas?.filter(r => verificarDisponibilidad(r)).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">con stock suficiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ventasRecetas.filter(v => 
                new Date(v.fecha_venta).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">recetas vendidas hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación del Día</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${ventasRecetas
                .filter(v => new Date(v.fecha_venta).toDateString() === new Date().toDateString())
                .reduce((total, v) => total + v.total_venta, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">ventas de recetas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recetas">Recetas</TabsTrigger>
          <TabsTrigger value="nueva-receta">Nueva Receta</TabsTrigger>
          <TabsTrigger value="venta">Venta</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="recetas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Recetas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecetas ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando recetas...</p>
                </div>
              ) : recetas?.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay recetas</h3>
                  <p className="text-muted-foreground">
                    Crea tu primera receta para comenzar a gestionar productos compuestos.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Producto</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ingredientes</TableHead>
                      <TableHead>Costo Total</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Disponibilidad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recetas.map((receta) => (
                      <TableRow key={receta.id}>
                        <TableCell className="font-medium">{receta.id_producto_venta_final}</TableCell>
                        <TableCell>{receta.nombre_receta}</TableCell>
                        <TableCell>{receta.ingredientes?.length || 0} ingredientes</TableCell>
                        <TableCell>${receta.costo_total?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>${receta.precio_venta_sugerido?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          {verificarDisponibilidad(receta) ? (
                            <Badge variant="default">Disponible</Badge>
                          ) : (
                            <Badge variant="destructive">Sin Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={receta.activa ? "default" : "secondary"}>
                            {receta.activa ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nueva-receta" className="space-y-4">
          <RecetasForm />
        </TabsContent>

        <TabsContent value="venta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Venta de Receta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVentaReceta} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="id_producto_venta_final_venta">Receta *</Label>
                    <Select value={ventaReceta.id_producto_venta_final} onValueChange={(value) => setVentaReceta({...ventaReceta, id_producto_venta_final: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar receta" />
                      </SelectTrigger>
                      <SelectContent>
                        {recetas?.map((receta) => (
                          <SelectItem key={receta.id} value={receta.id_producto_venta_final}>
                            {receta.nombre_receta} - ${receta.precio_venta_sugerido?.toFixed(2) || '0.00'}
                            {!verificarDisponibilidad(receta) && (
                              <Badge variant="destructive" className="ml-2">Sin Stock</Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cantidad_vendida">Cantidad *</Label>
                    <Input
                      id="cantidad_vendida"
                      type="number"
                      min="1"
                      value={ventaReceta.cantidad_vendida}
                      onChange={(e) => setVentaReceta({...ventaReceta, cantidad_vendida: parseInt(e.target.value) || 1})}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_egreso_venta">Tipo de Egreso *</Label>
                    <Select value={ventaReceta.tipo_egreso} onValueChange={(value) => setVentaReceta({...ventaReceta, tipo_egreso: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venta_facturada">Venta Facturada</SelectItem>
                        <SelectItem value="venta_no_facturada">Venta No Facturada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente_venta">Cliente</Label>
                    <Input
                      id="cliente_venta"
                      value={ventaReceta.cliente}
                      onChange={(e) => setVentaReceta({...ventaReceta, cliente: e.target.value})}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero_factura_venta">Número de Factura</Label>
                    <Input
                      id="numero_factura_venta"
                      value={ventaReceta.numero_factura}
                      onChange={(e) => setVentaReceta({...ventaReceta, numero_factura: e.target.value})}
                      placeholder="Número de factura"
                    />
                  </div>
                </div>

                {/* Mostrar detalles de la receta seleccionada */}
                {ventaReceta.id_producto_venta_final && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Detalles de la Receta:</h4>
                    {(() => {
                      const recetaSeleccionada = recetas?.find(r => r.id_producto_venta_final === ventaReceta.id_producto_venta_final);
                      if (!recetaSeleccionada) return null;
                      
                      return (
                        <div className="border rounded-lg p-4">
                          <p className="font-medium">{recetaSeleccionada.nombre_receta}</p>
                          <p className="text-sm text-muted-foreground mb-2">{recetaSeleccionada.descripcion}</p>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Ingredientes necesarios:</p>
                            {recetaSeleccionada.ingredientes?.map((ing: any, index: number) => {
                              const producto = productos?.find(p => p.id === ing.producto_id);
                              if (!producto) return null;
                              
                              const cantidadNecesaria = ing.cantidad_requerida * ventaReceta.cantidad_vendida;
                              const stockInsuficiente = producto.stock_actual < cantidadNecesaria;
                              
                              return (
                                <div key={index} className="text-sm flex justify-between">
                                  <span>{producto.descripcion}</span>
                                  <span>
                                    {cantidadNecesaria.toFixed(2)} {ing.unidad_medida}
                                    {stockInsuficiente && (
                                      <AlertCircle className="h-4 w-4 text-red-500 inline ml-1" />
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-2 text-right">
                            <p className="text-sm">Total: ${(recetaSeleccionada.precio_venta_sugerido * ventaReceta.cantidad_vendida).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Button type="submit" className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Registrar Venta
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              {ventasRecetas.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay ventas registradas</h3>
                  <p className="text-muted-foreground">
                    Las ventas de recetas aparecerán aquí una vez que las registres.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Receta</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasRecetas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>{new Date(venta.fecha_venta).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{venta.nombre_receta}</TableCell>
                        <TableCell>{venta.cantidad_vendida}</TableCell>
                        <TableCell>
                          <Badge variant={venta.tipo_egreso === 'venta_facturada' ? 'default' : 'secondary'}>
                            {venta.tipo_egreso === 'venta_facturada' ? 'Facturada' : 'No Facturada'}
                          </Badge>
                        </TableCell>
                        <TableCell>{venta.cliente || '-'}</TableCell>
                        <TableCell>${venta.total_venta.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Recetas;
