import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useOportunidades, useEtapasPipeline, useClientes } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import { 
  Target, 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  Filter
} from 'lucide-react';

const Oportunidades = () => {
  const { data: oportunidades, loading: loadingOportunidades, create: createOportunidad, update: updateOportunidad } = useOportunidades();
  const { data: etapas } = useEtapasPipeline();
  const { data: clientes } = useClientes();
  const [showForm, setShowForm] = useState(false);
  const [selectedOportunidad, setSelectedOportunidad] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [oportunidadForm, setOportunidadForm] = useState({
    cliente_id: '',
    etapa_id: '',
    titulo: '',
    descripcion: '',
    valor_estimado: 0,
    probabilidad: 50,
    fecha_cierre_estimada: '',
    fuente: '',
    assigned_to: ''
  });

  const [filtros, setFiltros] = useState({
    etapa: '',
    estado: '',
    assigned_to: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oportunidadForm.cliente_id || !oportunidadForm.titulo) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const oportunidadData = {
        ...oportunidadForm,
        valor_estimado: Number(oportunidadForm.valor_estimado),
        probabilidad: Number(oportunidadForm.probabilidad),
        estado: 'abierta'
      };

      const nuevaOportunidad = await createOportunidad(oportunidadData);
      
      if (nuevaOportunidad) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/crm-oportunidad-crear', {
            oportunidad_id: nuevaOportunidad.id,
            ...oportunidadData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success(`Oportunidad "${oportunidadForm.titulo}" creada exitosamente`);
        
        // Limpiar formulario
        setOportunidadForm({
          cliente_id: '',
          etapa_id: '',
          titulo: '',
          descripcion: '',
          valor_estimado: 0,
          probabilidad: 50,
          fecha_cierre_estimada: '',
          fuente: '',
          assigned_to: ''
        });
        setShowForm(false);
      }

    } catch (error) {
      console.error('Error al crear oportunidad:', error);
      toast.error('Error al crear la oportunidad');
    } finally {
      setLoading(false);
    }
  };

  const moverOportunidad = async (oportunidadId: string, nuevaEtapaId: string) => {
    try {
      await updateOportunidad(oportunidadId, { etapa_id: nuevaEtapaId });
      
      // Enviar a n8n
      try {
        await webhookService.makeRequest('/webhook/crm-oportunidad-mover-etapa', {
          oportunidad_id: oportunidadId,
          nueva_etapa_id: nuevaEtapaId
        });
      } catch (webhookError) {
        console.warn('Error enviando a n8n:', webhookError);
      }

      toast.success('Oportunidad movida exitosamente');
    } catch (error) {
      console.error('Error al mover oportunidad:', error);
      toast.error('Error al mover la oportunidad');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'abierta': 'default',
      'ganada': 'default',
      'perdida': 'destructive',
      'cancelada': 'secondary'
    } as const;
    
    const colors = {
      'abierta': 'bg-blue-100 text-blue-800',
      'ganada': 'bg-green-100 text-green-800',
      'perdida': 'bg-red-100 text-red-800',
      'cancelada': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {estado}
      </Badge>
    );
  };

  const calcularMetricas = () => {
    const oportunidadesAbiertas = oportunidades.filter(o => o.estado === 'abierta');
    const valorTotal = oportunidadesAbiertas.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
    const valorPonderado = oportunidadesAbiertas.reduce((sum, o) => 
      sum + ((o.valor_estimado || 0) * (o.probabilidad || 0) / 100), 0
    );
    const tasaConversion = oportunidades.length > 0 ? 
      (oportunidades.filter(o => o.estado === 'ganada').length / oportunidades.length) * 100 : 0;

    return {
      totalAbiertas: oportunidadesAbiertas.length,
      valorTotal,
      valorPonderado,
      tasaConversion
    };
  };

  const metricas = calcularMetricas();

  const oportunidadesFiltradas = oportunidades.filter(oportunidad => {
    const matchEtapa = !filtros.etapa || filtros.etapa === 'all' || oportunidad.etapa_id === filtros.etapa;
    const matchEstado = !filtros.estado || filtros.estado === 'all' || oportunidad.estado === filtros.estado;
    const matchAssigned = !filtros.assigned_to || oportunidad.assigned_to === filtros.assigned_to;
    
    return matchEtapa && matchEstado && matchAssigned;
  });

  // Agrupar oportunidades por etapa para el Kanban
  const oportunidadesPorEtapa = etapas.reduce((acc, etapa) => {
    acc[etapa.id] = oportunidadesFiltradas.filter(o => o.etapa_id === etapa.id);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Ventas</h1>
          <p className="mt-2 text-gray-600">Gestiona tus oportunidades de negocio</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Oportunidad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Oportunidad</DialogTitle>
              <DialogDescription>
                Registra una nueva oportunidad de venta
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Select value={oportunidadForm.cliente_id} onValueChange={(value) => setOportunidadForm({...oportunidadForm, cliente_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="etapa">Etapa Inicial</Label>
                  <Select value={oportunidadForm.etapa_id} onValueChange={(value) => setOportunidadForm({...oportunidadForm, etapa_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map((etapa) => (
                        <SelectItem key={etapa.id} value={etapa.id}>
                          {etapa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título de la Oportunidad *</Label>
                <Input
                  id="titulo"
                  value={oportunidadForm.titulo}
                  onChange={(e) => setOportunidadForm({...oportunidadForm, titulo: e.target.value})}
                  placeholder="Ej: Implementación sistema contable"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={oportunidadForm.descripcion}
                  onChange={(e) => setOportunidadForm({...oportunidadForm, descripcion: e.target.value})}
                  placeholder="Detalles de la oportunidad"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_estimado">Valor Estimado ($)</Label>
                  <Input
                    id="valor_estimado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={oportunidadForm.valor_estimado}
                    onChange={(e) => setOportunidadForm({...oportunidadForm, valor_estimado: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probabilidad">Probabilidad (%)</Label>
                  <Input
                    id="probabilidad"
                    type="number"
                    min="0"
                    max="100"
                    value={oportunidadForm.probabilidad}
                    onChange={(e) => setOportunidadForm({...oportunidadForm, probabilidad: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_cierre">Fecha Cierre Estimada</Label>
                  <Input
                    id="fecha_cierre"
                    type="date"
                    value={oportunidadForm.fecha_cierre_estimada}
                    onChange={(e) => setOportunidadForm({...oportunidadForm, fecha_cierre_estimada: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuente">Fuente</Label>
                  <Select value={oportunidadForm.fuente} onValueChange={(value) => setOportunidadForm({...oportunidadForm, fuente: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Origen de la oportunidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Sitio Web</SelectItem>
                      <SelectItem value="telefono">Llamada Telefónica</SelectItem>
                      <SelectItem value="referencia">Referencia</SelectItem>
                      <SelectItem value="marketing">Campaña Marketing</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creando...' : 'Crear Oportunidad'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas del Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metricas.totalAbiertas}</p>
                <p className="text-sm text-muted-foreground">Oportunidades Abiertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${metricas.valorTotal.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Valor Total Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${metricas.valorPonderado.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Valor Ponderado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metricas.tasaConversion.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Tasa Conversión</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={filtros.etapa} onValueChange={(value) => setFiltros({...filtros, etapa: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    {etapa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtros.estado} onValueChange={(value) => setFiltros({...filtros, estado: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="ganada">Ganada</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Pipeline */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {etapas.map((etapa) => (
            <Card key={etapa.id} className="w-80 flex-shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: etapa.color }}
                    />
                    {etapa.nombre}
                  </CardTitle>
                  <Badge variant="secondary">
                    {oportunidadesPorEtapa[etapa.id]?.length || 0}
                  </Badge>
                </div>
                {etapa.descripcion && (
                  <CardDescription className="text-sm">
                    {etapa.descripcion}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {oportunidadesPorEtapa[etapa.id]?.map((oportunidad) => {
                  const cliente = clientes.find(c => c.id === oportunidad.cliente_id);
                  return (
                    <Card key={oportunidad.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{oportunidad.titulo}</h4>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {cliente?.razon_social}
                          </p>
                          
                          {oportunidad.valor_estimado && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                ${oportunidad.valor_estimado.toLocaleString('es-AR')}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div className="text-xs text-muted-foreground">
                                {oportunidad.probabilidad}% prob.
                              </div>
                            </div>
                            {oportunidad.fecha_cierre_estimada && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(oportunidad.fecha_cierre_estimada).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            {getEstadoBadge(oportunidad.estado)}
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2"
                                onClick={() => setSelectedOportunidad(oportunidad)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 px-2">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {(!oportunidadesPorEtapa[etapa.id] || oportunidadesPorEtapa[etapa.id].length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay oportunidades</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de detalle de oportunidad */}
      {selectedOportunidad && (
        <Dialog open={true} onOpenChange={() => setSelectedOportunidad(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedOportunidad.titulo}</DialogTitle>
              <DialogDescription>
                Cliente: {clientes.find(c => c.id === selectedOportunidad.cliente_id)?.razon_social}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Valor Estimado</Label>
                  <p className="text-lg font-bold text-green-600">
                    ${selectedOportunidad.valor_estimado?.toLocaleString('es-AR') || '0'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Probabilidad</Label>
                  <p className="text-lg font-bold">{selectedOportunidad.probabilidad}%</p>
                </div>
              </div>
              
              {selectedOportunidad.descripcion && (
                <div>
                  <Label className="text-sm font-medium">Descripción</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedOportunidad.descripcion}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button className="flex-1">Editar Oportunidad</Button>
                <Button variant="outline">Agregar Actividad</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Oportunidades;