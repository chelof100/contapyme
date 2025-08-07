import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { configManager } from '@/config/app';
import { n8nService } from '@/services/n8nService';
import { webhookService } from '@/services/webhookService';
import { CheckCircle, XCircle, AlertTriangle, Settings, Zap, Database, Shield, Webhook, Copy, Code, Download, Upload, Save } from 'lucide-react';
import DeveloperConfigGuard from '@/components/DeveloperConfigGuard';
import MultiTenantManager from '@/components/MultiTenantManager';

const Configuracion: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState(configManager.getConfig());
  const [n8nConfig, setN8nConfig] = useState({
    baseUrl: config.api.n8n.baseUrl,
    apiKey: config.api.n8n.apiKey || ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [webhookMetrics, setWebhookMetrics] = useState<any>(null);
  
  // Estados para configuración avanzada de webhooks
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

  useEffect(() => {
    // Cargar métricas de webhooks
    const metrics = webhookService.getMetrics();
    setWebhookMetrics(metrics);
  }, []);

  const handleConfigUpdate = (updates: any) => {
    try {
      configManager.updateConfig(updates);
      setConfig(configManager.getConfig());
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleN8nConfigUpdate = () => {
    try {
      // Validar URL
      if (!n8nConfig.baseUrl || !n8nConfig.baseUrl.startsWith('http')) {
        toast({
          title: "URL inválida",
          description: "La URL de n8n debe comenzar con http:// o https://",
          variant: "destructive",
        });
        return;
      }

      // Actualizar configuración
      configManager.updateN8nConfig({
        baseUrl: n8nConfig.baseUrl,
        apiKey: n8nConfig.apiKey
      });

      // Configurar servicios
      n8nService.configure(n8nConfig.baseUrl, n8nConfig.apiKey);
      webhookService.setBaseUrl(n8nConfig.baseUrl);
      if (n8nConfig.apiKey) {
        webhookService.setApiKey(n8nConfig.apiKey);
      }

      setConfig(configManager.getConfig());
      toast({
        title: "Configuración de n8n actualizada",
        description: "La configuración se ha guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de n8n.",
        variant: "destructive",
      });
    }
  };

  const testN8nConnection = async () => {
    setConnectionStatus('testing');
    setConnectionResult(null);

    try {
      const result = await n8nService.testConnection();
      setConnectionResult(result);
      
      if (result.success) {
        setConnectionStatus('success');
        toast({
          title: "Conexión exitosa",
          description: "n8n está conectado y funcionando correctamente.",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Error de conexión",
          description: result.error || "No se pudo conectar con n8n.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con n8n.",
        variant: "destructive",
      });
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Conectado';
      case 'error':
        return 'Error de conexión';
      case 'testing':
        return 'Probando conexión...';
      default:
        return 'No probado';
    }
  };

  // Funciones para configuración avanzada de webhooks
  const handleSaveWebhookConfig = async () => {
    try {
      // Validar URL base
      if (!webhookConfig.baseUrl || !webhookConfig.baseUrl.startsWith('http')) {
        toast({
          title: "URL inválida",
          description: "La URL base debe comenzar con http:// o https://",
          variant: "destructive",
        });
        return;
      }

      // Guardar configuración en localStorage
      localStorage.setItem('webhook-endpoints', JSON.stringify(webhookConfig));
      
      // Actualizar servicios
      webhookService.setBaseUrl(webhookConfig.baseUrl);
      if (webhookConfig.apiKey) {
        webhookService.setApiKey(webhookConfig.apiKey);
      }
      webhookService.setTimeout(webhookConfig.timeout);
      webhookService.updateEndpoints(webhookConfig.endpoints);

      // Actualizar configuración principal
      configManager.updateN8nConfig({
        baseUrl: webhookConfig.baseUrl,
        apiKey: webhookConfig.apiKey,
        timeout: webhookConfig.timeout,
        retryAttempts: webhookConfig.retryAttempts
      });

      setConfig(configManager.getConfig());
      toast({
        title: "Configuración guardada",
        description: "La configuración de webhooks se ha guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de webhooks.",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = async (endpoint: string) => {
    try {
      const result = await webhookService.testConnection();
      if (result.success) {
        toast({
          title: "Webhook funcional",
          description: `El endpoint ${endpoint} está funcionando correctamente.`,
        });
      } else {
        toast({
          title: "Error en webhook",
          description: `El endpoint ${endpoint} no está respondiendo: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de prueba",
        description: `No se pudo probar el endpoint ${endpoint}`,
        variant: "destructive",
      });
    }
  };

  const copyWebhookUrl = (endpoint: string) => {
    const fullUrl = `${webhookConfig.baseUrl}${endpoint}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "URL copiada",
      description: "La URL del webhook se ha copiado al portapapeles.",
    });
  };

  const exportWebhookConfig = () => {
    const dataStr = JSON.stringify(webhookConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'webhook-config.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuración exportada",
      description: "La configuración se ha descargado correctamente.",
    });
  };

  const importWebhookConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setWebhookConfig(importedConfig);
        toast({
          title: "Configuración importada",
          description: "La configuración se ha importado correctamente.",
        });
      } catch (error) {
        toast({
          title: "Error de importación",
          description: "El archivo no tiene un formato válido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Configura los parámetros del sistema y las integraciones
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="n8n">n8n</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
          <TabsTrigger value="multi-tenant">Multi-Tenant</TabsTrigger>
          <TabsTrigger value="developer">Desarrollador</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración General
                </CardTitle>
                <CardDescription>
                  Configuración básica de la aplicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nombre de la Aplicación</Label>
                  <Input
                    id="appName"
                    value={config.app.name}
                    onChange={(e) => handleConfigUpdate({
                      app: { ...config.app, name: e.target.value }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="environment">Entorno</Label>
                  <select
                    id="environment"
                    className="w-full p-2 border rounded-md"
                    value={config.app.environment}
                    onChange={(e) => handleConfigUpdate({
                      app: { ...config.app, environment: e.target.value as any }
                    })}
                  >
                    <option value="development">Desarrollo</option>
                    <option value="staging">Staging</option>
                    <option value="production">Producción</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="debug"
                    checked={config.app.debug}
                    onCheckedChange={(checked) => handleConfigUpdate({
                      app: { ...config.app, debug: checked }
                    })}
                  />
                  <Label htmlFor="debug">Modo Debug</Label>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Seguridad
                </CardTitle>
                <CardDescription>
                  Configuración de seguridad y autenticación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiempo de Sesión (minutos)</Label>
                  <Input
                    type="number"
                    value={config.security.sessionTimeout / 60000}
                    onChange={(e) => handleConfigUpdate({
                      security: {
                        ...config.security,
                        sessionTimeout: parseInt(e.target.value) * 60000
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intentos Máximos de Login</Label>
                  <Input
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => handleConfigUpdate({
                      security: {
                        ...config.security,
                        maxLoginAttempts: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.security.requireTwoFactor}
                    onCheckedChange={(checked) => handleConfigUpdate({
                      security: { ...config.security, requireTwoFactor: checked }
                    })}
                  />
                  <Label>Requerir Autenticación de Dos Factores</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características del Sistema</CardTitle>
              <CardDescription>
                Activa o desactiva funcionalidades específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => handleConfigUpdate({
                        features: { ...config.features, [key]: checked }
                      })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuración básica de n8n */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Integración n8n
                </CardTitle>
                <CardDescription>
                  Configuración básica de automatizaciones con n8n
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8nUrl">URL de n8n</Label>
                  <Input
                    id="n8nUrl"
                    placeholder="https://tu-workspace.n8n.cloud"
                    value={n8nConfig.baseUrl}
                    onChange={(e) => setN8nConfig({ ...n8nConfig, baseUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="n8nApiKey">API Key</Label>
                  <Input
                    id="n8nApiKey"
                    type="password"
                    placeholder="Tu API key de n8n"
                    value={n8nConfig.apiKey}
                    onChange={(e) => setN8nConfig({ ...n8nConfig, apiKey: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getConnectionStatusIcon()}
                    <span className="text-sm">
                      Estado: {getConnectionStatusText()}
                    </span>
                  </div>
                  <Button
                    onClick={testN8nConnection}
                    disabled={connectionStatus === 'testing'}
                    size="sm"
                  >
                    Probar Conexión
                  </Button>
                </div>

                {connectionResult && (
                  <Alert>
                    <AlertDescription>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(connectionResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleN8nConfigUpdate} className="w-full">
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>

            {/* Métricas de Webhooks */}
            {webhookMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Webhooks</CardTitle>
                  <CardDescription>
                    Estadísticas de conectividad con n8n
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{webhookMetrics.totalRequests}</div>
                      <div className="text-sm text-muted-foreground">Total de Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {webhookMetrics.successfulRequests}
                      </div>
                      <div className="text-sm text-muted-foreground">Exitosos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {webhookMetrics.failedRequests}
                      </div>
                      <div className="text-sm text-muted-foreground">Fallidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {webhookMetrics.averageResponseTime.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Base de Datos
              </CardTitle>
              <CardDescription>
                Configuración de Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL de Supabase</Label>
                <Input
                  value={config.api.supabase.url}
                  onChange={(e) => handleConfigUpdate({
                    api: {
                      ...config.api,
                      supabase: { ...config.api.supabase, url: e.target.value }
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Clave Anónima</Label>
                <Input
                  type="password"
                  value={config.api.supabase.anonKey}
                  onChange={(e) => handleConfigUpdate({
                    api: {
                      ...config.api,
                      supabase: { ...config.api.supabase, anonKey: e.target.value }
                    }
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.features.realTimeSync}
                  onCheckedChange={(checked) => handleConfigUpdate({
                    features: { ...config.features, realTimeSync: checked }
                  })}
                />
                <Label>Sincronización en Tiempo Real</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-tenant">
          <DeveloperConfigGuard>
            <MultiTenantManager />
          </DeveloperConfigGuard>
        </TabsContent>

        <TabsContent value="developer">
          <DeveloperConfigGuard>
            <div className="space-y-6">
              {/* Configuración Avanzada de Webhooks n8n */}
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
                              value={endpoint as string}
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
                               onClick={() => copyWebhookUrl(endpoint as string)}
                             >
                               <Copy className="h-4 w-4" />
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleTestWebhook(endpoint as string)}
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
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración de Webhooks
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
            </div>
          </DeveloperConfigGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracion;