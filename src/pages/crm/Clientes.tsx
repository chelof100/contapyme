import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useClientes, useContactos, useInteracciones } from '@/hooks/useCRMData';
import { useFacturasEmitidas } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Download,
  Upload,
  Star,
  AlertCircle
} from 'lucide-react';

// Helper function to get badge components
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

const getPrioridadBadge = (prioridad: string) => {
  const variants = {
    'alta': 'destructive',
    'media': 'default',
    'baja': 'secondary'
  } as const;
  
  return <Badge variant={variants[prioridad as keyof typeof variants] || 'secondary'}>{prioridad}</Badge>;
};

const Clientes = () => {
  const { data: clientes, loading: loadingClientes, create: createCliente, update: updateCliente } = useClientes();
  const { data: facturas } = useFacturasEmitidas();
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    categoria: ''
  });

  const [clienteForm, setClienteForm] = useState({
    cuit: '',
    razon_social: '',
    nombre_fantasia: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    condicion_iva: 'Responsable Inscripto',
    categoria: 'Regular',
    estado: 'activo',
    notas: ''
  });

  const [loading, setLoading] = useState(false);

  const validateCUIT = (cuit: string) => {
    const regex = /^\d{11}$/;
    return regex.test(cuit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCUIT(clienteForm.cuit)) {
      toast.error('CUIT inválido. Debe tener 11 dígitos.');
      return;
    }

    if (!clienteForm.razon_social.trim()) {
      toast.error('La razón social es obligatoria.');
      return;
    }

    setLoading(true);

    try {
      const clienteData = {
        ...clienteForm,
        fecha_primera_compra: null,
        monto_total_compras: 0
      };

      const nuevoCliente = await createCliente(clienteData);
      
      if (nuevoCliente) {
        // Enviar a n8n para procesamiento adicional
        try {
          await webhookService.makeRequest('/webhook/crm-cliente-crear', {
            cliente_id: nuevoCliente.id,
            ...clienteData
          });
        } catch (webhookError) {
          console.warn('Error enviando a n8n, pero cliente guardado en Supabase:', webhookError);
        }

        toast.success(`Cliente ${clienteForm.razon_social} creado exitosamente`);
        
        // Limpiar formulario
        setClienteForm({
          cuit: '',
          razon_social: '',
          nombre_fantasia: '',
          email: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          provincia: '',
          codigo_postal: '',
          condicion_iva: 'Responsable Inscripto',
          categoria: 'Regular',
          estado: 'activo',
          notas: ''
        });
        setShowForm(false);
      }

    } catch (error) {
      console.error('Error al crear cliente:', error);
      toast.error('Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  const importarClientesDesdeFacturas = async () => {
    setLoading(true);
    
    try {
      const clientesExistentes = clientes.map(c => c.cuit);
      const clientesNuevos = [];

      // Extraer clientes únicos de facturas que no existen en CRM
      const clientesFacturas = facturas.reduce((acc: any[], factura) => {
        if (!clientesExistentes.includes(factura.cuit_cliente)) {
          const existeEnAcc = acc.find(c => c.cuit === factura.cuit_cliente);
          if (!existeEnAcc) {
            acc.push({
              cuit: factura.cuit_cliente,
              razon_social: factura.cliente_nombre,
              nombre_fantasia: factura.cliente_nombre,
              condicion_iva: factura.condicion_iva,
              categoria: 'Importado',
              estado: 'activo',
              fecha_primera_compra: factura.fecha_emision,
              monto_total_compras: 0
            });
          }
        }
        return acc;
      }, []);

      // Crear clientes en lotes
      for (const clienteData of clientesFacturas) {
        const nuevoCliente = await createCliente(clienteData);
        if (nuevoCliente) {
          clientesNuevos.push(nuevoCliente);
        }
      }

      // Enviar a n8n para procesamiento
      try {
        await webhookService.makeRequest('/webhook/crm-cliente-importar-facturas', {
          clientes_importados: clientesNuevos.length,
          clientes: clientesNuevos
        });
      } catch (webhookError) {
        console.warn('Error enviando a n8n:', webhookError);
      }

      toast.success(`${clientesNuevos.length} clientes importados desde facturas`);
      setShowImport(false);

    } catch (error) {
      console.error('Error al importar clientes:', error);
      toast.error('Error al importar clientes');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'activo': 'default',
      'inactivo': 'secondary',
      'prospecto': 'outline'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  const getCategoriaBadge = (categoria: string) => {
    const colors = {
      'VIP': 'bg-yellow-100 text-yellow-800',
      'Regular': 'bg-blue-100 text-blue-800',
      'Nuevo': 'bg-green-100 text-green-800',
      'Importado': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {categoria}
      </Badge>
    );
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const matchBusqueda = !filtros.busqueda || 
      cliente.razon_social.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cliente.cuit.includes(filtros.busqueda) ||
      (cliente.email && cliente.email.toLowerCase().includes(filtros.busqueda.toLowerCase()));
    
    const matchEstado = !filtros.estado || cliente.estado === filtros.estado;
    const matchCategoria = !filtros.categoria || cliente.categoria === filtros.categoria;
    
    return matchBusqueda && matchEstado && matchCategoria;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-2 text-gray-600">Administra tu cartera de clientes y prospectos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showImport} onOpenChange={setShowImport}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar desde Facturas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Clientes desde Facturas</DialogTitle>
                <DialogDescription>
                  Importa automáticamente clientes desde las facturas emitidas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Se importarán clientes que aparecen en facturas pero no están registrados en el CRM.
                </p>
                <div className="flex gap-2">
                  <Button onClick={importarClientesDesdeFacturas} disabled={loading} className="flex-1">
                    {loading ? 'Importando...' : 'Importar Clientes'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowImport(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  Registra un nuevo cliente en el CRM
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT *</Label>
                    <Input
                      id="cuit"
                      value={clienteForm.cuit}
                      onChange={(e) => setClienteForm({...clienteForm, cuit: e.target.value})}
                      placeholder="20304050607"
                      maxLength={11}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condicion_iva">Condición IVA</Label>
                    <Select value={clienteForm.condicion_iva} onValueChange={(value) => setClienteForm({...clienteForm, condicion_iva: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                        <SelectItem value="Monotributista">Monotributista</SelectItem>
                        <SelectItem value="Exento">Exento</SelectItem>
                        <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      value={clienteForm.razon_social}
                      onChange={(e) => setClienteForm({...clienteForm, razon_social: e.target.value})}
                      placeholder="Empresa SA"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre_fantasia">Nombre de Fantasía</Label>
                    <Input
                      id="nombre_fantasia"
                      value={clienteForm.nombre_fantasia}
                      onChange={(e) => setClienteForm({...clienteForm, nombre_fantasia: e.target.value})}
                      placeholder="Nombre comercial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clienteForm.email}
                      onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={clienteForm.telefono}
                      onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={clienteForm.categoria} onValueChange={(value) => setClienteForm({...clienteForm, categoria: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Nuevo">Nuevo</SelectItem>
                        <SelectItem value="Prospecto">Prospecto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={clienteForm.estado} onValueChange={(value) => setClienteForm({...clienteForm, estado: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="prospecto">Prospecto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={clienteForm.direccion}
                    onChange={(e) => setClienteForm({...clienteForm, direccion: e.target.value})}
                    placeholder="Dirección completa"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={clienteForm.ciudad}
                      onChange={(e) => setClienteForm({...clienteForm, ciudad: e.target.value})}
                      placeholder="Buenos Aires"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      value={clienteForm.provincia}
                      onChange={(e) => setClienteForm({...clienteForm, provincia: e.target.value})}
                      placeholder="CABA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input
                      id="codigo_postal"
                      value={clienteForm.codigo_postal}
                      onChange={(e) => setClienteForm({...clienteForm, codigo_postal: e.target.value})}
                      placeholder="1000"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={clienteForm.notas}
                    onChange={(e) => setClienteForm({...clienteForm, notas: e.target.value})}
                    placeholder="Notas adicionales sobre el cliente"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creando...' : 'Crear Cliente'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por razón social, CUIT o email..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtros.estado} onValueChange={(value) => setFiltros({...filtros, estado: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="prospecto">Prospecto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.categoria} onValueChange={(value) => setFiltros({...filtros, categoria: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Nuevo">Nuevo</SelectItem>
                <SelectItem value="Prospecto">Prospecto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{clientes.length}</p>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{clientes.filter(c => c.categoria === 'VIP').length}</p>
                <p className="text-sm text-muted-foreground">Clientes VIP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{clientes.filter(c => c.estado === 'activo').length}</p>
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
                <p className="text-2xl font-bold">{clientes.filter(c => c.estado === 'prospecto').length}</p>
                <p className="text-sm text-muted-foreground">Prospectos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {clientesFiltrados.length} de {clientes.length} clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loadingClientes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay clientes que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientesFiltrados.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cliente.razon_social}</div>
                            {cliente.nombre_fantasia && (
                              <div className="text-sm text-gray-500">{cliente.nombre_fantasia}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{cliente.cuit}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {cliente.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {cliente.email}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {cliente.telefono}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cliente.ciudad && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {cliente.ciudad}, {cliente.provincia}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getCategoriaBadge(cliente.categoria)}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(cliente.estado)}
                        </TableCell>
                        <TableCell>
                          {cliente.fecha_primera_compra ? (
                            <div className="text-sm">
                              {new Date(cliente.fecha_primera_compra).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin compras</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCliente(cliente)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
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

      {/* Modal de detalle del cliente */}
      {selectedCliente && (
        <ClienteDetailModal 
          cliente={selectedCliente} 
          onClose={() => setSelectedCliente(null)} 
        />
      )}
    </div>
  );
};

// Componente para el modal de detalle del cliente
const ClienteDetailModal = ({ cliente, onClose }: { cliente: any; onClose: () => void }) => {
  const { data: contactos } = useContactos(cliente.id);
  const { data: interacciones } = useInteracciones(cliente.id);
  const { data: facturas } = useFacturasEmitidas();
  
  const facturasCliente = facturas.filter(f => f.cuit_cliente === cliente.cuit);
  const totalFacturado = facturasCliente.reduce((sum, f) => sum + (f.total || 0), 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {cliente.razon_social}
          </DialogTitle>
          <DialogDescription>
            Vista completa del cliente - CUIT: {cliente.cuit}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
            <TabsTrigger value="facturas">Facturas</TabsTrigger>
            <TabsTrigger value="interacciones">Interacciones</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos Básicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Razón Social</Label>
                    <p className="text-sm">{cliente.razon_social}</p>
                  </div>
                  {cliente.nombre_fantasia && (
                    <div>
                      <Label className="text-sm font-medium">Nombre de Fantasía</Label>
                      <p className="text-sm">{cliente.nombre_fantasia}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">CUIT</Label>
                    <p className="text-sm font-mono">{cliente.cuit}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Condición IVA</Label>
                    <p className="text-sm">{cliente.condicion_iva}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cliente.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.direccion && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-sm">
                        <p>{cliente.direccion}</p>
                        {cliente.ciudad && (
                          <p className="text-gray-500">
                            {cliente.ciudad}, {cliente.provincia} {cliente.codigo_postal}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{facturasCliente.length}</p>
                    <p className="text-sm text-muted-foreground">Facturas Emitidas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ${totalFacturado.toLocaleString('es-AR')}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Facturado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      ${facturasCliente.length > 0 ? (totalFacturado / facturasCliente.length).toLocaleString('es-AR') : '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contactos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Contactos</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </div>
            
            {contactos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay contactos registrados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {contactos.map((contacto) => (
                  <Card key={contacto.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {contacto.nombre} {contacto.apellido}
                            {contacto.es_principal && (
                              <Badge variant="outline" className="ml-2">Principal</Badge>
                            )}
                          </h4>
                          {contacto.cargo && (
                            <p className="text-sm text-muted-foreground">{contacto.cargo}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            {contacto.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {contacto.email}
                              </div>
                            )}
                            {contacto.telefono && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {contacto.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="facturas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Historial de Facturas</h3>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
            
            {facturasCliente.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay facturas registradas</p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasCliente.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell className="font-mono">{factura.numero_factura}</TableCell>
                      <TableCell>{new Date(factura.fecha_emision).toLocaleDateString()}</TableCell>
                      <TableCell>{factura.tipo_comprobante}</TableCell>
                      <TableCell className="font-medium">
                        ${factura.total?.toLocaleString('es-AR') || '0'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={factura.estado === 'pagada' ? 'default' : 'secondary'}>
                          {factura.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="interacciones" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Historial de Interacciones</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Interacción
              </Button>
            </div>
            
            {interacciones.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay interacciones registradas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {interacciones.map((interaccion) => (
                  <Card key={interaccion.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{interaccion.tipo}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(interaccion.fecha_interaccion).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{interaccion.descripcion}</p>
                          {interaccion.resultado && (
                            <Badge variant="secondary" className="mt-2">
                              {interaccion.resultado}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Clientes;