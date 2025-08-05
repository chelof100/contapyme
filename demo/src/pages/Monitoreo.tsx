import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  RefreshCw, 
  Settings, 
  Shield,
  Trash2,
  Download
} from 'lucide-react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import SystemOverview from '@/components/monitoring/SystemOverview';
import WorkflowMetrics from '@/components/monitoring/WorkflowMetrics';
import ErrorLogs from '@/components/monitoring/ErrorLogs';
import { toast } from 'sonner';

const Monitoreo = () => {
  const {
    metrics,
    workflowPerformance,
    recentWorkflows,
    recentErrors,
    integrations,
    errorSummary,
    loading,
    error,
    loadAllData,
    resolveError,
    cleanupOldData,
    isSystemHealthy,
    hasErrors,
    hasCriticalErrors,
    unhealthyIntegrations
  } = useSystemMetrics();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
      toast.success('Datos actualizados exitosamente');
    } catch (err) {
      toast.error('Error al actualizar datos');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await cleanupOldData();
    } catch (err) {
      toast.error('Error al limpiar datos');
    }
  };

  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      system_metrics: metrics,
      workflow_performance: workflowPerformance,
      recent_workflows: recentWorkflows.slice(0, 100),
      recent_errors: recentErrors.slice(0, 100),
      integrations,
      error_summary: errorSummary
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Métricas exportadas exitosamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoreo del Sistema</h1>
          <p className="mt-2 text-gray-600">Dashboard completo de métricas y estado del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Métricas
          </Button>
          <Button variant="outline" onClick={handleCleanup}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Datos Antiguos
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Alertas del Sistema */}
      {(hasCriticalErrors || unhealthyIntegrations > 0 || !isSystemHealthy) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Se detectaron problemas en el sistema:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {hasCriticalErrors && (
                  <li>Hay errores críticos sin resolver que requieren atención inmediata</li>
                )}
                {unhealthyIntegrations > 0 && (
                  <li>{unhealthyIntegrations} integración(es) no están funcionando correctamente</li>
                )}
                {!isSystemHealthy && (
                  <li>La salud general del sistema está por debajo del umbral recomendado</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Estado General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className={`h-8 w-8 ${isSystemHealthy ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-2xl font-bold">
                  {isSystemHealthy ? 'Saludable' : 'Problemas'}
                </p>
                <p className="text-sm text-muted-foreground">Estado General</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.total_workflows_24h || 0}</p>
                <p className="text-sm text-muted-foreground">Workflows 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`h-8 w-8 ${hasCriticalErrors ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-2xl font-bold">{recentErrors.filter(e => !e.resolved).length}</p>
                <p className="text-sm text-muted-foreground">Errores Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{integrations.length}</p>
                <p className="text-sm text-muted-foreground">Integraciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error de Carga */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Error al cargar datos de monitoreo:</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Monitoreo */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Workflows
            {workflowPerformance.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {workflowPerformance.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Errores
            {hasErrors && (
              <Badge variant="destructive" className="ml-1">
                {recentErrors.filter(e => !e.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SystemOverview 
            metrics={metrics}
            integrations={integrations}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowMetrics 
            performance={workflowPerformance}
            recentWorkflows={recentWorkflows}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <ErrorLogs 
            errors={recentErrors}
            errorSummary={errorSummary}
            onResolveError={resolveError}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Monitoreo</CardTitle>
              <CardDescription>
                Ajustes y configuraciones del sistema de monitoreo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Retención de Datos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Métricas de Workflows:</span>
                      <Badge variant="outline">7 días</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Logs de Errores:</span>
                      <Badge variant="outline">30 días</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Errores Críticos:</span>
                      <Badge variant="outline">90 días</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Frecuencias de Actualización</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Métricas en Tiempo Real:</span>
                      <Badge variant="outline">30 segundos</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado Integraciones:</span>
                      <Badge variant="outline">5 minutos</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Limpieza Automática:</span>
                      <Badge variant="outline">Diaria</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Acciones de Mantenimiento</h4>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCleanup}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Datos Antiguos
                  </Button>
                  <Button variant="outline" onClick={exportMetrics}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Métricas
                  </Button>
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar Todo
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Información del Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Última Actualización:</strong></p>
                    <p className="text-muted-foreground">
                      {metrics ? new Date().toLocaleString() : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p><strong>Versión del Sistema:</strong></p>
                    <p className="text-muted-foreground">ContaPYME v1.0.0</p>
                  </div>
                  <div>
                    <p><strong>Entorno:</strong></p>
                    <p className="text-muted-foreground">
                      {import.meta.env.MODE === 'development' ? 'Desarrollo' : 'Producción'}
                    </p>
                  </div>
                  <div>
                    <p><strong>Base de Datos:</strong></p>
                    <p className="text-muted-foreground">Supabase PostgreSQL</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Monitoreo;