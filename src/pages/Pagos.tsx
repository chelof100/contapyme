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
import { CreditCard, DollarSign, Eye, ExternalLink, Banknote } from 'lucide-react';
import { usePagos, useFacturasEmitidas, useFacturasRecibidas } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';

const Pagos = () => {
  const { user } = useAuth();
  const { data: pagos, loading: loadingPagos, create: createPago } = usePagos();
  const { data: facturasEmitidas } = useFacturasEmitidas();
  const { data: facturasRecibidas } = useFacturasRecibidas();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    factura_id: '',
    tipo_factura: '',
    monto: '',
    metodo: '',
    transaccion_id: '',
    notas: ''
  });

  // Combinar facturas emitidas y recibidas pendientes
  const facturasPendientes = [
    ...facturasEmitidas
      .filter(f => f.estado === 'pendiente')
      .map(f => ({
        id: f.id,
        tipo: 'emitida' as const,
        numero: f.numero_factura,
        cliente_proveedor: f.cliente_nombre,
        cuit: f.cuit_cliente,
        monto: f.total,
        fecha_vencimiento: f.fecha_vencimiento
      })),
    ...facturasRecibidas
      .filter(f => f.estado === 'pendiente')
      .map(f => ({
        id: f.id,
        tipo: 'recibida' as const,
        numero: f.numero_factura,
        cliente_proveedor: f.proveedor_nombre,
        cuit: f.cuit_proveedor,
        monto: f.monto,
        fecha_vencimiento: f.fecha_vencimiento
      }))
  ];

  const handleFacturaChange = (facturaId: string) => {
    const factura = facturasPendientes.find(f => f.id === facturaId);
    if (factura) {
      setForm({
        ...form,
        factura_id: facturaId,
        tipo_factura: factura.tipo,
        monto: factura.monto.toString()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.factura_id || !form.monto || !form.metodo) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(form.monto) <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const pagoData = {
        factura_id: form.factura_id,
        numero_factura: facturasPendientes.find(f => f.id === form.factura_id)?.numero || '',
        tipo_factura: form.tipo_factura,
        monto: parseFloat(form.monto),
        metodo_pago: form.metodo,
        transaccion_id: form.transaccion_id,
        fecha_pago: new Date().toISOString().split('T')[0],
        estado: 'confirmado',
        notas: form.notas,
      };

      const nuevoPago = await createPago(pagoData);
      
      if (nuevoPago) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.registrarPago({
            ...pagoData,
            pago_id: nuevoPago.id
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n, pero pago guardado en Supabase:', webhookError);
        }

        toast({
          title: "¡Pago registrado exitosamente!",
          description: `Monto: $${parseFloat(form.monto).toLocaleString('es-AR')} - ${form.metodo}`,
        });

        // Limpiar formulario
        setForm({
          factura_id: '',
          tipo_factura: '',
          monto: '',
          metodo: '',
          transaccion_id: '',
          notas: ''
        });
      }

    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast({
        title: "Error",
        description: "Error al registrar el pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPago = () => {
    // Simular redirección a Mercado Pago
    const facturaSeleccionada = facturasPendientes.find(f => f.id === form.factura_id);
    if (facturaSeleccionada) {
      toast({
        title: "Redirigiendo a Mercado Pago",
        description: `Monto: $${facturaSeleccionada.monto.toLocaleString('es-AR')}`,
      });
      
      // En producción, aquí se abriría el checkout de Mercado Pago
      setTimeout(() => {
        const mockTransactionId = `MP-${Date.now()}`;
        setForm({
          ...form,
          metodo: 'Mercado Pago',
          transaccion_id: mockTransactionId
        });
        toast({
          title: "Pago procesado",
          description: `ID de transacción: ${mockTransactionId}`,
        });
      }, 2000);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'confirmado': 'default',
      'pendiente': 'secondary',
      'rechazado': 'destructive'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  const getTipoFacturaBadge = (tipo: string) => {
    return (
      <Badge variant={tipo === 'emitida' ? 'default' : 'secondary'}>
        {tipo === 'emitida' ? 'Cobro' : 'Pago'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
        <p className="mt-2 text-gray-600">Registra pagos y cobros de facturas via n8n</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Registrar Pago
            </CardTitle>
            <CardDescription>
              Registra un pago recibido o realizado via n8n
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="factura">Factura *</Label>
                <Select onValueChange={handleFacturaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar factura" />
                  </SelectTrigger>
                  <SelectContent>
                    {facturasPendientes.map((factura) => (
                      <SelectItem key={factura.id} value={factura.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {factura.numero} - {factura.cliente_proveedor}
                          </span>
                          <span className="ml-2">
                            ${factura.monto.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.factura_id && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {facturasPendientes.find(f => f.id === form.factura_id)?.cliente_proveedor}
                      </p>
                      <p className="text-sm text-gray-600">
                        {facturasPendientes.find(f => f.id === form.factura_id)?.numero}
                      </p>
                    </div>
                    {getTipoFacturaBadge(form.tipo_factura)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Vence: {facturasPendientes.find(f => f.id === form.factura_id)?.fecha_vencimiento}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({...form, monto: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodo">Método de Pago *</Label>
                  <Select onValueChange={(value) => setForm({...form, metodo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mercado Pago">Mercado Pago</SelectItem>
                      <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaccion_id">ID de Transacción</Label>
                <Input
                  id="transaccion_id"
                  value={form.transaccion_id}
                  onChange={(e) => setForm({...form, transaccion_id: e.target.value})}
                  placeholder="ID de referencia (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Input
                  id="notas"
                  value={form.notas}
                  onChange={(e) => setForm({...form, notas: e.target.value})}
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Enviando a n8n...' : 'Registrar Pago'}
                </Button>
                
                {form.factura_id && form.tipo_factura === 'emitida' && (
                  <Button 
                    type="button" 
                    onClick={handleMercadoPago}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Mercado Pago
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facturas Pendientes de Pago</CardTitle>
            <CardDescription>Facturas que requieren registro de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facturasPendientes.map((factura) => (
                <div key={factura.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{factura.numero}</h4>
                      <p className="text-sm text-gray-600">{factura.cliente_proveedor}</p>
                    </div>
                    {getTipoFacturaBadge(factura.tipo)}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>CUIT:</span>
                      <span className="font-mono">{factura.cuit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vencimiento:</span>
                      <span>{factura.fecha_vencimiento}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base">
                      <span>Monto:</span>
                      <span>${factura.monto.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => handleFacturaChange(factura.id)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Registro de todos los pagos procesados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loadingPagos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando pagos...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>ID Transacción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay pagos registrados. Registra tu primer pago usando el formulario de arriba.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{new Date(pago.fecha_pago).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-sm">{pago.numero_factura}</TableCell>
                        <TableCell className="font-semibold">
                          ${pago.monto?.toLocaleString('es-AR') || '0'}
                        </TableCell>
                        <TableCell>{pago.metodo_pago}</TableCell>
                        <TableCell className="font-mono text-xs">{pago.transaccion_id || 'N/A'}</TableCell>
                        <TableCell>
                          {getEstadoBadge(pago.estado)}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
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

export default Pagos;