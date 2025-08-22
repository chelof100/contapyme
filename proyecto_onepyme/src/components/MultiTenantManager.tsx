import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { multiTenantService, ClientConfig } from '@/services/multiTenantService';
import { 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Save,
  RefreshCw,
  Globe,
  Shield,
  Zap,
  Database
} from 'lucide-react';

interface MultiTenantManagerProps {
  onClientChange?: (clientId: string) => void;
}

const MultiTenantManager: React.FC<MultiTenantManagerProps> = ({ onClientChange }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [currentClient, setCurrentClient] = useState<ClientConfig | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientConfig | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para formularios
  const [newClient, setNewClient] = useState({
    clientName: '',
    webhookPrefix: '/webhook/client-',
    baseUrl: '',
    apiKey: '',
    features: {
      facturacion: true,
      stock: true,
      pagos: true,
      alertas: true,
      recetas: true,
      crm: true,
      erp: true,
      monitoreo: true
    },
    settings: {
      timeout: 30000,
      retryAttempts: 3,
      rateLimiting: true,
      requestsPerMinute: 60
    }
  });

  const [editClient, setEditClient] = useState<Partial<ClientConfig>>({});

  useEffect(() => {
    loadClients();
    loadCurrentClient();
  }, []);

  const loadClients = async () => {
    try {
      const allClients = await multiTenantService.getAllClients();
      setClients(allClients);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    }
  };

  const loadCurrentClient = async () => {
    const current = multiTenantService.getCurrentClient();
    setCurrentClient(current);
  };

  const handleCreateClient = async () => {
    try {
      setLoading(true);
      await multiTenantService.createClient(newClient);
      
      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado exitosamente.",
      });

      setIsCreateDialogOpen(false);
      setNewClient({
        clientName: '',
        webhookPrefix: '/webhook/client-',
        baseUrl: '',
        apiKey: '',
        features: {
          facturacion: true,
          stock: true,
          pagos: true,
          alertas: true,
          recetas: true,
          crm: true,
          erp: true,
          monitoreo: true
        },
        settings: {
          timeout: 30000,
          retryAttempts: 3,
          rateLimiting: true,
          requestsPerMinute: 60
        }
      });
      
      loadClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      await multiTenantService.updateClient(selectedClient.clientId, editClient);
      
      toast({
        title: "Cliente actualizado",
        description: "El cliente se ha actualizado exitosamente.",
      });

      setIsEditDialogOpen(false);
      setSelectedClient(null);
      setEditClient({});
      
      loadClients();
      loadCurrentClient();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;

    try {
      await multiTenantService.deleteClient(clientId);
      
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado exitosamente.",
      });

      loadClients();
      loadCurrentClient();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    }
  };

  const handleSwitchClient = async (clientId: string) => {
    try {
      multiTenantService.setCurrentClient(clientId);
      loadCurrentClient();
      
      toast({
        title: "Cliente cambiado",
        description: "Has cambiado al cliente seleccionado.",
      });

      onClientChange?.(clientId);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar al cliente.",
        variant: "destructive",
      });
    }
  };

  const handleExportClient = async (clientId: string) => {
    try {
      const config = await multiTenantService.exportClientConfig(clientId);
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `client-${clientId}-config.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Configuración exportada",
        description: "La configuración se ha descargado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleImportClient = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const configData = e.target?.result as string;
        await multiTenantService.importClientConfig(configData);
        
        toast({
          title: "Cliente importado",
          description: "El cliente se ha importado exitosamente.",
        });

        loadClients();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo importar el cliente.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const openEditDialog = (client: ClientConfig) => {
    setSelectedClient(client);
    setEditClient(client);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión Multi-Tenant</h2>
          <p className="text-muted-foreground">
            Gestiona la configuración de múltiples clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadClients}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Cliente Actual */}
      {currentClient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Cliente Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{currentClient.clientName}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {currentClient.clientId} • Prefijo: {currentClient.webhookPrefix}
                </p>
                <p className="text-sm text-muted-foreground">
                  URL: {currentClient.baseUrl || 'No configurada'}
                </p>
              </div>
              <Badge variant="secondary">Activo</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Configurados
          </CardTitle>
          <CardDescription>
            Gestiona todos los clientes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Prefijo Webhook</TableHead>
                <TableHead>URL Base</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.clientId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.clientName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {client.clientId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {client.webhookPrefix}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {client.baseUrl || 'No configurada'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(client.features)
                        .filter(([, enabled]) => enabled)
                        .slice(0, 3)
                        .map(([feature]) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      {Object.values(client.features).filter(Boolean).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.values(client.features).filter(Boolean).length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {client.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {client.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {currentClient?.clientId !== client.clientId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSwitchClient(client.clientId)}
                        >
                          <Globe className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(client)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportClient(client.clientId)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {client.clientId !== 'client_1' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClient(client.clientId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Importar Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Cliente
          </CardTitle>
          <CardDescription>
            Importa la configuración de un cliente desde un archivo JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <label htmlFor="import-client" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Archivo
              </label>
            </Button>
            <input
              id="import-client"
              type="file"
              accept=".json"
              onChange={handleImportClient}
              className="hidden"
            />
            <span className="text-sm text-muted-foreground">
              Selecciona un archivo JSON con la configuración del cliente
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Crear Cliente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Configura un nuevo cliente para el sistema multi-tenant
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente *</Label>
                <Input
                  id="clientName"
                  value={newClient.clientName}
                  onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
                  placeholder="Ej: Empresa ABC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookPrefix">Prefijo de Webhook *</Label>
                <Input
                  id="webhookPrefix"
                  value={newClient.webhookPrefix}
                  onChange={(e) => setNewClient({...newClient, webhookPrefix: e.target.value})}
                  placeholder="/webhook/client-"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base de n8n *</Label>
                <Input
                  id="baseUrl"
                  value={newClient.baseUrl}
                  onChange={(e) => setNewClient({...newClient, baseUrl: e.target.value})}
                  placeholder="https://tu-instancia.n8n.cloud"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key (Opcional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={newClient.apiKey}
                  onChange={(e) => setNewClient({...newClient, apiKey: e.target.value})}
                  placeholder="••••••••••••••••••••••••••••••••"
                />
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(newClient.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setNewClient({
                        ...newClient,
                        features: { ...newClient.features, [key]: checked }
                      })}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={newClient.settings.timeout}
                    onChange={(e) => setNewClient({
                      ...newClient,
                      settings: { ...newClient.settings, timeout: parseInt(e.target.value) || 30000 }
                    })}
                    min="1000"
                    max="120000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Reintentos</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={newClient.settings.retryAttempts}
                    onChange={(e) => setNewClient({
                      ...newClient,
                      settings: { ...newClient.settings, retryAttempts: parseInt(e.target.value) || 3 }
                    })}
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Rate Limiting</Label>
                  <Switch
                    checked={newClient.settings.rateLimiting}
                    onCheckedChange={(checked) => setNewClient({
                      ...newClient,
                      settings: { ...newClient.settings, rateLimiting: checked }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestsPerMinute">Requests por Minuto</Label>
                  <Input
                    id="requestsPerMinute"
                    type="number"
                    value={newClient.settings.requestsPerMinute}
                    onChange={(e) => setNewClient({
                      ...newClient,
                      settings: { ...newClient.settings, requestsPerMinute: parseInt(e.target.value) || 60 }
                    })}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateClient} disabled={loading || !newClient.clientName}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Cliente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica la configuración del cliente seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editClientName">Nombre del Cliente *</Label>
                  <Input
                    id="editClientName"
                    value={editClient.clientName || selectedClient.clientName}
                    onChange={(e) => setEditClient({...editClient, clientName: e.target.value})}
                    placeholder="Ej: Empresa ABC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editWebhookPrefix">Prefijo de Webhook *</Label>
                  <Input
                    id="editWebhookPrefix"
                    value={editClient.webhookPrefix || selectedClient.webhookPrefix}
                    onChange={(e) => setEditClient({...editClient, webhookPrefix: e.target.value})}
                    placeholder="/webhook/client-"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editBaseUrl">URL Base de n8n *</Label>
                  <Input
                    id="editBaseUrl"
                    value={editClient.baseUrl || selectedClient.baseUrl}
                    onChange={(e) => setEditClient({...editClient, baseUrl: e.target.value})}
                    placeholder="https://tu-instancia.n8n.cloud"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editApiKey">API Key (Opcional)</Label>
                  <Input
                    id="editApiKey"
                    type="password"
                    value={editClient.apiKey || selectedClient.apiKey || ''}
                    onChange={(e) => setEditClient({...editClient, apiKey: e.target.value})}
                    placeholder="••••••••••••••••••••••••••••••••"
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="grid gap-4">
                  {Object.entries(selectedClient.features).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Switch
                        checked={editClient.features?.[key as keyof typeof editClient.features] ?? value}
                        onCheckedChange={(checked) => setEditClient({
                          ...editClient,
                          features: { 
                            ...selectedClient.features, 
                            ...editClient.features,
                            [key]: checked 
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTimeout">Timeout (ms)</Label>
                    <Input
                      id="editTimeout"
                      type="number"
                      value={editClient.settings?.timeout || selectedClient.settings.timeout}
                      onChange={(e) => setEditClient({
                        ...editClient,
                        settings: { 
                          ...selectedClient.settings, 
                          ...editClient.settings,
                          timeout: parseInt(e.target.value) || 30000 
                        }
                      })}
                      min="1000"
                      max="120000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRetryAttempts">Reintentos</Label>
                    <Input
                      id="editRetryAttempts"
                      type="number"
                      value={editClient.settings?.retryAttempts || selectedClient.settings.retryAttempts}
                      onChange={(e) => setEditClient({
                        ...editClient,
                        settings: { 
                          ...selectedClient.settings, 
                          ...editClient.settings,
                          retryAttempts: parseInt(e.target.value) || 3 
                        }
                      })}
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Rate Limiting</Label>
                    <Switch
                      checked={editClient.settings?.rateLimiting ?? selectedClient.settings.rateLimiting}
                      onCheckedChange={(checked) => setEditClient({
                        ...editClient,
                        settings: { 
                          ...selectedClient.settings, 
                          ...editClient.settings,
                          rateLimiting: checked 
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editRequestsPerMinute">Requests por Minuto</Label>
                    <Input
                      id="editRequestsPerMinute"
                      type="number"
                      value={editClient.settings?.requestsPerMinute || selectedClient.settings.requestsPerMinute}
                      onChange={(e) => setEditClient({
                        ...editClient,
                        settings: { 
                          ...selectedClient.settings, 
                          ...editClient.settings,
                          requestsPerMinute: parseInt(e.target.value) || 60 
                        }
                      })}
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Actualizando...' : 'Actualizar Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiTenantManager;
