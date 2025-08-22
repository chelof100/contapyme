import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Shield,
  Database,
  Wifi
} from 'lucide-react';
import { SystemMetrics, IntegrationStatus } from '@/hooks/useSystemMetrics';

interface SystemOverviewProps {
  metrics: SystemMetrics | null;
  integrations: IntegrationStatus[];
  loading: boolean;
}

const SystemOverview: React.FC<SystemOverviewProps> = ({ metrics, integrations, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 95) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 85) return <Badge className="bg-yellow-100 text-yellow-800">Bueno</Badge>;
    if (score >= 70) return <Badge className="bg-orange-100 text-orange-800">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
  };

  const successRate = metrics?.total_workflows_24h 
    ? (metrics.successful_workflows_24h / metrics.total_workflows_24h) * 100 
    : 0;

  const integrationHealthy = integrations.filter(i => i.status === 'healthy').length;
  const integrationTotal = integrations.length;

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salud del Sistema</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(metrics?.system_health_score || 0)}`}>
              {metrics?.system_health_score?.toFixed(1) || '0'}%
            </div>
            <div className="flex items-center justify-between mt-2">
              {getHealthScoreBadge(metrics?.system_health_score || 0)}
            </div>
            <Progress 
              value={metrics?.system_health_score || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_workflows_24h || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">{metrics?.successful_workflows_24h || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">{metrics?.failed_workflows_24h || 0}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tasa de Éxito</span>
                <span>{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="mt-1 h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_response_time_ms?.toFixed(0) || '0'}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio últimas 24h
            </p>
            <div className="mt-2">
              {(metrics?.avg_response_time_ms || 0) < 1000 ? (
                <Badge className="bg-green-100 text-green-800">Rápido</Badge>
              ) : (metrics?.avg_response_time_ms || 0) < 3000 ? (
                <Badge className="bg-yellow-100 text-yellow-800">Normal</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Lento</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores 24h</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_errors_24h || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-600">
                  {metrics?.critical_errors_24h || 0} críticos
                </span>
              </div>
            </div>
            {(metrics?.critical_errors_24h || 0) > 0 && (
              <Badge variant="destructive" className="mt-2">
                Requiere Atención
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estado de Integraciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Estado de Integraciones
          </CardTitle>
          <CardDescription>
            {integrationHealthy} de {integrationTotal} integraciones funcionando correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {integration.integration_name === 'n8n' && <Zap className="h-4 w-4" />}
                    {integration.integration_name === 'afip' && <Shield className="h-4 w-4" />}
                    {integration.integration_name === 'supabase' && <Database className="h-4 w-4" />}
                    <span className="font-medium">{integration.integration_name}</span>
                  </div>
                  <Badge 
                    variant={integration.status === 'healthy' ? 'default' : 'destructive'}
                    className={
                      integration.status === 'healthy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {integration.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">{integration.uptime_percentage}%</span>
                  </div>
                  
                  {integration.response_time_ms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Respuesta:</span>
                      <span className="font-medium">{integration.response_time_ms}ms</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Éxito 24h:</span>
                    <span className="font-medium text-green-600">{integration.success_count_24h}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Errores 24h:</span>
                    <span className="font-medium text-red-600">{integration.error_count_24h}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Salud</span>
                      <span>{integration.health_grade}</span>
                    </div>
                    <Progress 
                      value={integration.uptime_percentage} 
                      className="h-1"
                    />
                  </div>
                </div>
                
                {integration.last_error_time && (
                  <div className="mt-2 text-xs text-red-600">
                    Último error: {new Date(integration.last_error_time).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {integrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay integraciones configuradas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemOverview;