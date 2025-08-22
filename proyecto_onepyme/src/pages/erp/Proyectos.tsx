import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useProyectos, useTiempoTrabajado, useEmpleados } from '@/hooks/useERPData';
import { useClientes } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import { 
  Folder, 
  Plus, 
  Clock, 
  Calendar, 
  DollarSign,
  Target,
  Users,
  BarChart3,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Timer,
  FileText
} from 'lucide-react';

const Proyectos = () => {
  const { data: proyectos, loading: loadingProyectos, create: createProyecto, update: updateProyecto } = useProyectos();
  const { data: tiempoTrabajado, create: createTiempo } = useTiempoTrabajado();
  const { data: empleados } = useEmpleados();
  const { data: clientes } = useClientes();
  const [showProyectoForm, setShowProyectoForm] = useState(false);
  const [showTiempoForm, setShowTiempoForm] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [proyectoForm, setProyectoForm] = useState({
    cliente_id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin_estimada: '',
    presupuesto: 0,
    responsable_id: '',
    prioridad: 'media',
    notas: ''
  });

  const [tiempoForm, setTiempoForm] = useState({
    proyecto_id: '',
    empleado_id: '',
    fecha: new Date().toISOString().split('T')[0],
    horas: 0,
    descripcion_tarea: '',
    tarifa_hora: 0,
    categoria_trabajo: '',
    facturable: true
  });

  const handleProyectoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proyectoForm.nombre || !proyectoForm.codigo) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const proyectoData = {
        ...proyectoForm,
        presupuesto: Number(proyectoForm.presupuesto),
        estado: 'planificacion' as const,
        costo_real: 0,
        facturado: 0,
        progreso_porcentaje: 0
      };

      const nuevoProyecto = await createProyecto(proyectoData);
      
      if (nuevoProyecto) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/erp-proyecto-crear', {
            proyecto_id: nuevoProyecto.id,
            ...proyectoData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success(`Proyecto "${proyectoForm.nombre}" creado exitosamente`);
        
        // Limpiar formulario
        setProyectoForm({
          cliente_id: '',
          codigo: '',
          nombre: '',
          descripcion: '',
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin_estimada: '',
          presupuesto: 0,
          responsable_id: '',
          prioridad: 'media',
          notas: ''
        });
        setShowProyectoForm(false);
      }

    } catch (error) {
      console.error('Error al crear proyecto:', error);
      toast.error('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleTiempoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tiempoForm.proyecto_id || !tiempoForm.empleado_id || tiempoForm.horas <= 0) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const tiempoData = {
        ...tiempoForm,
        horas: Number(tiempoForm.horas),
        tarifa_hora: Number(tiempoForm.tarifa_hora),
        costo_total: Number(tiempoForm.horas) * Number(tiempoForm.tarifa_hora),
        facturado: false,
        aprobado: false
      };

      const nuevoTiempo = await createTiempo(tiempoData);
      
      if (nuevoTiempo) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/erp-tiempo-registrar', {
            tiempo_id: nuevoTiempo.id,
            ...tiempoData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success('Tiempo registrado exitosamente');
        
        // Limpiar formulario
        setTiempoForm({
          proyecto_id: '',
          empleado_id: '',
          fecha: new Date().toISOString().split('T')[0],
          horas: 0,
          descripcion_tarea: '',
          tarifa_hora: 0,
          categoria_trabajo: '',
          facturable: true
        });
        setShowTiempoForm(false);
      }

    } catch (error) {
      console.error('Error al registrar tiempo:', error);
      toast.error('Error al registrar el tiempo');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'planificacion': 'outline',
      'en_progreso': 'default',
      'pausado': 'secondary',
      'completado': 'default',
      'cancelado': 'destructive'
    } as const;
    
    const colors = {
      'planificacion': 'bg-gray-100 text-gray-800',
      'en_progreso': 'bg-blue-100 text-blue-800',
      'pausado': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {estado.replace('_', ' ')}
      </Badge>
    );
  };

  const getPrioridadBadge = (prioridad: string) => {
    const variants = {
      'alta': 'destructive',
      'media': 'default',
      'baja': 'secondary'
    } as const;
    
    return <Badge variant={variants[prioridad as keyof typeof variants] || 'secondary'}>{prioridad}</Badge>;
  };

  const calcularMetricas = () => {
    const proyectosActivos = proyectos.filter(p => p.estado === 'en_progreso').length;
    const proyectosCompletados = proyectos.filter(p => p.estado === 'completado').length;
    const presupuestoTotal = proyectos.reduce((sum, p) => sum + (p.presupuesto || 0), 0);
    const costoReal = proyectos.reduce((sum, p) => sum + (p.costo_real || 0), 0);
    const horasFacturables = tiempoTrabajado.filter(t => t.facturable && !t.facturado).reduce((sum, t) => sum + (t.horas || 0), 0);

    return {
      proyectosActivos,
      proyectosCompletados,
      presupuestoTotal,
      costoReal,
      horasFacturables,
      rentabilidad: presupuestoTotal > 0 ? ((presupuestoTotal - costoReal) / presupuestoTotal) * 100 : 0
    };
  };

  const metricas = calcularMetricas();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <p className="mt-2 text-gray-600">Administra proyectos y controla el tiempo trabajado</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTiempoForm} onOpenChange={setShowTiempoForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Timer className="h-4 w-4 mr-2" />
                Registrar Tiempo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Tiempo Trabajado</DialogTitle>
                <DialogDescription>
                  Registra las horas trabajadas en un proyecto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTiempoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proyecto">Proyecto *</Label>
                    <Select value={tiempoForm.proyecto_id} onValueChange={(value) => setTiempoForm({...tiempoForm, proyecto_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {proyectos.filter(p => p.estado === 'en_progreso').map((proyecto) => (
                          <SelectItem key={proyecto.id} value={proyecto.id}>
                            {proyecto.codigo} - {proyecto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empleado">Empleado *</Label>
                    <Select value={tiempoForm.empleado_id} onValueChange={(value) => setTiempoForm({...tiempoForm, empleado_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {empleados.filter(e => e.estado === 'activo').map((empleado) => (
                          <SelectItem key={empleado.id} value={empleado.id}>
                            {empleado.nombre} {empleado.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={tiempoForm.fecha}
                      onChange={(e) => setTiempoForm({...tiempoForm, fecha: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas *</Label>
                    <Input
                      id="horas"
                      type="number"
                      min="0"
                      step="0.25"
                      value={tiempoForm.horas}
                      onChange={(e) => setTiempoForm({...tiempoForm, horas: parseFloat(e.target.value) || 0})}
                      placeholder="8.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion_tarea">Descripción de la Tarea *</Label>
                  <Textarea
                    id="descripcion_tarea"
                    value={tiempoForm.descripcion_tarea}
                    onChange={(e) => setTiempoForm({...tiempoForm, descripcion_tarea: e.target.value})}
                    placeholder="Describe el trabajo realizado"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria_trabajo">Categoría</Label>
                    <Select value={tiempoForm.categoria_trabajo} onValueChange={(value) => setTiempoForm({...tiempoForm, categoria_trabajo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de trabajo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desarrollo">Desarrollo</SelectItem>
                        <SelectItem value="diseño">Diseño</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="documentacion">Documentación</SelectItem>
                        <SelectItem value="reunion">Reunión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tarifa_hora">Tarifa por Hora</Label>
                    <Input
                      id="tarifa_hora"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tiempoForm.tarifa_hora}
                      onChange={(e) => setTiempoForm({...tiempoForm, tarifa_hora: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Registrando...' : 'Registrar Tiempo'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowTiempoForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showProyectoForm} onOpenChange={setShowProyectoForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                <DialogDescription>
                  Define un nuevo proyecto para tu empresa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProyectoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código del Proyecto *</Label>
                    <Input
                      id="codigo"
                      value={proyectoForm.codigo}
                      onChange={(e) => setProyectoForm({...proyectoForm, codigo: e.target.value})}
                      placeholder="PROJ-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente</Label>
                    <Select value={proyectoForm.cliente_id} onValueChange={(value) => setProyectoForm({...proyectoForm, cliente_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Proyecto interno</SelectItem>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.razon_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                  <Input
                    id="nombre"
                    value={proyectoForm.nombre}
                    onChange={(e) => setProyectoForm({...proyectoForm, nombre: e.target.value})}
                    placeholder="Desarrollo de aplicación web"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={proyectoForm.descripcion}
                    onChange={(e) => setProyectoForm({...proyectoForm, descripcion: e.target.value})}
                    placeholder="Descripción detallada del proyecto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      value={proyectoForm.fecha_inicio}
                      onChange={(e) => setProyectoForm({...proyectoForm, fecha_inicio: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_fin_estimada">Fecha Fin Estimada</Label>
                    <Input
                      id="fecha_fin_estimada"
                      type="date"
                      value={proyectoForm.fecha_fin_estimada}
                      onChange={(e) => setProyectoForm({...proyectoForm, fecha_fin_estimada: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presupuesto">Presupuesto</Label>
                    <Input
                      id="presupuesto"
                      type="number"
                      min="0"
                      step="0.01"
                      value={proyectoForm.presupuesto}
                      onChange={(e) => setProyectoForm({...proyectoForm, presupuesto: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prioridad">Prioridad</Label>
                    <Select value={proyectoForm.prioridad} onValueChange={(value) => setProyectoForm({...proyectoForm, prioridad: value})}>
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
                  <Label htmlFor="responsable">Responsable</Label>
                  <Select value={proyectoForm.responsable_id} onValueChange={(value) => setProyectoForm({...proyectoForm, responsable_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {empleados.filter(e => e.estado === 'activo').map((empleado) => (
                        <SelectItem key={empleado.id} value={empleado.id}>
                          {empleado.nombre} {empleado.apellido} - {empleado.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={proyectoForm.notas}
                    onChange={(e) => setProyectoForm({...proyectoForm, notas: e.target.value})}
                    placeholder="Notas adicionales del proyecto"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creando...' : 'Crear Proyecto'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowProyectoForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas de proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Folder className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metricas.proyectosActivos}</p>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metricas.proyectosCompletados}</p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${metricas.presupuestoTotal.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Timer className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metricas.horasFacturables.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Horas por Facturar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proyectos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
          <TabsTrigger value="tiempo">Time Tracking</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="proyectos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Proyectos</CardTitle>
              <CardDescription>Gestiona todos tus proyectos activos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProyectos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Presupuesto</TableHead>
                      <TableHead>Costo Real</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proyectos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay proyectos registrados. Crea tu primer proyecto.
                        </TableCell>
                      </TableRow>
                    ) : (
                      proyectos.map((proyecto) => {
                        const cliente = clientes.find(c => c.id === proyecto.cliente_id);
                        const responsable = empleados.find(e => e.id === proyecto.responsable_id);
                        
                        return (
                          <TableRow key={proyecto.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{proyecto.nombre}</div>
                                <div className="text-sm text-gray-500">{proyecto.codigo}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {cliente ? cliente.razon_social : 'Proyecto interno'}
                            </TableCell>
                            <TableCell>
                              {responsable ? `${responsable.nombre} ${responsable.apellido}` : 'Sin asignar'}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Progress value={proyecto.progreso_porcentaje || 0} className="w-16" />
                                <span className="text-xs text-muted-foreground">
                                  {proyecto.progreso_porcentaje || 0}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${proyecto.presupuesto?.toLocaleString('es-AR') || '0'}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${proyecto.costo_real?.toLocaleString('es-AR') || '0'}
                            </TableCell>
                            <TableCell>
                              {getEstadoBadge(proyecto.estado)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedProyecto(proyecto)}
                                >
                                  Ver
                                </Button>
                                <Button size="sm" variant="outline">
                                  Editar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiempo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Tiempo</CardTitle>
              <CardDescription>Historial de tiempo trabajado en proyectos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Facturable</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiempoTrabajado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay registros de tiempo. Registra el primer tiempo trabajado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tiempoTrabajado.slice(0, 10).map((tiempo) => {
                      const proyecto = proyectos.find(p => p.id === tiempo.proyecto_id);
                      const empleado = empleados.find(e => e.id === tiempo.empleado_id);
                      
                      return (
                        <TableRow key={tiempo.id}>
                          <TableCell>{new Date(tiempo.fecha).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {proyecto ? `${proyecto.codigo} - ${proyecto.nombre}` : 'Proyecto no encontrado'}
                          </TableCell>
                          <TableCell>
                            {empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Empleado no encontrado'}
                          </TableCell>
                          <TableCell className="font-medium">{tiempo.horas} hs</TableCell>
                          <TableCell className="max-w-xs truncate">{tiempo.descripcion_tarea}</TableCell>
                          <TableCell>
                            {tiempo.categoria_trabajo && (
                              <Badge variant="outline">{tiempo.categoria_trabajo}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tiempo.facturable ? 'default' : 'secondary'}>
                              {tiempo.facturable ? 'Sí' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={tiempo.aprobado ? 'default' : 'outline'}>
                              {tiempo.aprobado ? 'Aprobado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Proyectos</CardTitle>
              <CardDescription>Genera reportes de productividad y rentabilidad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Rentabilidad por Proyecto</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Clock className="h-6 w-6" />
                  <span className="text-sm">Productividad por Empleado</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Target className="h-6 w-6" />
                  <span className="text-sm">Cumplimiento de Plazos</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm">Facturación Pendiente</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Planificación de Recursos</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Reporte Ejecutivo</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalle del proyecto */}
      {selectedProyecto && (
        <Dialog open={true} onOpenChange={() => setSelectedProyecto(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                {selectedProyecto.nombre}
              </DialogTitle>
              <DialogDescription>
                {selectedProyecto.codigo} - Vista detallada del proyecto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Cliente</Label>
                      <p className="text-sm">
                        {clientes.find(c => c.id === selectedProyecto.cliente_id)?.razon_social || 'Proyecto interno'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Responsable</Label>
                      <p className="text-sm">
                        {empleados.find(e => e.id === selectedProyecto.responsable_id)?.nombre || 'Sin asignar'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Estado</Label>
                      <div className="mt-1">{getEstadoBadge(selectedProyecto.estado)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Prioridad</Label>
                      <div className="mt-1">{getPrioridadBadge(selectedProyecto.prioridad)}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métricas Financieras</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Presupuesto</Label>
                      <p className="text-sm font-bold text-green-600">
                        ${selectedProyecto.presupuesto?.toLocaleString('es-AR') || '0'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Costo Real</Label>
                      <p className="text-sm font-bold text-red-600">
                        ${selectedProyecto.costo_real?.toLocaleString('es-AR') || '0'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Facturado</Label>
                      <p className="text-sm font-bold text-blue-600">
                        ${selectedProyecto.facturado?.toLocaleString('es-AR') || '0'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Progreso</Label>
                      <div className="mt-1">
                        <Progress value={selectedProyecto.progreso_porcentaje || 0} className="w-full" />
                        <span className="text-xs text-muted-foreground">
                          {selectedProyecto.progreso_porcentaje || 0}% completado
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Editar Proyecto</Button>
                <Button variant="outline">Ver Time Tracking</Button>
                <Button variant="outline">Generar Factura</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Proyectos;