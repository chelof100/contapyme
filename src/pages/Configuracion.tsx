import React, { useState, useEffect } from 'react';
import { configurationService, ConfigurationBackup, ConfigurationChange, ConnectivityTest, TestStats } from '@/services/configurationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useConfig } from '../contexts/ConfigContext';
import { useAppConfig } from '@/hooks/useConfig';
import DeveloperConfigGuard from '@/components/DeveloperConfigGuard';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { StatusIndicator, MultiServiceStatus } from '@/components/ui/StatusIndicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { afipValidationService } from '@/services/afipValidationService';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Zap, 
  Database, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  User,
  Lock,
  Code,
  Webhook,
  Save,
  Copy,
  Download,
  Upload,
  Activity,
  Trash2,
  History,
  RotateCcw,
  Play,
  Clock,
  Wifi,
  FileText,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Configuracion = () => {
  const { recetasEnabled, setRecetasEnabled } = useConfig();
  const { config, updateConfig, updateN8nConfig, updateFeatures, isLoading, updateSection } = useAppConfig();
  const { 
    healthStatus, 
    history, 
    loading: healthLoading,
    error,
    isRunning,
    runManualCheck
  } = useHealthCheck();
  
  // Estados para configuración de webhooks
  const [webhookConfig, setWebhookConfig] = useState(() => {
    const saved = localStorage.getItem('webhook-endpoints');
    return saved ? JSON.parse(saved) : {
      baseUrl: config.api.n8n.baseUrl || '',
      endpoints: {
        healthCheck: '/webhook/health-check',
        facturaEmision: '/webhook/factura-emision',
        facturaRecepcion: '/webhook/factura-recepcion',
        ordenCompra: '/webhook/orden-compra',
        ordenRecepcion: '/webhook/orden-recepcion',
        pago: '/webhook/pago',
        stockMovimiento: '/webhook/stock-movimiento',
        stockAlerta: '/webhook/stock-alerta',
        recetaCreacion: '/webhook/receta-creacion',
        recetaVenta: '/webhook/receta-venta'
      },
      timeout: config.api.n8n.timeout || 30000,
      retryAttempts: config.api.n8n.retryAttempts || 3,
      apiKey: config.api.n8n.apiKey || ''
    };
  });

  // Estados para otras configuraciones
  const [features, setFeatures] = useState(config.features);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para gestión de configuraciones
  const [backups, setBackups] = useState<ConfigurationBackup[]>([]);
  const [configHistory, setConfigHistory] = useState<ConfigurationChange[]>([]);
  const [connectivityTests, setConnectivityTests] = useState<ConnectivityTest[]>([]);
  const [testStats, setTestStats] = useState<TestStats[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [testingConnections, setTestingConnections] = useState(false);

  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      const [
        backupsData,
        historyData,
        testsData,
        statsData,
        validation
      ] = await Promise.all([
        configurationService.getBackups(),
        configurationService.getConfigurationHistory(),
        configurationService.getRecentTests(20),
        configurationService.getTestStats(24),
        configurationService.validateCurrentConfiguration()
      ]);
      
      setBackups(backupsData);
      setConfigHistory(historyData);
      setConnectivityTests(testsData);
      setTestStats(statsData);
      setValidationResult(validation);
    } catch (error) {
      console.error('Error loading configuration data:', error);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error('El nombre del backup es requerido');
      return;
    }
    
    try {
      await configurationService.createBackup(
        backupName,
        'manual',
        backupDescription
      );
      setBackupName('');
      setBackupDescription('');
      await loadConfigurationData();
      toast.success('Backup creado exitosamente');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear backup');
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (confirm('¿Estás seguro de que quieres restaurar esta configuración?')) {
      try {
        await configurationService.restoreFromBackup(backupId, 'Restauración manual desde interfaz');
        await loadConfigurationData();
        toast.success('Configuración restaurada exitosamente');
      } catch (error) {
        console.error('Error restoring backup:', error);
        toast.error('Error al restaurar backup');
      }
    }
  };

  const handleExportBackup = (backup: ConfigurationBackup) => {
    const blob = new Blob([JSON.stringify(backup.configuration_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.backup_name}-${new Date(backup.created_at).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup exportado exitosamente');
  };

  const handleImportFromText = async () => {
    if (!importData.trim()) {
      toast.error('Pega el JSON de configuración');
      return;
    }
    
    try {
      await configurationService.importConfiguration(importData);
      setImportData('');
      setShowImportDialog(false);
      await loadConfigurationData();
      toast.success('Configuración importada exitosamente');
    } catch (error) {
      console.error('Error importing configuration:', error);
      toast.error('Error al importar configuración');
    }
  };

  const handleTestAllEndpoints = async () => {
    setTestingConnections(true);
    try {
      await configurationService.testAllEndpoints();
      await loadConfigurationData();
      toast.success('Tests completados');
    } catch (error) {
      console.error('Error testing endpoints:', error);
      toast.error('Error en los tests');
    } finally {
      setTestingConnections(false);
    }
  };

  const handleTestSingle = async (testType: string) => {
    setTestingConnections(true);
    try {
      let endpointUrl = '';
      
      switch (testType) {
        case 'n8n_health':
          endpointUrl = `${config.api.n8n.baseUrl}/webhook/health-check`;
          break;
        case 'afip_connection':
          endpointUrl = `${config.api.n8n.baseUrl}/webhook/afip-health-check`;
          break;
        case 'supabase_connection':
          endpointUrl = `${config.api.supabase.url}/rest/v1/`;
          break;
      }
      
      if (endpointUrl) {
        await configurationService.testConnectivity(testType, endpointUrl);
        await loadConfigurationData();
        toast.success(`Test ${testType} completado`);
      }
    } catch (error) {
      console.error('Error testing single endpoint:', error);
      toast.error(`Error en test ${testType}`);
    } finally {
      setTestingConnections(false);
    }
  };

  const handleSaveWebhookConfig = async () => {
    try {
      // Guardar en localStorage para desarrollo
      localStorage.setItem('webhook-endpoints', JSON.stringify(webhookConfig));
      
      // Actualizar configuración global
      await updateN8nConfig({
        baseUrl: webhookConfig.baseUrl,
        timeout: webhookConfig.timeout,
        retryAttempts: webhookConfig.retryAttempts,
        apiKey: webhookConfig.apiKey
      });
      
      toast.success('Configuración de webhooks guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar configuración de webhooks');
    }
  };

  const handleTestWebhook = async (endpoint: string) => {
    try {
      const testUrl = `${webhookConfig.baseUrl}${endpoint}`;
      
      toast.info(`Probando webhook: ${endpoint}`, {
        description: `URL: ${testUrl}`
      });
      
      // En desarrollo, simular test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Webhook ${endpoint} configurado correctamente`, {
        description: 'Listo para recibir datos desde el frontend'
      });
    } catch (error) {
      toast.error(`Error probando webhook ${endpoint}`);
    }
  };

  const handleSaveFeatures = async () => {
    try {
      await updateFeatures(features);
      toast.success('Características actualizadas exitosamente');
    } catch (error) {
      toast.error('Error al actualizar características');
    }
  };

  const handleChangePassword = () => {
    if (!passwordChange.currentPassword || !passwordChange.newPassword || !passwordChange.confirmPassword) {
      toast.error('Complete todos los campos');
      return;
    }

    const currentSaved = localStorage.getItem('developer-password') || 'admin123';
    if (passwordChange.currentPassword !== currentSaved) {
      toast.error('Contraseña actual incorrecta');
      return;
    }

    if (passwordChange.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    localStorage.setItem('developer-password', passwordChange.newPassword);
    toast.success('Contraseña de desarrollador actualizada exitosamente');
    setShowPasswordDialog(false);
    setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const exportWebhookConfig = () => {
    const configToExport = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      webhooks: webhookConfig
    };
    
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contapyme-webhooks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Configuración de webhooks exportada');
  };

  const importWebhookConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.webhooks) {
          setWebhookConfig(imported.webhooks);
          toast.success('Configuración de webhooks importada');
        } else {
          toast.error('Archivo de configuración inválido');
        }
      } catch (error) {
        toast.error('Error al importar configuración');
      }
    };
    reader.readAsText(file);
  };

  const copyWebhookUrl = (endpoint: string) => {
    const fullUrl = `${webhookConfig.baseUrl}${endpoint}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL copiada al portapapeles');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">Configura las opciones del sistema</p>
      </div>

      {/* Alertas de Validación */}
      {validationResult && !validationResult.isValid && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Problemas de Configuración Detectados:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationResult.issues.map((issue: string, index: number) => (
                  <li key={index} className="text-red-600">{issue}</li>
                ))}
              </ul>
              {validationResult.warnings.length > 0 && (
                <>
                  <p className="font-medium mt-3">Advertencias:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationResult.warnings.map((warning: string, index: number) => (
                      <li key={index} className="text-orange-600">{warning}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Características</TabsTrigger>
          <TabsTrigger value="ui">Interfaz</TabsTrigger>
          <TabsTrigger value="afip">AFIP</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="developer">Desarrollador</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración General
                </CardTitle>
                <CardDescription>
                  Configuraciones básicas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Módulo de Recetas</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita funcionalidades para restaurantes y bares
                    </p>
                  </div>
                  <Switch
                    checked={recetasEnabled}
                    onCheckedChange={setRecetasEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Características del Sistema
              </CardTitle>
              <CardDescription>
                Habilita o deshabilita funcionalidades específicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Alertas de Stock</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones automáticas cuando el stock está bajo
                    </p>
                  </div>
                  <Switch
                    checked={features.stockAlertsEnabled}
                    onCheckedChange={(checked) => setFeatures({...features, stockAlertsEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Mercado Pago</Label>
                    <p className="text-sm text-muted-foreground">
                      Integración con gateway de pagos Mercado Pago
                    </p>
                  </div>
                  <Switch
                    checked={features.mercadoPagoEnabled}
                    onCheckedChange={(checked) => setFeatures({...features, mercadoPagoEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Soporte Offline</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite trabajar sin conexión y sincronizar después
                    </p>
                  </div>
                  <Switch
                    checked={features.offlineSupport}
                    onCheckedChange={(checked) => setFeatures({...features, offlineSupport: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sincronización en Tiempo Real</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronización automática con n8n en tiempo real
                    </p>
                  </div>
                  <Switch
                    checked={features.realTimeSync}
                    onCheckedChange={(checked) => setFeatures({...features, realTimeSync: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Procesamiento por Lotes</Label>
                    <p className="text-sm text-muted-foreground">
                      Agrupa operaciones para mejor rendimiento
                    </p>
                  </div>
                  <Switch
                    checked={features.batchProcessing}
                    onCheckedChange={(checked) => setFeatures({...features, batchProcessing: checked})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveFeatures} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Características'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configuración de Interfaz
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia y comportamiento de la interfaz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Tema de la Aplicación</Label>
                    <p className="text-sm text-muted-foreground">
                      Selecciona el tema visual de la aplicación
                    </p>
                  </div>
                  <Select value={config.ui.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => 
                    updateSection('ui', { theme: value })
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Idioma</Label>
                    <p className="text-sm text-muted-foreground">
                      Idioma de la interfaz de usuario
                    </p>
                  </div>
                  <Select value={config.ui.language} onValueChange={(value: 'es' | 'en') => 
                    updateSection('ui', { language: value })
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Formato de Fecha</Label>
                    <p className="text-sm text-muted-foreground">
                      Formato para mostrar fechas
                    </p>
                  </div>
                  <Select value={config.ui.dateFormat} onValueChange={(value) => 
                    updateSection('ui', { dateFormat: value })
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Elementos por Página</Label>
                    <p className="text-sm text-muted-foreground">
                      Cantidad de elementos en tablas y listas
                    </p>
                  </div>
                  <Select value={config.ui.itemsPerPage.toString()} onValueChange={(value) => 
                    updateSection('ui', { itemsPerPage: parseInt(value) })
                  }>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Autoguardado</Label>
                    <p className="text-sm text-muted-foreground">
                      Intervalo de autoguardado en formularios (segundos)
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="10"
                    max="300"
                    value={config.ui.autoSaveInterval / 1000}
                    onChange={(e) => updateSection('ui', { 
                      autoSaveInterval: (parseInt(e.target.value) || 30) * 1000 
                    })}
                    className="w-20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Duración de Notificaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Tiempo que permanecen visibles las notificaciones (segundos)
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="2"
                    max="30"
                    value={config.ui.notificationDuration / 1000}
                    onChange={(e) => updateSection('ui', { 
                      notificationDuration: (parseInt(e.target.value) || 5) * 1000 
                    })}
                    className="w-20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Características Avanzadas</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar opciones avanzadas en la interfaz
                    </p>
                  </div>
                  <Switch
                    checked={config.ui.showAdvancedFeatures}
                    onCheckedChange={(checked) => updateSection('ui', { showAdvancedFeatures: checked })}
                  />
                </div>
              </div>

              <Button onClick={() => toast.success('Configuración de interfaz guardada')} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración de Interfaz
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="afip" className="space-y-6">
          <AFIPConfigSection />
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            {/* Estado General del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Estado del Sistema
                </CardTitle>
                <CardDescription>
                  Monitoreo en tiempo real de la salud del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Estado General</h3>
                    <p className="text-sm text-muted-foreground">
                      Verificación automática cada 5 minutos
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusIndicator
                      status={healthStatus ? 'healthy' : 'unhealthy'}
                      label={healthStatus ? 'Sistema Saludable' : 'Problemas Detectados'}
                      variant="badge"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={runManualCheck}
                      disabled={healthLoading}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", healthLoading && "animate-spin")} />
                      {healthLoading ? 'Verificando...' : 'Verificar Ahora'}
                    </Button>
                  </div>
                </div>

                {/* Servicios Monitoreados */}
                <div className="space-y-4">
                  <h4 className="font-medium">Servicios Monitoreados</h4>
                  <MultiServiceStatus
                    services={[
                      { name: 'Supabase', status: healthStatus ? 'healthy' : 'unhealthy', responseTime: 0, error: error },
                      { name: 'n8n', status: healthStatus ? 'healthy' : 'unhealthy', responseTime: 0, error: error },
                      { name: 'AFIP', status: 'unknown', responseTime: 0, error: null },
                      { name: 'Mercado Pago', status: 'unknown', responseTime: 0, error: null }
                    ]}
                    showDetails={true}
                  />
                </div>

                {/* Métricas del Sistema */}
                {history.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Métricas de las Últimas 24 Horas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">{history.length}</div>
                        <div className="text-sm text-muted-foreground">Verificaciones</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{healthStatus ? '100' : '0'}%</div>
                        <div className="text-sm text-muted-foreground">Disponibilidad</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{history[0]?.response_time_ms?.toFixed(0) || 'N/A'}ms</div>
                        <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">{error ? '1' : '0'}</div>
                        <div className="text-sm text-muted-foreground">Fallos</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuración de Monitoreo */}
                <div className="space-y-4">
                  <h4 className="font-medium">Configuración de Monitoreo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Intervalo de Verificación</Label>
                      <Select defaultValue="5">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minuto</SelectItem>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="10">10 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout de Requests</Label>
                      <Select defaultValue="10">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 segundos</SelectItem>
                          <SelectItem value="10">10 segundos</SelectItem>
                          <SelectItem value="30">30 segundos</SelectItem>
                          <SelectItem value="60">60 segundos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Health Check Automático:</strong> El sistema verifica automáticamente la conectividad 
                    con n8n y Supabase cada 5 minutos. Si detecta 3 fallos consecutivos, mostrará alertas visuales.
                    <br /><br />
                    <strong>Datos almacenados:</strong> Se mantiene un historial de las últimas 24 horas para análisis.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Historial de Health Checks */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Verificaciones</CardTitle>
                <CardDescription>
                  Últimas verificaciones de salud del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.slice(0, 10).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusIndicator
                          status={result.status}
                          variant="dot"
                          size="sm"
                        />
                        <div>
                          <span className="font-medium">{result.service}</span>
                          <p className="text-sm text-muted-foreground">
                            {result.last_check ? new Date(result.last_check).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {result.response_time_ms || 'N/A'}ms
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-600">
                            {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {history.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay verificaciones registradas aún</p>
                      <p className="text-sm">Las verificaciones comenzarán automáticamente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crear Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Crear Backup
                </CardTitle>
                <CardDescription>
                  Guarda la configuración actual del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Nombre del Backup</Label>
                  <Input
                    id="backup-name"
                    placeholder="Ej: Configuración Producción"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-description">Descripción</Label>
                  <Textarea
                    id="backup-description"
                    placeholder="Describe los cambios o el propósito de este backup"
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreateBackup} 
                  disabled={isLoading || !backupName.trim()}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creando...' : 'Crear Backup'}
                </Button>
              </CardContent>
            </Card>

            {/* Import/Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import/Export
                </CardTitle>
                <CardDescription>
                  Importa o exporta configuraciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={exportWebhookConfig}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importar Configuración</DialogTitle>
                        <DialogDescription>
                          Pega el JSON de configuración para importar
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Pega aquí el JSON de configuración..."
                          value={importData}
                          onChange={(e) => setImportData(e.target.value)}
                          rows={10}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleImportFromText} 
                            disabled={!importData.trim()}
                            className="flex-1"
                          >
                            Importar
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowImportDialog(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">o</span>
                </div>
                
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importWebhookConfig}
                    className="hidden"
                    id="import-file"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('import-file')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar desde Archivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Backups */}
          <Card>
            <CardHeader>
              <CardTitle>Backups Disponibles</CardTitle>
              <CardDescription>
                {backups.length} backups guardados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay backups disponibles. Crea tu primer backup.
                      </TableCell>
                    </TableRow>
                  ) : (
                    backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">{backup.backup_name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            backup.backup_type === 'manual' ? 'default' :
                            backup.backup_type === 'automatic' ? 'secondary' : 'outline'
                          }>
                            {backup.backup_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {backup.description || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(backup.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreBackup(backup.id)}
                              disabled={isLoading}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportBackup(backup)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Cambios
              </CardTitle>
              <CardDescription>
                Registro de todos los cambios de configuración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Configuración</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay cambios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    configHistory.slice(0, 20).map((change) => (
                      <TableRow key={change.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(change.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{change.configuration_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{change.configuration_name}</TableCell>
                        <TableCell>
                          {change.is_rollback ? (
                            <Badge className="bg-orange-100 text-orange-800">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Rollback
                            </Badge>
                          ) : (
                            <Badge variant="default">Cambio</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {change.change_reason || '-'}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer">
          <DeveloperConfigGuard>
            <div className="space-y-6">
              {/* Gestión de Contraseña de Desarrollador */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Gestión de Acceso de Desarrollador
                  </CardTitle>
                  <CardDescription>
                    Administra la contraseña de acceso a configuraciones avanzadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Contraseña de Desarrollador</p>
                      <p className="text-sm text-muted-foreground">
                        Controla el acceso a configuraciones técnicas sensibles
                      </p>
                    </div>
                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Key className="h-4 w-4 mr-2" />
                          Cambiar Contraseña
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cambiar Contraseña de Desarrollador</DialogTitle>
                          <DialogDescription>
                            Actualiza la contraseña para acceder a configuraciones avanzadas
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current_password">Contraseña Actual</Label>
                            <Input
                              id="current_password"
                              type="password"
                              value={passwordChange.currentPassword}
                              onChange={(e) => setPasswordChange({...passwordChange, currentPassword: e.target.value})}
                              placeholder="Contraseña actual"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new_password">Nueva Contraseña</Label>
                            <Input
                              id="new_password"
                              type="password"
                              value={passwordChange.newPassword}
                              onChange={(e) => setPasswordChange({...passwordChange, newPassword: e.target.value})}
                              placeholder="Nueva contraseña (mín. 8 caracteres)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                            <Input
                              id="confirm_password"
                              type="password"
                              value={passwordChange.confirmPassword}
                              onChange={(e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value})}
                              placeholder="Confirmar nueva contraseña"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleChangePassword} className="flex-1">
                              Cambiar Contraseña
                            </Button>
                            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de Webhooks para n8n */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Configuración de Webhooks n8n
                  </CardTitle>
                  <CardDescription>
                    Configura los endpoints de webhooks para la integración con n8n
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Configuración base */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook_base_url">URL Base de n8n *</Label>
                      <Input
                        id="webhook_base_url"
                        value={webhookConfig.baseUrl}
                        onChange={(e) => setWebhookConfig({...webhookConfig, baseUrl: e.target.value})}
                        placeholder="https://tu-instancia.n8n.cloud"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        URL completa de tu instancia de n8n
                      </p>
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="webhook_api_key">API Key de n8n (Opcional)</Label>
                      <Input
                        id="webhook_api_key"
                        type="password"
                        value={webhookConfig.apiKey}
                        onChange={(e) => setWebhookConfig({...webhookConfig, apiKey: e.target.value})}
                        placeholder="••••••••••••••••••••••••••••••••"
                      />
                      <p className="text-xs text-muted-foreground">
                        Para autenticación adicional en webhooks (opcional)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhook_timeout">Timeout (ms)</Label>
                        <Input
                          id="webhook_timeout"
                          type="number"
                          value={webhookConfig.timeout}
                          onChange={(e) => setWebhookConfig({...webhookConfig, timeout: parseInt(e.target.value) || 30000})}
                          min="5000"
                          max="120000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook_retries">Reintentos</Label>
                        <Input
                          id="webhook_retries"
                          type="number"
                          value={webhookConfig.retryAttempts}
                          onChange={(e) => setWebhookConfig({...webhookConfig, retryAttempts: parseInt(e.target.value) || 3})}
                          min="0"
                          max="10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Endpoints */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Endpoints de Webhooks</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportWebhookConfig}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <label htmlFor="import-config" className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                          </label>
                        </Button>
                        <input
                          id="import-config"
                          type="file"
                          accept=".json"
                          onChange={importWebhookConfig}
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-3">
                      {Object.entries(webhookConfig.endpoints).map(([key, endpoint]) => (
                        <div key={key} className="flex items-center gap-2 p-3 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <Input
                              value={endpoint}
                              onChange={(e) => setWebhookConfig({
                                ...webhookConfig,
                                endpoints: { ...webhookConfig.endpoints, [key]: e.target.value }
                              })}
                              placeholder="/webhook/endpoint"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyWebhookUrl(endpoint)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTestWebhook(endpoint)}
                            >
                              <Code className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveWebhookConfig} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Guardando...' : 'Guardar Configuración de Webhooks'}
                  </Button>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Importante:</strong> Los webhooks deben estar configurados en tu instancia de n8n 
                      para recibir los datos del frontend. Cada endpoint debe corresponder a un workflow específico.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Información de Integración */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Información de Integración
                  </CardTitle>
                  <CardDescription>
                    Detalles técnicos para el desarrollo del backend
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Estructura de Datos Esperada</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Todos los webhooks esperan recibir datos en formato JSON con la siguiente estructura:
                      </p>
                      <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "data": { /* datos específicos del endpoint */ },
  "metadata": {
    "requestId": "uuid",
    "timestamp": "ISO string",
    "source": "ContaPYME-Frontend",
    "version": "1.0.0"
  }
}`}
                      </pre>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Respuesta Esperada</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Los webhooks deben responder con:
                      </p>
                      <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`{
  "success": true,
  "data": { /* datos de respuesta */ },
  "executionId": "n8n-execution-id",
  "timestamp": "ISO string"
}`}
                      </pre>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p><strong>Nota:</strong> En desarrollo, los webhooks pueden devolver datos simulados.</p>
                      <p><strong>Timeout configurado:</strong> {webhookConfig.timeout}ms</p>
                      <p><strong>Reintentos:</strong> {webhookConfig.retryAttempts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de Supabase */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Configuración de Supabase
                  </CardTitle>
                  <CardDescription>
                    Configuración de la base de datos y autenticación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Configuración de Email:</strong> Para que funcione el registro de usuarios, 
                      debes configurar el proveedor de email en Supabase Dashboard → Authentication → Email Templates.
                      <br /><br />
                      <strong>Pasos:</strong>
                      <br />1. Ve a tu proyecto Supabase
                      <br />2. Authentication → Settings → SMTP Settings
                      <br />3. Configura tu proveedor de email (Gmail, SendGrid, etc.)
                      <br />4. O deshabilita la confirmación de email para testing
                      <br /><br />
                      <strong>⚠️ PROBLEMA ACTUAL:</strong> Si no puedes acceder al sistema:
                      <br />1. Ve a Supabase Dashboard → Authentication → Settings
                      <br />2. Desactiva "Enable email confirmations" 
                      <br />3. Los usuarios se registrarán sin confirmación de email
                      <br />4. Podrás iniciar sesión inmediatamente
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cuidado:</strong> Cambiar estas configuraciones puede afectar la conectividad 
                      con la base de datos. Solo modifica si sabes lo que estás haciendo.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="supabase_url">URL de Supabase</Label>
                      <Input
                        id="supabase_url"
                        value={config.api.supabase.url}
                        onChange={(e) => updateSection('api', {
                          ...config.api,
                          supabase: { ...config.api.supabase, url: e.target.value }
                        })}
                        placeholder="https://tu-proyecto.supabase.co"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL de tu proyecto de Supabase
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supabase_anon_key">Anon Key</Label>
                      <Input
                        id="supabase_anon_key"
                        type="password"
                        value={config.api.supabase.anonKey}
                        onChange={(e) => updateSection('api', {
                          ...config.api,
                          supabase: { ...config.api.supabase, anonKey: e.target.value }
                        })}
                        placeholder="••••••••••••••••••••••••••••••••"
                      />
                      <p className="text-xs text-muted-foreground">
                        Clave pública para acceso a Supabase
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supabase_service_key">Service Role Key (Opcional)</Label>
                      <Input
                        id="supabase_service_key"
                        type="password"
                        value={config.api.supabase.serviceRoleKey || ''}
                        onChange={(e) => updateSection('api', {
                          ...config.api,
                          supabase: { ...config.api.supabase, serviceRoleKey: e.target.value }
                        })}
                        placeholder="••••••••••••••••••••••••••••••••"
                      />
                      <p className="text-xs text-muted-foreground">
                        Clave de servicio para operaciones administrativas
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max_connections">Máximo de Conexiones</Label>
                        <Input
                          id="max_connections"
                          type="number"
                          min="1"
                          max="100"
                          value={config.api.supabase.maxConnections}
                          onChange={(e) => updateSection('api', {
                            ...config.api,
                            supabase: { ...config.api.supabase, maxConnections: parseInt(e.target.value) || 10 }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="connection_timeout">Timeout de Conexión (ms)</Label>
                        <Input
                          id="connection_timeout"
                          type="number"
                          min="1000"
                          max="60000"
                          value={config.api.supabase.connectionTimeout}
                          onChange={(e) => updateSection('api', {
                            ...config.api,
                            supabase: { ...config.api.supabase, connectionTimeout: parseInt(e.target.value) || 10000 }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Estado de la Conexión</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Base de Datos</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Conectado</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Autenticación</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Activa</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">RLS</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Habilitado</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Configuración de Email</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Para Testing Rápido</h5>
                      <p className="text-sm text-blue-800 mb-3">
                        Si quieres probar el registro sin configurar email:
                      </p>
                      <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Ve a Supabase Dashboard → Authentication → Settings</li>
                        <li>2. Desactiva "Enable email confirmations"</li>
                        <li>3. Los usuarios se crearán automáticamente sin confirmación</li>
                      </ol>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">Para Producción</h5>
                      <p className="text-sm text-green-800 mb-3">
                        Configura un proveedor de email real:
                      </p>
                      <ol className="text-sm text-green-800 space-y-1">
                        <li>1. Ve a Supabase Dashboard → Authentication → Settings → SMTP</li>
                        <li>2. Configura Gmail, SendGrid, Mailgun, etc.</li>
                        <li>3. Personaliza los templates de email</li>
                        <li>4. Activa "Enable email confirmations"</li>
                      </ol>
                    </div>
                  </div>
                  <Button 
                    onClick={() => toast.success('Configuración de Supabase guardada')} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {isLoading ? 'Guardando...' : 'Guardar Configuración de Supabase'}
                  </Button>
                </CardContent>
              </Card>

              {/* Tests de Conectividad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Tests de Conectividad
                  </CardTitle>
                  <CardDescription>
                    Prueba la conectividad con servicios externos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estadísticas de Tests */}
                  <div className="space-y-4">
                    {testStats.map((stat) => (
                      <div key={stat.test_type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{stat.test_type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {stat.success_rate.toFixed(1)}%
                            </span>
                            <StatusIndicator
                              status={stat.success_rate >= 90 ? 'healthy' : stat.success_rate >= 70 ? 'timeout' : 'unhealthy'}
                              variant="dot"
                              size="sm"
                            />
                          </div>
                        </div>
                        <Progress value={stat.success_rate} className="h-2" />
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>Total: {stat.total_tests}</span>
                          <span>Exitosos: {stat.successful_tests}</span>
                          <span>Promedio: {stat.avg_response_time.toFixed(0)}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleTestAllEndpoints} 
                    disabled={testingConnections}
                    className="w-full"
                  >
                    <Play className={`h-4 w-4 mr-2 ${testingConnections ? 'animate-spin' : ''}`} />
                    {testingConnections ? 'Probando...' : 'Probar Todos los Endpoints'}
                  </Button>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleTestSingle('n8n_health')}
                      disabled={testingConnections}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Test n8n
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleTestSingle('afip_connection')}
                      disabled={testingConnections}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Test AFIP
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleTestSingle('supabase_connection')}
                      disabled={testingConnections}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Test Supabase
                    </Button>
                  </div>

                  {/* Historial de Tests */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Tests Recientes</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estado</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Tiempo</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connectivityTests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No hay tests registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          connectivityTests.slice(0, 5).map((test) => (
                            <TableRow key={test.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {test.test_status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {test.test_status === 'failure' && <XCircle className="h-4 w-4 text-red-500" />}
                                  {test.test_status === 'timeout' && <Clock className="h-4 w-4 text-orange-500" />}
                                  <Badge variant={
                                    test.test_status === 'success' ? 'default' :
                                    test.test_status === 'timeout' ? 'secondary' : 'destructive'
                                  }>
                                    {test.test_status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{test.test_type}</Badge>
                              </TableCell>
                              <TableCell>
                                {test.response_time_ms ? (
                                  <span className={
                                    test.response_time_ms < 1000 ? 'text-green-600' :
                                    test.response_time_ms < 3000 ? 'text-yellow-600' : 'text-red-600'
                                  }>
                                    {test.response_time_ms}ms
                                  </span>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(test.created_at).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DeveloperConfigGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente para configuración AFIP
const AFIPConfigSection = () => {
  const [afipStats, setAfipStats] = useState<any>(null);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingAFIP, setTestingAFIP] = useState(false);

  useEffect(() => {
    loadAFIPData();
  }, []);

  const loadAFIPData = async () => {
    setLoading(true);
    try {
      const [stats, history] = await Promise.all([
        afipValidationService.getValidationStats(),
        afipValidationService.getValidationHistory(24)
      ]);
      setAfipStats(stats);
      setValidationHistory(history);
    } catch (error) {
      console.error('Error loading AFIP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAFIPConnection = async () => {
    setTestingAFIP(true);
    try {
      const isAvailable = await afipValidationService.isAFIPAvailable();
      if (isAvailable) {
        toast.success('Conexión AFIP exitosa');
      } else {
        toast.error('AFIP no disponible');
      }
    } catch (error) {
      toast.error('Error probando conexión AFIP');
    } finally {
      setTestingAFIP(false);
    }
  };

  const cleanupCache = async () => {
    try {
      await afipValidationService.cleanupExpiredCache();
      toast.success('Cache AFIP limpiado');
      loadAFIPData();
    } catch (error) {
      toast.error('Error limpiando cache');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuración AFIP
          </CardTitle>
          <CardDescription>
            Gestión de validaciones y cache de AFIP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testAFIPConnection} disabled={testingAFIP} variant="outline">
              {testingAFIP ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Probar Conexión AFIP
            </Button>
            <Button onClick={cleanupCache} variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Cache
            </Button>
            <Button onClick={loadAFIPData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas AFIP */}
      {afipStats && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Validaciones (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{afipStats.totalValidaciones}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{afipStats.exitosas}</div>
                <div className="text-sm text-muted-foreground">Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{afipStats.fallidas}</div>
                <div className="text-sm text-muted-foreground">Fallidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{afipStats.tiempoPromedioMs.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
              </div>
            </div>
            {afipStats.ultimaValidacion && (
              <div className="mt-4 text-sm text-muted-foreground">
                Última validación: {afipStats.ultimaValidacion.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de Validaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Validaciones</CardTitle>
          <CardDescription>Últimas validaciones AFIP realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Cargando historial...</p>
            </div>
          ) : validationHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay validaciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Punto Venta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Tiempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationHistory.slice(0, 10).map((validation) => (
                  <TableRow key={validation.id}>
                    <TableCell>
                      {new Date(validation.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {validation.cuit}
                    </TableCell>
                    <TableCell>{validation.punto_venta}</TableCell>
                    <TableCell>{validation.tipo_comprobante}</TableCell>
                    <TableCell>
                      <Badge variant={validation.resultado ? 'default' : 'destructive'}>
                        {validation.resultado ? 'Exitosa' : 'Fallida'}
                      </Badge>
                    </TableCell>
                    <TableCell>{validation.tiempo_respuesta_ms}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracion;