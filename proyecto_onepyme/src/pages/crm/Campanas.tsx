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
import { useClientes } from '@/hooks/useSupabaseData';
import { webhookService } from '@/services/webhookService';
import { 
  Megaphone, 
  Plus, 
  Mail, 
  MessageSquare, 
  Users, 
  Send,
  Eye,
  Edit,
  BarChart3,
  Filter,
  Search,
  Target,
  Calendar,
  CheckCircle
} from 'lucide-react';

const Campanas = () => {
  const { data: clientes } = useClientes();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);

  const [campanaForm, setCampanaForm] = useState({
    nombre: '',
    tipo: 'email', // email, whatsapp, mixta
    asunto: '',
    mensaje: '',
    fecha_envio: '',
    segmentacion: 'todos', // todos, activos, vip, prospectos, custom
    clientes_custom: [] as string[]
  });

  // Datos simulados de campañas
  const campanas = [
    {
      id: '1',
      nombre: 'Promoción Fin de Año',
      tipo: 'email',
      estado: 'enviada',
      fecha_envio: '2024-12-15',
      destinatarios: 150,
      abiertos: 89,
      clicks: 23,
      conversiones: 5
    },
    {
      id: '2',
      nombre: 'Recordatorio Facturas Vencidas',
      tipo: 'whatsapp',
      estado: 'programada',
      fecha_envio: '2024-12-20',
      destinatarios: 25,
      abiertos: 0,
      clicks: 0,
      conversiones: 0
    },
    {
      id: '3',
      nombre: 'Newsletter Mensual',
      tipo: 'email',
      estado: 'borrador',
      fecha_envio: '',
      destinatarios: 0,
      abiertos: 0,
      clicks: 0,
      conversiones: 0
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campanaForm.nombre || !campanaForm.mensaje) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      // Determinar destinatarios según segmentación
      let destinatarios: string[] = [];
      
      switch (campanaForm.segmentacion) {
        case 'todos':
          destinatarios = clientes.map(c => c.id);
          break;
        case 'activos':
          destinatarios = clientes.filter(c => c.estado === 'activo').map(c => c.id);
          break;
        case 'vip':
          destinatarios = clientes.filter(c => c.categoria === 'VIP').map(c => c.id);
          break;
        case 'prospectos':
          destinatarios = clientes.filter(c => c.estado === 'prospecto').map(c => c.id);
          break;
        case 'custom':
          destinatarios = selectedClientes;
          break;
      }

      const campanaData = {
        ...campanaForm,
        destinatarios,
        total_destinatarios: destinatarios.length
      };

      // Enviar a n8n para procesamiento
      try {
        await webhookService.crearCampana(campanaData);
        toast.success(`Campaña "${campanaForm.nombre}" creada exitosamente`);
      } catch (webhookError) {
        console.warn('Error enviando a n8n:', webhookError);
        toast.success('Campaña creada (modo demo)');
      }
      
      // Limpiar formulario
      setCampanaForm({
        nombre: '',
        tipo: 'email',
        asunto: '',
        mensaje: '',
        fecha_envio: '',
        segmentacion: 'todos',
        clientes_custom: []
      });
      setSelectedClientes([]);
      setShowForm(false);

    } catch (error) {
      console.error('Error al crear campaña:', error);
      toast.error('Error al crear la campaña');
    } finally {
      setLoading(false);
    }
  };

  const enviarCampana = async (campanaId: string) => {
    try {
      await webhookService.enviarCampana({ campana_id: campanaId });
      toast.success('Campaña enviada exitosamente');
    } catch (error) {
      console.warn('Error enviando campaña:', error);
      toast.success('Campaña enviada (modo demo)');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'enviada': 'default',
      'programada': 'secondary',
      'borrador': 'outline'
    } as const;
    
    return <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>{estado}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const icons = {
      'email': <Mail className="h-3 w-3" />,
      'whatsapp': <MessageSquare className="h-3 w-3" />,
      'mixta': <Users className="h-3 w-3" />
    };
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {icons[tipo as keyof typeof icons]}
        {tipo}
      </Badge>
    );
  };

  const calcularTasaApertura = (abiertos: number, destinatarios: number) => {
    return destinatarios > 0 ? ((abiertos / destinatarios) * 100).toFixed(1) : '0';
  };

  const calcularTasaClick = (clicks: number, abiertos: number) => {
    return abiertos > 0 ? ((clicks / abiertos) * 100).toFixed(1) : '0';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campañas de Marketing</h1>
          <p className="mt-2 text-gray-600">Gestiona campañas de email y WhatsApp</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Campaña</DialogTitle>
              <DialogDescription>
                Configura una campaña de marketing para tus clientes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basico" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basico">Básico</TabsTrigger>
                  <TabsTrigger value="contenido">Contenido</TabsTrigger>
                  <TabsTrigger value="destinatarios">Destinatarios</TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Campaña *</Label>
                      <Input
                        id="nombre"
                        value={campanaForm.nombre}
                        onChange={(e) => setCampanaForm({...campanaForm, nombre: e.target.value})}
                        placeholder="Ej: Promoción Navideña 2024"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Campaña</Label>
                      <Select value={campanaForm.tipo} onValueChange={(value) => setCampanaForm({...campanaForm, tipo: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email Marketing</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                          <SelectItem value="mixta">Campaña Mixta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_envio">Fecha de Envío</Label>
                    <Input
                      id="fecha_envio"
                      type="datetime-local"
                      value={campanaForm.fecha_envio}
                      onChange={(e) => setCampanaForm({...campanaForm, fecha_envio: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dejar vacío para envío inmediato
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="contenido" className="space-y-4">
                  {(campanaForm.tipo === 'email' || campanaForm.tipo === 'mixta') && (
                    <div className="space-y-2">
                      <Label htmlFor="asunto">Asunto del Email</Label>
                      <Input
                        id="asunto"
                        value={campanaForm.asunto}
                        onChange={(e) => setCampanaForm({...campanaForm, asunto: e.target.value})}
                        placeholder="Asunto atractivo para el email"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="mensaje">Mensaje *</Label>
                    <Textarea
                      id="mensaje"
                      value={campanaForm.mensaje}
                      onChange={(e) => setCampanaForm({...campanaForm, mensaje: e.target.value})}
                      placeholder="Contenido del mensaje..."
                      rows={8}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Puedes usar variables: {'{nombre}'}, {'{empresa}'}, {'{email}'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="destinatarios" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="segmentacion">Segmentación</Label>
                    <Select value={campanaForm.segmentacion} onValueChange={(value) => setCampanaForm({...campanaForm, segmentacion: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los Clientes</SelectItem>
                        <SelectItem value="activos">Solo Clientes Activos</SelectItem>
                        <SelectItem value="vip">Solo Clientes VIP</SelectItem>
                        <SelectItem value="prospectos">Solo Prospectos</SelectItem>
                        <SelectItem value="custom">Selección Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {campanaForm.segmentacion === 'custom' && (
                    <div className="space-y-3">
                      <Label>Seleccionar Clientes</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                        {clientes.map((cliente) => (
                          <div key={cliente.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={cliente.id}
                              checked={selectedClientes.includes(cliente.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedClientes(prev => [...prev, cliente.id]);
                                } else {
                                  setSelectedClientes(prev => prev.filter(id => id !== cliente.id));
                                }
                              }}
                            />
                            <Label htmlFor={cliente.id} className="text-sm">
                              {cliente.razon_social} ({cliente.categoria})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Resumen de Destinatarios</p>
                    <p className="text-sm text-muted-foreground">
                      {campanaForm.segmentacion === 'todos' && `${clientes.length} clientes`}
                      {campanaForm.segmentacion === 'activos' && `${clientes.filter(c => c.estado === 'activo').length} clientes activos`}
                      {campanaForm.segmentacion === 'vip' && `${clientes.filter(c => c.categoria === 'VIP').length} clientes VIP`}
                      {campanaForm.segmentacion === 'prospectos' && `${clientes.filter(c => c.estado === 'prospecto').length} prospectos`}
                      {campanaForm.segmentacion === 'custom' && `${selectedClientes.length} clientes seleccionados`}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creando...' : 'Crear Campaña'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas de campañas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Megaphone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{campanas.length}</p>
                <p className="text-sm text-muted-foreground">Total Campañas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{campanas.filter(c => c.estado === 'enviada').length}</p>
                <p className="text-sm text-muted-foreground">Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {campanas.reduce((sum, c) => sum + c.abiertos, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Aperturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {campanas.reduce((sum, c) => sum + c.conversiones, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Conversiones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de campañas */}
      <Card>
        <CardHeader>
          <CardTitle>Campañas Creadas</CardTitle>
          <CardDescription>Historial y estado de tus campañas de marketing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campanas.map((campana) => (
              <Card key={campana.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{campana.nombre}</h4>
                        {getTipoBadge(campana.tipo)}
                        {getEstadoBadge(campana.estado)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Destinatarios</p>
                          <p className="font-medium">{campana.destinatarios}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tasa Apertura</p>
                          <p className="font-medium">
                            {calcularTasaApertura(campana.abiertos, campana.destinatarios)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tasa Click</p>
                          <p className="font-medium">
                            {calcularTasaClick(campana.clicks, campana.abiertos)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversiones</p>
                          <p className="font-medium">{campana.conversiones}</p>
                        </div>
                      </div>
                      
                      {campana.fecha_envio && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {campana.estado === 'programada' ? 'Programada para: ' : 'Enviada: '}
                          {new Date(campana.fecha_envio).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {campana.estado === 'borrador' && (
                        <Button 
                          size="sm" 
                          onClick={() => enviarCampana(campana.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campanas;