import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import '@/styles/user-config.css';
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
import { useEmpresa } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, AlertTriangle, Settings, Zap, Database, Shield, Webhook, Copy, Code, Download, Upload, Save } from 'lucide-react';
import DeveloperConfigGuard from '@/components/DeveloperConfigGuard';


const Configuracion: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState(configManager.getConfig());
  const [n8nConfig, setN8nConfig] = useState({
    baseUrl: config.api.n8n.baseUrl,
    apiKey: config.api.n8n.apiKey || ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [lastN8nCheck, setLastN8nCheck] = useState<Date | null>(null);
  const [n8nCheckInterval, setN8nCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [webhookMetrics, setWebhookMetrics] = useState<any>(null);
  const [supabaseConnectionStatus, setSupabaseConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [supabaseConnectionResult, setSupabaseConnectionResult] = useState<any>(null);
  const [lastSupabaseCheck, setLastSupabaseCheck] = useState<Date | null>(null);
  const [supabaseCheckInterval, setSupabaseCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Estados para datos de empresa
  const { data: empresaData, loading: empresaLoading, error: empresaError, update: updateEmpresa, createOrUpdate: createOrUpdateEmpresa } = useEmpresa();
  const { profile } = useAuth();
  const [localEmpresaData, setLocalEmpresaData] = useState<any>(null);
  
  // Estados para configuraciones de usuario
  const [userConfig, setUserConfig] = useState(() => {
    const saved = localStorage.getItem('onepyme_user_config');
    return saved ? JSON.parse(saved) : {
      theme: 'system',
      language: 'es',
      notifications: true,
      sound: true,
      density: 'comfortable',
      animations: true,
      sidebar: true
    };
  });

  // Aplicar configuraciones de usuario al cargar
  useEffect(() => {
    // Aplicar tema
    if (userConfig.theme) {
      document.documentElement.setAttribute('data-theme', userConfig.theme);
    }
    
    // Aplicar densidad
    if (userConfig.density) {
      document.body.className = document.body.className.replace(/density-\w+/g, '');
      document.body.classList.add(`density-${userConfig.density}`);
    }
    
    // Aplicar animaciones
    if (userConfig.animations !== undefined) {
      if (userConfig.animations) {
        document.body.classList.remove('no-animations');
      } else {
        document.body.classList.add('no-animations');
      }
    }
  }, [userConfig]);
  
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

  // Sincronizar datos locales de empresa
  useEffect(() => {
    if (empresaData) {
      setLocalEmpresaData(empresaData);
    }
  }, [empresaData]);

  // Función para guardar datos de empresa
  const handleSaveEmpresa = async () => {
    if (!localEmpresaData) return;
    
    try {
      // Si usuario no tiene empresa_id o tiene el ID por defecto, usar createOrUpdateEmpresa
      if (!profile?.empresa_id || profile.empresa_id === '00000000-0000-0000-0000-000000000001') {
        console.log('🔍 [Configuracion] Usuario sin empresa_id válido, creando/asignando empresa...');
        await createOrUpdateEmpresa(localEmpresaData);
      } else {
        // Si ya tiene empresa_id válido, usar updateEmpresa normal
        console.log('🔍 [Configuracion] Usuario con empresa_id válido, actualizando empresa...');
        await updateEmpresa(localEmpresaData);
      }
      
      toast({
        title: "Éxito",
        description: "Datos de la empresa configurados correctamente",
      });
    } catch (error) {
      console.error('❌ [Configuracion] Error al guardar empresa:', error);
      toast({
        title: "Error",
        description: "No se pudieron configurar los datos de la empresa",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Cargar métricas de webhooks
    const metrics = webhookService.getMetrics();
    setWebhookMetrics(metrics);

    // Iniciar monitoreo automático de Supabase y n8n
    startSupabaseMonitoring();
    startN8nMonitoring();

    // Limpiar intervalos al desmontar
    return () => {
      if (supabaseCheckInterval) {
        clearInterval(supabaseCheckInterval);
      }
      if (n8nCheckInterval) {
        clearInterval(n8nCheckInterval);
      }
    };
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

    const testN8nConnection = async (showToast: boolean = false) => {
    setConnectionStatus('testing');
    setConnectionResult(null);

    try {
      const result = await n8nService.testConnection();
      setConnectionResult(result);
      
      if (result.success) {
        setConnectionStatus('success');
        setLastN8nCheck(new Date());
        
        if (showToast) {
          toast({
            title: "Conexión exitosa",
            description: "n8n está conectado y funcionando correctamente.",
          });
        }
      } else {
        setConnectionStatus('error');
        setLastN8nCheck(new Date());
        
        if (showToast) {
          toast({
            title: "Error de conexión",
            description: result.error || "No se pudo conectar con n8n.",
            variant: "destructive",
          });
        }
      }
      } catch (error) {
      setConnectionStatus('error');
      setConnectionResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
      setLastN8nCheck(new Date());
      
      if (showToast) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con n8n.",
          variant: "destructive",
        });
      }
    }
  };

  const startN8nMonitoring = () => {
    // Limpiar intervalo existente si hay uno
    if (n8nCheckInterval) {
      clearInterval(n8nCheckInterval);
    }

    // Realizar primera verificación inmediatamente
    testN8nConnection(false);

    // Configurar intervalo de verificación cada 2 minutos (120000 ms)
    const interval = setInterval(() => {
      testN8nConnection(false);
    }, 120000); // 2 minutos

    setN8nCheckInterval(interval);
  };

  const stopN8nMonitoring = () => {
    if (n8nCheckInterval) {
      clearInterval(n8nCheckInterval);
      setN8nCheckInterval(null);
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

  const testSupabaseConnection = async (showToast: boolean = false) => {
    setSupabaseConnectionStatus('testing');
    setSupabaseConnectionResult(null);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
              const { data, error } = await supabase.from('empresa').select('count').limit(1);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSupabaseConnectionResult({ 
        success: true, 
        message: 'Conexión exitosa con Supabase',
        data: data,
        timestamp: new Date().toISOString()
      });
      setSupabaseConnectionStatus('success');
      setLastSupabaseCheck(new Date());
      
      if (showToast) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión con Supabase se estableció correctamente.",
        });
      }
    } catch (error) {
      setSupabaseConnectionResult({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
        timestamp: new Date().toISOString()
      });
      setSupabaseConnectionStatus('error');
      setLastSupabaseCheck(new Date());
      
      if (showToast) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con Supabase. Verifica la URL y API Key.",
          variant: "destructive",
        });
      }
    }
  };

  const startSupabaseMonitoring = () => {
    // Limpiar intervalo existente si hay uno
    if (supabaseCheckInterval) {
      clearInterval(supabaseCheckInterval);
    }

    // Realizar primera verificación inmediatamente
    testSupabaseConnection(false);

    // Configurar intervalo de verificación cada 2 minutos (120000 ms)
    const interval = setInterval(() => {
      testSupabaseConnection(false);
    }, 120000); // 2 minutos

    setSupabaseCheckInterval(interval);
  };

  const stopSupabaseMonitoring = () => {
    if (supabaseCheckInterval) {
      clearInterval(supabaseCheckInterval);
      setSupabaseCheckInterval(null);
    }
  };

  // Funciones para configuraciones de usuario
  const updateUserConfig = (updates: any) => {
    const newConfig = { ...userConfig, ...updates };
    setUserConfig(newConfig);
          localStorage.setItem('onepyme_user_config', JSON.stringify(newConfig));
    
    // Aplicar cambios inmediatamente
    if (updates.theme) {
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    
    // Aplicar otros cambios visuales
    if (updates.density) {
      document.body.className = document.body.className.replace(/density-\w+/g, '');
      document.body.classList.add(`density-${updates.density}`);
    }
    
    if (updates.animations !== undefined) {
      if (updates.animations) {
        document.body.classList.remove('no-animations');
      } else {
        document.body.classList.add('no-animations');
      }
    }
    
    if (updates.sidebar !== undefined) {
      // Aquí podrías emitir un evento para el sidebar
      window.dispatchEvent(new CustomEvent('toggleSidebar', { 
        detail: { visible: updates.sidebar } 
      }));
    }
    
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han aplicado correctamente.",
    });
  };

  const getSupabaseConnectionStatusIcon = () => {
    switch (supabaseConnectionStatus) {
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

  const getSupabaseConnectionStatusText = () => {
    switch (supabaseConnectionStatus) {
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
                  <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="database">Base de Datos</TabsTrigger>
          <TabsTrigger value="developer">Desarrollador</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuración de Usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de Usuario
                </CardTitle>
                <CardDescription>
                  Configuración personal del usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema de la Aplicación</Label>
                  <select
                    id="theme"
                    className="w-full p-2 border rounded-md"
                    value={userConfig.theme}
                    onChange={(e) => updateUserConfig({ theme: e.target.value })}
                  >
                    <option value="system">Sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                  </select>
                  </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded-md"
                    value={userConfig.language}
                    onChange={(e) => updateUserConfig({ language: e.target.value })}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={userConfig.notifications}
                    onCheckedChange={(checked) => updateUserConfig({ notifications: checked })}
                  />
                  <Label htmlFor="notifications">Notificaciones del Sistema</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sound"
                    checked={userConfig.sound}
                    onCheckedChange={(checked) => updateUserConfig({ sound: checked })}
                  />
                  <Label htmlFor="sound">Sonidos de Notificación</Label>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Interfaz */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Interfaz de Usuario
              </CardTitle>
              <CardDescription>
                  Configuración de la interfaz y experiencia de usuario
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Densidad de la Interfaz</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={userConfig.density}
                    onChange={(e) => updateUserConfig({ density: e.target.value })}
                  >
                    <option value="compact">Compacta</option>
                    <option value="comfortable">Cómoda</option>
                    <option value="spacious">Espaciosa</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="animations"
                    checked={userConfig.animations}
                    onCheckedChange={(checked) => updateUserConfig({ animations: checked })}
                  />
                  <Label htmlFor="animations">Animaciones de Interfaz</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sidebar"
                    checked={userConfig.sidebar}
                    onCheckedChange={(checked) => updateUserConfig({ sidebar: checked })}
                  />
                  <Label htmlFor="sidebar">Mostrar Barra Lateral</Label>
                </div>
            </CardContent>
          </Card>
                </div>

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Estado general y información del sistema
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Sistema Operativo</span>
                  </div>
                    <p className="text-xs text-green-600 mt-1">Funcionando correctamente</p>
                </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Base de Datos</span>
                  </div>
                    <p className="text-xs text-blue-600 mt-1">Conectada</p>
                </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Automatizaciones</span>
                  </div>
                    <p className="text-xs text-purple-600 mt-1">Disponibles</p>
                </div>

                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Sincronización</span>
                  </div>
                    <p className="text-xs text-orange-600 mt-1">En tiempo real</p>
                </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Nota:</strong> Para configuraciones técnicas avanzadas, 
                    consulta la sección <strong>Desarrollador</strong>.
                    </p>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información de la Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Información de la Empresa
                </CardTitle>
                <CardDescription>
                  Datos de la empresa cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa-nombre">Nombre de la Empresa</Label>
                  <Input
                    id="empresa-nombre"
                    placeholder="Nombre de la empresa"
                    value={localEmpresaData?.nombre || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-razon-social">Razón Social</Label>
                  <Input
                    id="empresa-razon-social"
                    placeholder="Razón social"
                    value={localEmpresaData?.razon_social || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, razon_social: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-cuit">CUIT</Label>
                  <Input
                    id="empresa-cuit"
                    placeholder="XX-XXXXXXXX-X"
                    value={localEmpresaData?.cuit || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, cuit: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-email">Email</Label>
                  <Input
                    id="empresa-email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={localEmpresaData?.email || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-telefono">Teléfono</Label>
                  <Input
                    id="empresa-telefono"
                    placeholder="+54 11 1234-5678"
                    value={localEmpresaData?.telefono || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handleSaveEmpresa}
                  disabled={empresaLoading}
                  className="w-full"
                >
                  {empresaLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>

            {/* Dirección y Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dirección y Ubicación
                </CardTitle>
                <CardDescription>
                  Información de ubicación de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa-direccion">Dirección</Label>
                  <Input
                    id="empresa-direccion"
                    placeholder="Calle y número"
                    value={localEmpresaData?.direccion || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, direccion: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-ciudad">Ciudad</Label>
                  <Input
                    id="empresa-ciudad"
                    placeholder="Ciudad"
                    value={localEmpresaData?.ciudad || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, ciudad: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-provincia">Provincia</Label>
                  <Input
                    id="empresa-provincia"
                    placeholder="Provincia"
                    value={localEmpresaData?.provincia || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, provincia: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-codigo-postal">Código Postal</Label>
                  <Input
                    id="empresa-codigo-postal"
                    placeholder="Código postal"
                    value={localEmpresaData?.codigo_postal || ''}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, codigo_postal: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa-condicion-iva">Condición IVA</Label>
                  <select
                    id="empresa-condicion-iva"
                    className="w-full p-2 border rounded-md"
                    value={localEmpresaData?.condicion_iva || 'Responsable Inscripto'}
                    onChange={(e) => setLocalEmpresaData(prev => ({ ...prev, condicion_iva: e.target.value }))}
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                  Estado del Sistema
                </CardTitle>
                <CardDescription>
                Estado de conexión con base de datos y automatizaciones
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
                            {/* Estado de conexión de Supabase */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getSupabaseConnectionStatusIcon()}
                  <div>
                    <h4 className="font-medium">Conexión Base de Datos (Supabase)</h4>
                    <p className="text-sm text-gray-600">
                      Estado: {getSupabaseConnectionStatusText()}
                    </p>
                    {lastSupabaseCheck && (
                      <p className="text-xs text-gray-500">
                        Última verificación: {lastSupabaseCheck.toLocaleTimeString()}
                      </p>
                    )}
                    <p className="text-xs text-blue-600">
                      🔄 Monitoreo automático cada 2 minutos
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button 
                    onClick={() => testSupabaseConnection(true)}
                    disabled={supabaseConnectionStatus === 'testing'}
                      size="sm"
                    variant="outline"
                    >
                    Probar Ahora
                    </Button>
                  <div className="text-xs text-center text-gray-500">
                    {supabaseCheckInterval ? '🟢 Monitoreo activo' : '🔴 Monitoreo inactivo'}
                  </div>
                </div>
                </div>

              {/* Estado de conexión de n8n */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getConnectionStatusIcon()}
                  <div>
                    <h4 className="font-medium">Conexión Automatizaciones (n8n)</h4>
                    <p className="text-sm text-gray-600">
                      Estado: {getConnectionStatusText()}
                    </p>
                    {lastN8nCheck && (
                      <p className="text-xs text-gray-500">
                        Última verificación: {lastN8nCheck.toLocaleTimeString()}
                      </p>
                    )}
                    <p className="text-xs text-blue-600">
                      🔄 Monitoreo automático cada 2 minutos
                    </p>
                      </div>
                      </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => testN8nConnection(true)}
                    disabled={connectionStatus === 'testing'}
                    size="sm"
                    variant="outline"
                  >
                    Probar Ahora
                  </Button>
                  <div className="text-xs text-center text-gray-500">
                    {n8nCheckInterval ? '🟢 Monitoreo activo' : '🔴 Monitoreo inactivo'}
                      </div>
                      </div>
                    </div>

              {/* Estado de sincronización en tiempo real */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                  {config.features.realTimeSync ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                        <div>
                    <h4 className="font-medium">Sincronización en Tiempo Real</h4>
                    <p className="text-sm text-gray-600">
                      {config.features.realTimeSync ? 'Activa' : 'Inactiva'}
                          </p>
                        </div>
                      </div>
                <Badge variant={config.features.realTimeSync ? "default" : "secondary"}>
                  {config.features.realTimeSync ? 'ON' : 'OFF'}
                </Badge>
                        </div>

              {/* Mensaje informativo */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Información:</strong> Si hay problemas de conexión, contacta al administrador del sistema. 
                  La configuración avanzada se encuentra en la sección <strong>Desarrollador</strong>.
                    </p>
                </div>
              </CardContent>
            </Card>
        </TabsContent>



        <TabsContent value="developer">
          <DeveloperConfigGuard>
          <div className="space-y-6">
              {/* Configuración del Usuario Admin del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configuración del Usuario Admin
                </CardTitle>
                <CardDescription>
                    Configuración del usuario administrador del sistema (salvavidas)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Usuario de Emergencia</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Este usuario actúa como salvavidas en caso de problemas con el usuario developer.
                    Solo puede ser configurado desde esta sección protegida.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email del Admin</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                              placeholder="admin@onepyme.pro"
        value="admin@onepyme.pro"
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usuario admin del sistema (creado en base de datos)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Contraseña del Admin</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      value="••••••••"
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contraseña configurada en Supabase
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Estado del Usuario Admin</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Activo - Salvavidas
                  </Badge>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Información de Seguridad</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    • Este usuario actúa como salvavidas del sistema<br/>
                    • Creado en base de datos Supabase<br/>
                    • Contraseña configurable desde Supabase Dashboard<br/>
                    • Acceso protegido a solapa Desarrollador
                  </p>
                </div>
              </CardContent>
            </Card>

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

                  

                {connectionResult && (
                <Alert>
                  <AlertDescription>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(connectionResult, null, 2)}
                      </pre>
                  </AlertDescription>
                </Alert>
                )}

                <Button 
                  onClick={handleN8nConfigUpdate}
                  className="w-full"
                >
                  Guardar Configuración n8n
                </Button>
              </CardContent>
            </Card>

            {/* Configuración de Supabase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configuración Supabase
                </CardTitle>
                <CardDescription>
                  Configuración avanzada de la base de datos Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supabaseUrl">URL de Supabase</Label>
                  <Input
                    id="supabaseUrl"
                    placeholder="https://tu-proyecto.supabase.co"
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
                  <Label htmlFor="supabaseKey">Clave Anónima</Label>
                  <Input
                    id="supabaseKey"
                    type="password"
                    placeholder="Tu clave anónima de Supabase"
                    value={config.api.supabase.anonKey}
                    onChange={(e) => handleConfigUpdate({
                      api: {
                        ...config.api,
                        supabase: { ...config.api.supabase, anonKey: e.target.value }
                      }
                    })}
                  />
                      </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSupabaseConnectionStatusIcon()}
                    <span className="text-sm">
                      Estado: {getSupabaseConnectionStatusText()}
                    </span>
                        </div>
                          <Button 
                    onClick={() => testSupabaseConnection(true)}
                    disabled={supabaseConnectionStatus === 'testing'}
                    size="sm"
                  >
                    Probar Conexión
                          </Button>
                </div>
                
                {supabaseConnectionResult && (
                  <Alert>
                    <AlertDescription>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(supabaseConnectionResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}

                  <Button 
                  onClick={() => {
                    toast({
                      title: "Configuración guardada",
                      description: "La configuración de Supabase se ha guardado correctamente.",
                    });
                  }}
                    className="w-full"
                  >
                  Guardar Configuración Supabase
                  </Button>
              </CardContent>
            </Card>

            {/* Configuración de Sincronización en Tiempo Real */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sincronización en Tiempo Real
                </CardTitle>
              <CardDescription>
                  Configuración de sincronización automática de datos
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="realtime-sync">Habilitar Sincronización en Tiempo Real</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que los cambios se sincronicen automáticamente entre usuarios
                    </p>
                </div>
                  <Switch
                    id="realtime-sync"
                    checked={config.features.realTimeSync}
                    onCheckedChange={(checked) => handleConfigUpdate({
                      features: { ...config.features, realTimeSync: checked }
                    })}
                  />
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Nota:</strong> La sincronización en tiempo real requiere una conexión estable con Supabase. 
                    Si está deshabilitada, los cambios solo se sincronizarán al recargar la página.
                  </p>
                </div>

                            <Button
                  onClick={() => {
                    toast({
                      title: "Configuración guardada",
                      description: "La configuración de sincronización se ha guardado correctamente.",
                    });
                  }}
                  className="w-full"
                >
                  Guardar Configuración de Sincronización
                            </Button>
            </CardContent>
          </Card>

            {/* Configuración General del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración General del Sistema
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
                  Configuración de Seguridad
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

            {/* Características del Sistema */}
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

              {/* Métricas de Webhooks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Métricas de Webhooks
                  </CardTitle>
                  <CardDescription>
                    Estadísticas de conectividad con n8n
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {webhookMetrics ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{webhookMetrics.totalRequests}</div>
                        <div className="text-sm text-muted-foreground">Total de Requests</div>
                    </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{webhookMetrics.successfulRequests}</div>
                        <div className="text-sm text-muted-foreground">Exitosos</div>
                    </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{webhookMetrics.failedRequests}</div>
                        <div className="text-sm text-muted-foreground">Fallidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{webhookMetrics.averageResponseTime}ms</div>
                        <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No hay métricas disponibles</p>
                  )}
                </CardContent>
              </Card>

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
                  {/* Configuración de Endpoints */}

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
            "source": "OnePyme-Frontend",
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