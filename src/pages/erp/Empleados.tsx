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
import { toast } from 'sonner';
import { useEmpleados, useAsistencia } from '@/hooks/useERPData';
import { webhookService } from '@/services/webhookService';
import { 
  Users, 
  Plus, 
  Clock, 
  Calendar, 
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Settings,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const Empleados = () => {
  const { data: empleados, loading: loadingEmpleados, create: createEmpleado, update: updateEmpleado } = useEmpleados();
  const { data: asistencia, create: createAsistencia } = useAsistencia();
  const [showEmpleadoForm, setShowEmpleadoForm] = useState(false);
  const [showAsistenciaForm, setShowAsistenciaForm] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [empleadoForm, setEmpleadoForm] = useState({
    cuil: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    cargo: '',
    departamento: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    salario_basico: 0,
    tipo_contrato: 'planta_permanente',
    banco_cbu: '',
    obra_social: '',
    notas: ''
  });

  const [asistenciaForm, setAsistenciaForm] = useState({
    empleado_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_entrada: '',
    hora_salida: '',
    tipo: 'normal',
    justificacion: '',
    notas: ''
  });

  const validateCUIL = (cuil: string) => {
    const regex = /^\d{11}$/;
    return regex.test(cuil);
  };

  const handleEmpleadoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCUIL(empleadoForm.cuil)) {
      toast.error('CUIL inválido. Debe tener 11 dígitos.');
      return;
    }

    if (!empleadoForm.nombre || !empleadoForm.apellido || !empleadoForm.cargo) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const empleadoData = {
        ...empleadoForm,
        salario_basico: Number(empleadoForm.salario_basico),
        estado: 'activo' as const
      };

      const nuevoEmpleado = await createEmpleado(empleadoData);
      
      if (nuevoEmpleado) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/erp-empleado-crear', {
            empleado_id: nuevoEmpleado.id,
            ...empleadoData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success(`Empleado ${empleadoForm.nombre} ${empleadoForm.apellido} creado exitosamente`);
        
        // Limpiar formulario
        setEmpleadoForm({
          cuil: '',
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          direccion: '',
          fecha_nacimiento: '',
          cargo: '',
          departamento: '',
          fecha_ingreso: new Date().toISOString().split('T')[0],
          salario_basico: 0,
          tipo_contrato: 'planta_permanente',
          banco_cbu: '',
          obra_social: '',
          notas: ''
        });
        setShowEmpleadoForm(false);
      }

    } catch (error) {
      console.error('Error al crear empleado:', error);
      toast.error('Error al crear el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleAsistenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asistenciaForm.empleado_id || !asistenciaForm.hora_entrada) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      // Calcular horas trabajadas si hay hora de salida
      let horasTrabajadas = 0;
      if (asistenciaForm.hora_salida) {
        const entrada = new Date(`2000-01-01T${asistenciaForm.hora_entrada}`);
        const salida = new Date(`2000-01-01T${asistenciaForm.hora_salida}`);
        horasTrabajadas = (salida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
      }

      const asistenciaData = {
        empleado_id: asistenciaForm.empleado_id,
        fecha: asistenciaForm.fecha,
        hora_entrada: asistenciaForm.hora_entrada,
        hora_salida: asistenciaForm.hora_salida || null,
        horas_trabajadas: horasTrabajadas,
        tipo: asistenciaForm.tipo,
        justificacion: asistenciaForm.justificacion,
        notas: asistenciaForm.notas,
        aprobado: false
      };

      const nuevaAsistencia = await createAsistencia(asistenciaData);
      
      if (nuevaAsistencia) {
        // Enviar a n8n para procesamiento
        try {
          await webhookService.makeRequest('/webhook/erp-asistencia-registrar', {
            asistencia_id: nuevaAsistencia.id,
            ...asistenciaData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n:', webhookError);
        }

        toast.success('Asistencia registrada exitosamente');
        
        // Limpiar formulario
        setAsistenciaForm({
          empleado_id: '',
          fecha: new Date().toISOString().split('T')[0],
          hora_entrada: '',
          hora_salida: '',
          tipo: 'normal',
          justificacion: '',
          notas: ''
        });
        setShowAsistenciaForm(false);
      }

    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      toast.error('Error al registrar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'activo': 'default',
      'inactivo': 'secondary',
      'licencia': 'outline',
      'vacaciones': 'secondary'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  const getTipoContratoBadge = (tipo: string) => {
    const colors = {
      'planta_permanente': 'bg-green-100 text-green-800',
      'contrato': 'bg-blue-100 text-blue-800',
      'freelance': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {tipo.replace('_', ' ')}
      </Badge>
    );
  };

  const calcularMetricas = () => {
    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.estado === 'activo').length;
    const empleadosLicencia = empleados.filter(e => e.estado === 'licencia').length;
    const empleadosVacaciones = empleados.filter(e => e.estado === 'vacaciones').length;
    const masasSalariales = empleados.reduce((sum, e) => sum + (e.salario_basico || 0), 0);

    return {
      totalEmpleados,
      empleadosActivos,
      empleadosLicencia,
      empleadosVacaciones,
      masasSalariales
    };
  };

  const metricas = calcularMetricas();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
          <p className="mt-2 text-gray-600">Administra tu equipo y controla la asistencia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Nómina
          </Button>
          <Dialog open={showEmpleadoForm} onOpenChange={setShowEmpleadoForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
                <DialogDescription>
                  Completa la información del nuevo empleado
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEmpleadoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuil">CUIL *</Label>
                    <Input
                      id="cuil"
                      value={empleadoForm.cuil}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, cuil: e.target.value})}
                      placeholder="20304050607"
                      maxLength={11}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_contrato">Tipo de Contrato</Label>
                    <Select value={empleadoForm.tipo_contrato} onValueChange={(value) => setEmpleadoForm({...empleadoForm, tipo_contrato: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planta_permanente">Planta Permanente</SelectItem>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={empleadoForm.nombre}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, nombre: e.target.value})}
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={empleadoForm.apellido}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, apellido: e.target.value})}
                      placeholder="Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={empleadoForm.email}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, email: e.target.value})}
                      placeholder="juan.perez@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={empleadoForm.telefono}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, telefono: e.target.value})}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Input
                      id="cargo"
                      value={empleadoForm.cargo}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, cargo: e.target.value})}
                      placeholder="Desarrollador, Contador, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select value={empleadoForm.departamento} onValueChange={(value) => setEmpleadoForm({...empleadoForm, departamento: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administracion">Administración</SelectItem>
                        <SelectItem value="ventas">Ventas</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="tecnologia">Tecnología</SelectItem>
                        <SelectItem value="operaciones">Operaciones</SelectItem>
                        <SelectItem value="rrhh">Recursos Humanos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
                    <Input
                      id="fecha_ingreso"
                      type="date"
                      value={empleadoForm.fecha_ingreso}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, fecha_ingreso: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={empleadoForm.fecha_nacimiento}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, fecha_nacimiento: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salario_basico">Salario Básico</Label>
                    <Input
                      id="salario_basico"
                      type="number"
                      min="0"
                      step="0.01"
                      value={empleadoForm.salario_basico}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, salario_basico: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="obra_social">Obra Social</Label>
                    <Input
                      id="obra_social"
                      value={empleadoForm.obra_social}
                      onChange={(e) => setEmpleadoForm({...empleadoForm, obra_social: e.target.value})}
                      placeholder="OSDE, Swiss Medical, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={empleadoForm.direccion}
                    onChange={(e) => setEmpleadoForm({...empleadoForm, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banco_cbu">CBU Bancario</Label>
                  <Input
                    id="banco_cbu"
                    value={empleadoForm.banco_cbu}
                    onChange={(e) => setEmpleadoForm({...empleadoForm, banco_cbu: e.target.value})}
                    placeholder="CBU para transferencias"
                    maxLength={22}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={empleadoForm.notas}
                    onChange={(e) => setEmpleadoForm({...empleadoForm, notas: e.target.value})}
                    placeholder="Notas adicionales sobre el empleado"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creando...' : 'Crear Empleado'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEmpleadoForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Métricas de empleados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metricas.totalEmpleados}</p>
                <p className="text-sm text-muted-foreground">Total Empleados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metricas.empleadosActivos}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metricas.empleadosLicencia}</p>
                <p className="text-sm text-muted-foreground">En Licencia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">${metricas.masasSalariales.toLocaleString('es-AR')}</p>
                <p className="text-sm text-muted-foreground">Masa Salarial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="empleados" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="liquidaciones">Liquidaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="empleados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Empleados</CardTitle>
              <CardDescription>Gestiona la información de tu equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEmpleados ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando empleados...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>CUIL</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Tipo Contrato</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay empleados registrados. Registra tu primer empleado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      empleados.map((empleado) => (
                        <TableRow key={empleado.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{empleado.nombre} {empleado.apellido}</div>
                              <div className="text-sm text-gray-500">
                                Ingreso: {new Date(empleado.fecha_ingreso).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{empleado.cuil}</TableCell>
                          <TableCell className="font-medium">{empleado.cargo}</TableCell>
                          <TableCell>{empleado.departamento || '-'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {empleado.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {empleado.email}
                                </div>
                              )}
                              {empleado.telefono && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {empleado.telefono}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTipoContratoBadge(empleado.tipo_contrato)}
                          </TableCell>
                          <TableCell>
                            {getEstadoBadge(empleado.estado)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedEmpleado(empleado)}
                              >
                                Ver
                              </Button>
                              <Button size="sm" variant="outline">
                                Editar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Control de Asistencia</h3>
            <Dialog open={showAsistenciaForm} onOpenChange={setShowAsistenciaForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Asistencia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Asistencia</DialogTitle>
                  <DialogDescription>
                    Registra la entrada y salida de un empleado
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAsistenciaSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="empleado">Empleado *</Label>
                    <Select value={asistenciaForm.empleado_id} onValueChange={(value) => setAsistenciaForm({...asistenciaForm, empleado_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={asistenciaForm.fecha}
                        onChange={(e) => setAsistenciaForm({...asistenciaForm, fecha: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={asistenciaForm.tipo} onValueChange={(value) => setAsistenciaForm({...asistenciaForm, tipo: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="feriado">Feriado</SelectItem>
                          <SelectItem value="licencia">Licencia</SelectItem>
                          <SelectItem value="falta">Falta</SelectItem>
                          <SelectItem value="vacaciones">Vacaciones</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hora_entrada">Hora Entrada *</Label>
                      <Input
                        id="hora_entrada"
                        type="time"
                        value={asistenciaForm.hora_entrada}
                        onChange={(e) => setAsistenciaForm({...asistenciaForm, hora_entrada: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora_salida">Hora Salida</Label>
                      <Input
                        id="hora_salida"
                        type="time"
                        value={asistenciaForm.hora_salida}
                        onChange={(e) => setAsistenciaForm({...asistenciaForm, hora_salida: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="justificacion">Justificación</Label>
                    <Input
                      id="justificacion"
                      value={asistenciaForm.justificacion}
                      onChange={(e) => setAsistenciaForm({...asistenciaForm, justificacion: e.target.value})}
                      placeholder="Justificación para faltas o licencias"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Input
                      id="notas"
                      value={asistenciaForm.notas}
                      onChange={(e) => setAsistenciaForm({...asistenciaForm, notas: e.target.value})}
                      placeholder="Notas adicionales"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Registrando...' : 'Registrar Asistencia'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAsistenciaForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistencia.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay registros de asistencia. Registra la primera asistencia.
                      </TableCell>
                    </TableRow>
                  ) : (
                    asistencia.slice(0, 10).map((registro) => {
                      const empleado = empleados.find(e => e.id === registro.empleado_id);
                      return (
                        <TableRow key={registro.id}>
                          <TableCell>{new Date(registro.fecha).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Empleado no encontrado'}
                          </TableCell>
                          <TableCell>{registro.hora_entrada || '-'}</TableCell>
                          <TableCell>{registro.hora_salida || '-'}</TableCell>
                          <TableCell>{registro.horas_trabajadas?.toFixed(2) || '0'} hs</TableCell>
                          <TableCell>
                            <Badge variant={registro.tipo === 'normal' ? 'default' : 'secondary'}>
                              {registro.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={registro.aprobado ? 'default' : 'outline'}>
                              {registro.aprobado ? 'Aprobado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Editar
                            </Button>
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

        <TabsContent value="liquidaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liquidación de Sueldos</CardTitle>
              <CardDescription>Gestiona las liquidaciones mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Módulo de Liquidaciones</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidad de liquidación de sueldos próximamente disponible
                </p>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Liquidaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalle del empleado */}
      {selectedEmpleado && (
        <Dialog open={true} onOpenChange={() => setSelectedEmpleado(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedEmpleado.nombre} {selectedEmpleado.apellido}
              </DialogTitle>
              <DialogDescription>
                Información completa del empleado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">CUIL</Label>
                      <p className="text-sm font-mono">{selectedEmpleado.cuil}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Fecha de Nacimiento</Label>
                      <p className="text-sm">
                        {selectedEmpleado.fecha_nacimiento ? 
                          new Date(selectedEmpleado.fecha_nacimiento).toLocaleDateString() : 
                          'No especificada'
                        }
                      </p>
                    </div>
                    {selectedEmpleado.direccion && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <p>{selectedEmpleado.direccion}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Laboral</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Cargo</Label>
                      <p className="text-sm">{selectedEmpleado.cargo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Departamento</Label>
                      <p className="text-sm">{selectedEmpleado.departamento || 'No asignado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Fecha de Ingreso</Label>
                      <p className="text-sm">{new Date(selectedEmpleado.fecha_ingreso).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Salario Básico</Label>
                      <p className="text-sm font-medium">${selectedEmpleado.salario_basico?.toLocaleString('es-AR') || '0'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Editar Empleado</Button>
                <Button variant="outline">Ver Asistencia</Button>
                <Button variant="outline">Generar Liquidación</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Empleados;