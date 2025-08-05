import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ShoppingCart, Bell, Settings, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { webhookService } from '@/services/webhookService';

interface AlertasStockProps {
  productos: any[];
  onUpdateProducto: (id: string, data: any) => Promise<any>;
}

const AlertasStock: React.FC<AlertasStockProps> = ({ productos, onUpdateProducto }) => {
  const [stockMinimo, setStockMinimo] = useState<number>(0);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);
  const [configurandoStock, setConfigurandoStock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calcular alertas de stock bajo
  const alertasStock = productos
    .filter(producto => 
      producto.stock_minimo && 
      producto.stock_actual < producto.stock_minimo
    )
    .map(producto => ({
      id: producto.id,
      producto_id: producto.id,
      sku: producto.sku,
      descripcion: producto.descripcion,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo!,
      diferencia: producto.stock_minimo! - producto.stock_actual,
      proveedor_principal: producto.proveedor_principal,
      precio_costo: producto.precio_costo,
      fecha_alerta: new Date().toISOString().split('T')[0]
    }));

  const productosConStockMinimo = productos.filter(p => p.stock_minimo);
  const productosStockCritico = alertasStock.length;

  const handleConfigurarStockMinimo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto');
      return;
    }

    if (stockMinimo <= 0) {
      toast.error('El stock mínimo debe ser mayor a 0');
      return;
    }

    setIsSaving(true);

    try {
      // Actualizar producto con stock mínimo
      await onUpdateProducto(productoSeleccionado.id, { stock_minimo: stockMinimo });
      
      toast.success('Stock mínimo configurado correctamente');

      setConfigurandoStock(false);
      setProductoSeleccionado(null);
      setStockMinimo(0);

    } catch (error) {
      console.error('Error al configurar stock mínimo:', error);
      toast.error('Error al configurar stock mínimo');
    } finally {
      setIsSaving(false);
    }
  };

  const enviarAlertaStockBajo = async (producto: any) => {
    try {
      const alertaData = {
        producto_id: producto.id,
        sku: producto.sku,
        descripcion: producto.descripcion,
        stock_actual: producto.stock_actual,
        stock_minimo: producto.stock_minimo,
        diferencia: (producto.stock_minimo || 0) - producto.stock_actual,
        proveedor: producto.proveedor_principal,
        precio_costo: producto.precio_costo,
        fecha_alerta: new Date().toISOString()
      };

      try {
        await webhookService.enviarAlertaStock(alertaData);
        toast.success('Alerta de stock bajo enviada a n8n');
      } catch (error) {
        console.warn('Error enviando alerta a n8n:', error);
      }
    } catch (error) {
      console.error('Error al enviar alerta:', error);
    }
  };

  const generarOrdenCompra = async (alerta: any) => {
    try {
      const cantidadSugerida = alerta.diferencia + Math.ceil(alerta.stock_minimo * 0.5); // 150% del mínimo
      
      const ordenData = {
        cuit_proveedor: "12345678901",
        proveedor_nombre: alerta.proveedor_principal || 'Por definir',
        productos: [{
          id: alerta.producto_id,
          nombre: alerta.descripcion,
          cantidad: cantidadSugerida,
          precio: alerta.precio_costo
        }],
        total: cantidadSugerida * alerta.precio_costo
      };

      try {
        await webhookService.crearOrdenCompra(ordenData);
      } catch (error) {
        console.warn('Error enviando orden a n8n:', error);
      }
      
      toast.success(`Orden de compra generada para ${alerta.sku}`);
      
    } catch (error) {
      console.error('Error al generar orden de compra:', error);
      toast.error('Error al generar orden de compra');
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{productosStockCritico}</p>
                <p className="text-sm text-muted-foreground">Productos con stock crítico</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{productosConStockMinimo.length}</p>
                <p className="text-sm text-muted-foreground">Productos monitoreados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-8 w-8 text-accent" />
              <div>
                <Dialog open={configurandoStock} onOpenChange={setConfigurandoStock}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Stock Mínimo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurar Stock Mínimo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleConfigurarStockMinimo} className="space-y-4">
                      <div>
                        <Label htmlFor="producto">Producto</Label>
                        <select
                          className="w-full mt-1 p-2 border rounded-md"
                          onChange={(e) => {
                            const producto = productos.find(p => p.id === e.target.value);
                            setProductoSeleccionado(producto || null);
                          }}
                          required
                        >
                          <option value="">Seleccionar producto</option>
                          {productos.map(producto => (
                            <option key={producto.id} value={producto.id}>
                              {producto.sku} - {producto.descripcion} (Stock: {producto.stock_actual})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="stock-minimo">Stock Mínimo</Label>
                        <Input
                          id="stock-minimo"
                          type="number"
                          min="1"
                          value={stockMinimo}
                          onChange={(e) => setStockMinimo(Number(e.target.value))}
                          placeholder="Cantidad mínima"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          className="flex-1" 
                          disabled={isSaving}
                        >
                          <Database className="mr-2 h-4 w-4" />
                          {isSaving ? 'Guardando...' : 'Configurar'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setConfigurandoStock(false)}
                          className="flex-1"
                          disabled={isSaving}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de alertas de stock bajo */}
      {alertasStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Productos con Stock Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Stock Actual</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasStock.map((alerta) => (
                  <TableRow key={alerta.id}>
                    <TableCell className="font-medium">{alerta.sku}</TableCell>
                    <TableCell>{alerta.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {alerta.stock_actual}
                      </Badge>
                    </TableCell>
                    <TableCell>{alerta.stock_minimo}</TableCell>
                    <TableCell className="text-destructive font-medium">
                      -{alerta.diferencia}
                    </TableCell>
                    <TableCell>{alerta.proveedor_principal || 'No definido'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => generarOrdenCompra(alerta)}
                        className="flex items-center gap-1"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Generar Orden
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay alertas */}
      {alertasStock.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin alertas de stock</h3>
            <p className="text-muted-foreground">
              {productosConStockMinimo.length === 0 
                ? "Configura stock mínimo en tus productos para recibir alertas automáticas."
                : "Todos los productos monitoreados tienen stock suficiente."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlertasStock;