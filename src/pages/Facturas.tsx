import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Eye, Calendar, Filter, Settings, Mail, FileArchive, Send } from 'lucide-react';
import { useFacturas, useProductos } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import FacturaForm from '@/components/facturas/FacturaForm';

const Facturas = () => {
  const { user } = useAuth();
  const { data: facturasEmitidas, loading: loadingEmitidas, create: createFacturaEmitida } = useFacturas();
  const { data: facturasRecibidas, loading: loadingRecibidas, create: createFacturaRecibida } = useFacturas();
  const { data: productos, update: updateProducto } = useProductos();
  const { create: createMovimiento } = useMovimientosStock();
  const { create: createFacturaProducto } = useFacturaProductos();
  const [loading, setLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedFacturas, setSelectedFacturas] = useState<string[]>([]);
  const [emailData, setEmailData] = useState({
    email_destino: '',
    mensaje: '',
    facturas_seleccionadas: [] as string[]
  });

  // Estados para recepción de facturas
  const [recepcionForm, setRecepcionForm] = useState({
    cuit_proveedor: '',
    numero_factura: '',
    monto: '',
    orden_compra_id: '',
    pdf_file: null as File | null
  });

  const validateCUIT = (cuit: string) => {
    const regex = /^\d{11}$/;
    return regex.test(cuit);
  };

  // Función para manejar selección de facturas
  const handleFacturaSelection = (facturaId: string, checked: boolean) => {
    if (checked) {
      setSelectedFacturas(prev => [...prev, facturaId]);
    } else {
      setSelectedFacturas(prev => prev.filter(id => id !== facturaId));
    }
  };

  // Función para seleccionar/deseleccionar todas las facturas
  const handleSelectAllFacturas = (checked: boolean) => {
    if (checked) {
      setSelectedFacturas(facturasEmitidas.map(f => f.id));
    } else {
      setSelectedFacturas([]);
    }
  };

  // Verificar si todas las facturas están seleccionadas
  const allFacturasSelected = selectedFacturas.length === facturasEmitidas.length && facturasEmitidas.length > 0;
  const someFacturasSelected = selectedFacturas.length > 0;

  const handleEmitirFactura = async (facturaData: any) => {
    if (!validateCUIT(facturaData.cuit_cliente)) {
      toast.error("CUIT inválido. Debe tener 11 dígitos.");
      return;
    }

    setLoading(true);

    try {
      // Generar número de factura automático
      const numeroFactura = facturaData.numero_factura || 
        `${facturaData.punto_venta}-${(Date.now() % 100000000).toString().padStart(8, '0')}`;
      
      const facturaCompleta = {
        numero_factura: numeroFactura,
        punto_venta: facturaData.punto_venta,
        tipo_comprobante: facturaData.tipo_comprobante,
        cuit_cliente: facturaData.cuit_cliente,
        cliente_nombre: 'Cliente', // En producción obtener del CUIT
        fecha_emision: facturaData.fecha,
        subtotal: facturaData.subtotal,
        porcentaje_iva: facturaData.porcentajeIVA,
        monto_iva: facturaData.montoIVA,
        total: facturaData.total,
        descripcion: facturaData.descripcion,
        condicion_iva: facturaData.condicionIVA,
        estado: 'pendiente',
        metadata: facturaData.metadata
      };

      // Crear factura en Supabase
      const nuevaFactura = await createFacturaEmitida(facturaCompleta);
      
      if (nuevaFactura) {
        // Procesar productos si hay productos en la factura
        if (facturaData.productos && facturaData.productos.length > 0) {
          try {
            for (const productoVenta of facturaData.productos) {
              const producto = productos.find(p => p.sku === productoVenta.sku);
              
              // Agregar producto a la factura
              await createFacturaProducto({
                factura_id: nuevaFactura.id,
                producto_id: producto?.id,
                sku: productoVenta.sku,
                nombre_producto: productoVenta.nombre,
                cantidad: productoVenta.cantidad,
                precio_unitario: productoVenta.precio_unitario,
                subtotal: productoVenta.subtotal,
                descripcion: productoVenta.descripcion
              });
            }
            
            toast.success(`Factura creada con ${facturaData.productos.length} productos`);
          } catch (productosError) {
            console.error('Error agregando productos a la factura:', productosError);
            toast.error('Error agregando productos, pero factura emitida correctamente');
          }
        }

        // Enviar a n8n para procesamiento con AFIP
        try {
          await webhookService.emitirFactura({
            ...facturaCompleta,
            factura_id: nuevaFactura.id,
            productos: facturaData.productos || []
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n, pero factura guardada en Supabase:', webhookError);
        }

        const mensajeProductos = facturaData.productos && facturaData.productos.length > 0 
          ? ` y stock actualizado automáticamente`
          : '';
        
        toast.success(`Factura ${numeroFactura} creada exitosamente${mensajeProductos}. Total: $${facturaData.total.toLocaleString('es-AR')}`);
      }

    } catch (error) {
      console.error('Error al emitir factura:', error);
      toast.error(`Error al emitir la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecibirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCUIT(recepcionForm.cuit_proveedor)) {
      toast.error("CUIT inválido. Debe tener 11 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const facturaData = {
        numero_factura: recepcionForm.numero_factura,
        cuit_proveedor: recepcionForm.cuit_proveedor,
        proveedor_nombre: 'Proveedor', // En producción obtener del CUIT
        fecha_recepcion: new Date().toISOString().split('T')[0],
        monto: parseFloat(recepcionForm.monto),
        orden_compra_id: recepcionForm.orden_compra_id,
        estado: 'pendiente'
      };

      const nuevaFactura = await createFacturaRecibida(facturaData);
      
      if (nuevaFactura) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.recibirFactura({
            ...facturaData,
            factura_id: nuevaFactura.id
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n, pero factura guardada en Supabase:', webhookError);
        }

        toast.success("Factura recibida registrada exitosamente");
        
        setRecepcionForm({
          cuit_proveedor: '',
          numero_factura: '',
          monto: '',
          orden_compra_id: '',
          pdf_file: null
        });
      }

    } catch (error) {
      console.error('Error al recibir factura:', error);
      toast.error(`Error al registrar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'pagada': 'default',
      'pendiente': 'secondary',
      'vencida': 'destructive'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Facturas</h1>
          <p className="mt-2 text-gray-600">Emite y recibe facturas electrónicas</p>
        </div>
      </div>

      <Tabs defaultValue="emision" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emision">Emitir Facturas</TabsTrigger>
          <TabsTrigger value="recepcion">Recibir Facturas</TabsTrigger>
          <TabsTrigger value="listado">Ver Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="emision">
          <FacturaForm onSubmit={handleEmitirFactura} loading={loading} />
        </TabsContent>

        <TabsContent value="recepcion">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Factura Recibida</CardTitle>
              <CardDescription>
                Registra facturas recibidas de proveedores via n8n
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecibirFactura} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuit_proveedor">CUIT del Proveedor *</Label>
                    <Input
                      id="cuit_proveedor"
                      value={recepcionForm.cuit_proveedor}
                      onChange={(e) => setRecepcionForm({...recepcionForm, cuit_proveedor: e.target.value})}
                      placeholder="30506070809"
                      maxLength={11}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_factura">Número de Factura *</Label>
                    <Input
                      id="numero_factura"
                      value={recepcionForm.numero_factura}
                      onChange={(e) => setRecepcionForm({...recepcionForm, numero_factura: e.target.value})}
                      placeholder="0001-00001234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto_recepcion">Monto *</Label>
                    <Input
                      id="monto_recepcion"
                      type="number"
                      min="0"
                      step="0.01"
                      value={recepcionForm.monto}
                      onChange={(e) => setRecepcionForm({...recepcionForm, monto: e.target.value})}
                      placeholder="5000.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orden_compra">Orden de Compra</Label>
                    <Select onValueChange={(value) => setRecepcionForm({...recepcionForm, orden_compra_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar orden" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OC-001">OC-001 - Proveedor SA</SelectItem>
                        <SelectItem value="OC-002">OC-002 - Servicios SRL</SelectItem>
                        <SelectItem value="OC-003">OC-003 - Materiales LTDA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf_file">PDF de la Factura</Label>
                  <Input
                    id="pdf_file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setRecepcionForm({...recepcionForm, pdf_file: e.target.files?.[0] || null})}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? 'Registrando...' : 'Registrar Factura'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listado">
          <div className="space-y-6">
            {/* Facturas Emitidas */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Facturas Emitidas</CardTitle>
                    <CardDescription>Facturas que has emitido a tus clientes</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => toast.info('Función de descarga próximamente')}
                      disabled={loading || selectedFacturas.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF ({selectedFacturas.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast.info('Función de descarga próximamente')}
                      disabled={loading || selectedFacturas.length === 0}
                    >
                      <FileArchive className="h-4 w-4 mr-2" />
                      Excel ({selectedFacturas.length})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast.info('Función de email próximamente')}
                      disabled={selectedFacturas.length === 0}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email ({selectedFacturas.length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {loadingEmitidas ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Cargando facturas...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={allFacturasSelected}
                              onCheckedChange={handleSelectAllFacturas}
                              aria-label="Seleccionar todas las facturas"
                            />
                          </TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Número</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>IVA</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>CAE</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturasEmitidas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                              No hay facturas emitidas. Crea tu primera factura usando el formulario de arriba.
                            </TableCell>
                          </TableRow>
                        ) : (
                          facturasEmitidas.map((factura) => (
                            <TableRow key={factura.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedFacturas.includes(factura.id)}
                                  onCheckedChange={(checked) => handleFacturaSelection(factura.id, checked as boolean)}
                                  aria-label={`Seleccionar factura ${factura.numero_factura}`}
                                />
                              </TableCell>
                              <TableCell>{new Date(factura.fecha_emision).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{factura.cliente_nombre}</div>
                                  <div className="text-sm text-gray-500">{factura.cuit_cliente}</div>
                                </div>
                              </TableCell>
                              <TableCell>{factura.tipo_comprobante}</TableCell>
                              <TableCell className="font-mono text-sm">{factura.numero_factura}</TableCell>
                              <TableCell className="font-medium">
                                ${factura.subtotal?.toLocaleString('es-AR') || '0'}
                              </TableCell>
                              <TableCell className="text-green-600">
                                ${factura.monto_iva?.toLocaleString('es-AR') || '0'}
                              </TableCell>
                              <TableCell className="font-semibold">
                                ${factura.total?.toLocaleString('es-AR') || '0'}
                              </TableCell>
                              <TableCell>
                                {getEstadoBadge(factura.estado)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{factura.cae || 'Pendiente'}</TableCell>
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

            {/* Facturas Recibidas */}
            <Card>
              <CardHeader>
                <CardTitle>Facturas Recibidas</CardTitle>
                <CardDescription>Facturas recibidas de proveedores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {loadingRecibidas ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Cargando facturas...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Número</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Orden de Compra</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturasRecibidas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No hay facturas recibidas. Registra facturas de proveedores usando el formulario de arriba.
                            </TableCell>
                          </TableRow>
                        ) : (
                          facturasRecibidas.map((factura) => (
                            <TableRow key={factura.id}>
                              <TableCell>{new Date(factura.fecha_recepcion).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{factura.proveedor_nombre}</div>
                                  <div className="text-sm text-gray-500">{factura.cuit_proveedor}</div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{factura.numero_factura}</TableCell>
                              <TableCell className="font-semibold">
                                ${factura.monto?.toLocaleString('es-AR') || '0'}
                              </TableCell>
                              <TableCell>{factura.orden_compra_id || 'N/A'}</TableCell>
                              <TableCell>
                                {getEstadoBadge(factura.estado)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Facturas;