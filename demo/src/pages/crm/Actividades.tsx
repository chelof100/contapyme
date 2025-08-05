import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useActividades, useClientes, useOportunidades } from '@/hooks/useCRMData';
import { useAuth } from '@/contexts/AuthContext';
import { webhookService } from '@/services/webhookService';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  Users, 
  Target,
  Filter,
  Search
} from 'lucide-react';

const Actividades = () => {
  const { user } = useAuth();
  const { data: actividades = [], loading: loadingActividades, create: createActividad, update: updateActividad } = useActividades();
  const { data: clientes = [] } = useClientes();
  const { data: oportunidades = [] } = useOportunidades();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    prioridad: '',
    completada: '',
    assigned_to: ''
  });

  const [actividadForm, setActividadForm] = useState({
    tipo: '',
    titulo: '',
    descripcion: '',
    cliente_id: '',
    oportunidad_id: '',
    fecha_vencimiento: '',
    prioridad: 'media',
    assigned_to: user?.id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actividadForm.titulo || !actividadForm.tipo) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const actividadData = {
        ...actividadForm,
        cliente_id: actividadForm.cliente_id === 'none' ? null : actividadForm.cliente_id,
        oportunidad_id: actividadForm.oportunidad_id === 'none' ? null : actividadForm.oportunidad_id,
        fecha_vencimiento: actividadForm.fecha_vencimiento ? 
          new Date(actividadForm.fecha_vencimiento).toISOString() : null,
        completada: false
      };

      const nuevaActividad = await createActividad(actividadData);
      
      if (nuevaActividad) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/crm-actividad-crear', {
            actividad_id: nuevaActividad.id,
            ...actividadData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success(`Actividad "${actividadForm.titulo}" creada exitosamente`);
        
        // Limpiar formulario
        setActividadForm({
          tipo: '',
          titulo: '',
          descripcion: '',
          cliente_id: '',
          oportunidad_id: '',
          fecha_vencimiento: '',
          prioridad: 'media',
          assigned_to: user?.id || ''
        });
        setShowForm(false);
      }

    } catch (error) {
      console.error('Error al crear actividad:', error);
      toast.error('Error al crear la actividad');
    } finally {
      setLoading(false);
    }
  };

  const completarActividad = async (actividadId: string) => {
    try {
      await updateActividad(actividadId, { 
        completada: true, 
        fecha_completada: new Date().toISOString() 
      });
      
      // Enviar a n8n
      try {
        await webhookService.makeRequest('/webhook/crm-actividad-completar', {
          actividad_id: actividadId,
          fecha_completada: new Date().toISOString()
        });
      } catch (webhookError) {
        console.warn('Error enviando a n8n:', webhookError);
      }

      toast.success('Actividad marcada como completada');
    } catch (error) {
      console.error('Error al completar actividad:', error);
      toast.error('Error al completar la actividad');
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    const variants = {
      'alta': 'destructive',
      'media': 'default',
      'baja': 'secondary'
    } as const;
    
    return <Badge variant={variants[prioridad as keyof typeof variants] || 'secondary'}>{prioridad}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const icons = {
      'llamada': <Phone className="h-3 w-3" />,
      'email': <Mail className="h-3 w-3" />,
      'reunion': <Users className="h-3 w-3" />,
      'tarea': <CheckCircle className="h-3 w-3" />,
      'demo': <Target className="h-3 w-3" />
    };
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {icons[tipo as keyof typeof icons]}
        {tipo}
      </Badge>
    );
  };

  const actividadesFiltradas = actividades.filter(actividad => {
    const matchTipo = !filtros.tipo || filtros.tipo === 'all' || actividad.tipo === filtros.tipo;
    const matchPrioridad = !filtros.prioridad || filtros.prioridad === 'all' || actividad.prioridad === filtros.prioridad;
    const matchCompletada = filtros.completada === '' || filtros.completada === 'all' || 
      (filtros.completada === 'true' ? actividad.completada : !actividad.completada);
    const matchAssigned = !filtros.assigned_to || actividad.assigned_to === filtros.assigned_to;
    
    return matchTipo && matchPrioridad && matchCompletada && matchAssigned;
  });

  const actividadesPendientes = actividades.filter(a => !a.completada);
  const actividadesVencidas = actividadesPendientes.filter(a => 
    a.fecha_vencimiento && new Date(a.fecha_vencimiento) < new Date()
  );
  const actividadesHoy = actividadesPendientes.filter(a => 
    a.fecha_vencimiento && 
    new Date(a.fecha_vencimiento).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Actividades</h1>
          <p className="mt-2 text-gray-600">Organiza y da seguimiento a tus tareas y actividades</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Actividad</DialogTitle>
              <DialogDescription>
                Programa una nueva tarea o actividad
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Actividad *</Label>
                  <Select value={actividadForm.tipo} onValueChange={(value) => setActividadForm({...actividadForm, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tarea">Tarea</SelectItem>
                      <SelectItem value="llamada">Llamada</SelectItem>
                      <SelectItem value="reunion">Reunión</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="demo">Demo/Presentación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select value={actividadForm.prioridad} onValueChange={(value) => setActividadForm({...actividadForm, prioridad: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={actividadForm.titulo}
                  onChange={(e) => setActividadForm({...actividadForm, titulo: e.target.value})}
                  placeholder="Ej: Llamar para seguimiento de propuesta"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={actividadForm.descripcion}
                  onChange={(e) => setActividadForm({...actividadForm, descripcion: e.target.value})}
                  placeholder="Detalles de la actividad"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select value={actividadForm.cliente_id} onValueChange={(value) => setActividadForm({...actividadForm, cliente_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente específico</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oportunidad">Oportunidad</Label>
                  <Select value={actividadForm.oportunidad_id} onValueChange={(value) => setActividadForm({...actividadForm, oportunidad_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar oportunidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin oportunidad específica</SelectItem>
                      {oportunidades.filter(o => o.estado === 'abierta').map((oportunidad) => (
                        <SelectItem key={oportunidad.id} value={oportunidad.id}>
                          {oportunidad.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_vencimiento">Fecha y Hora de Vencimiento</Label>
                <Input
                  id="fecha_vencimiento"
                  type="datetime-local"
                  value={actividadForm.fecha_vencimiento}
                  onChange={(e) => setActividadForm({...actividadForm, fecha_vencimiento: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creando...' : 'Crear Actividad'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas de actividades */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{actividadesPendientes.length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{actividadesHoy.length}</p>
                <p className="text-sm text-muted-foreground">Para Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{actividadesVencidas.length}</p>
                <p className="text-sm text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{actividades.filter(a => a.completada).length}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={filtros.tipo} onValueChange={(value) => setFiltros({...filtros, tipo: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="tarea">Tarea</SelectItem>
                <SelectItem value="llamada">Llamada</SelectItem>
                <SelectItem value="reunion">Reunión</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.prioridad} onValueChange={(value) => setFiltros({...filtros, prioridad: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.completada} onValueChange={(value) => setFiltros({...filtros, completada: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="false">Pendientes</SelectItem>
                <SelectItem value="true">Completadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Vista Lista</TabsTrigger>
          <TabsTrigger value="calendario">Vista Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Actividades vencidas */}
          {actividadesVencidas.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Actividades Vencidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actividadesVencidas.map((actividad) => (
                    <ActividadCard 
                      key={actividad.id} 
                      actividad={actividad} 
                      clientes={clientes}
                      oportunidades={oportunidades}
                      onCompletar={completarActividad}
                      isVencida={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actividades para hoy */}
          {actividadesHoy.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Actividades para Hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actividadesHoy.map((actividad) => (
                    <ActividadCard 
                      key={actividad.id} 
                      actividad={actividad} 
                      clientes={clientes}
                      oportunidades={oportunidades}
                      onCompletar={completarActividad}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Todas las actividades */}
          <Card>
            <CardHeader>
              <CardTitle>Todas las Actividades</CardTitle>
              <CardDescription>
                {actividadesFiltradas.length} actividades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActividades ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando actividades...</p>
                </div>
              ) : actividadesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay actividades que coincidan con los filtros</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actividadesFiltradas.map((actividad) => (
                    <ActividadCard 
                      key={actividad.id} 
                      actividad={actividad} 
                      clientes={clientes}
                      oportunidades={oportunidades}
                      onCompletar={completarActividad}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Vista Calendario</h3>
              <p className="text-muted-foreground">
                La vista calendario estará disponible en la próxima actualización
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente para tarjeta de actividad
const ActividadCard = ({ 
  actividad, 
  clientes, 
  oportunidades, 
  onCompletar, 
  isVencida = false 
}: { 
  actividad: any; 
  clientes: any[]; 
  oportunidades: any[]; 
  onCompletar: (id: string) => void;
  isVencida?: boolean;
}) => {
  const cliente = clientes.find(c => c.id === actividad.cliente_id);
  const oportunidad = oportunidades.find(o => o.id === actividad.oportunidad_id);

  return (
    <Card className={`${isVencida ? 'border-red-200 bg-red-50' : ''} ${actividad.completada ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                checked={actividad.completada || false}
                onCheckedChange={() => !actividad.completada && onCompletar(actividad.id)}
                disabled={actividad.completada}
              />
              <h4 className={`font-medium ${actividad.completada ? 'line-through' : ''}`}>
                {actividad.titulo || 'Sin título'}
              </h4>
              {actividad.tipo && getTipoBadge(actividad.tipo)}
              {actividad.prioridad && getPrioridadBadge(actividad.prioridad)}
            </div>
            
            {actividad.descripcion && (
              <p className="text-sm text-muted-foreground mb-2">
                {actividad.descripcion}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {cliente && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {cliente.razon_social || 'Cliente sin nombre'}
                </span>
              )}
              {oportunidad && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {oportunidad.titulo || 'Oportunidad sin título'}
                </span>
              )}
              {actividad.fecha_vencimiento && (
                <span className={`flex items-center gap-1 ${isVencida ? 'text-red-600 font-medium' : ''}`}>
                  <Clock className="h-3 w-3" />
                  {new Date(actividad.fecha_vencimiento).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Actividades;