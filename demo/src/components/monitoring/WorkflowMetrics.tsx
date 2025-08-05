import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Zap
} from 'lucide-react';
import { WorkflowPerformance, WorkflowMetric } from '@/hooks/useSystemMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';

interface WorkflowMetricsProps {
  performance: WorkflowPerformance[];
  recentWorkflows: WorkflowMetric[];
  loading?: boolean;
  onRefresh?: () => void;
}

const WorkflowMetrics: React.FC<WorkflowMetricsProps> = ({ 
  performance, 
  recentWorkflows, 
  loading = false, 
  onRefresh 
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Exitoso</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ejecutando</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (rate >= 85) return <Badge className="bg-yellow-100 text-yellow-800">Bueno</Badge>;
    return <Badge variant="destructive">Necesita atención</Badge>;
  };

  const filteredPerformance = selectedWorkflow === 'all' 
    ? performance 
    : performance.filter(w => w.name === selectedWorkflow);

  const filteredRecentWorkflows = selectedWorkflow === 'all'
    ? recentWorkflows
    : recentWorkflows.filter(w => w.name === selectedWorkflow);

  // Datos para gráficos
  const performanceChartData = filteredPerformance.map(w => ({
    name: w.name,
    success_rate: w.success_rate,
    avg_execution_time: w.avg_execution_time,
    total_executions: w.total_executions
  }));

  const recentWorkflowsChartData = filteredRecentWorkflows.slice(-10).map(w => ({
    name: w.name,
    execution_time: w.execution_time,
    status: w.status === 'success' ? 1 : 0,
    timestamp: new Date(w.timestamp).toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }));

  const getOverallStats = () => {
    if (filteredPerformance.length === 0) return { avgSuccessRate: 0, totalExecutions: 0, avgExecutionTime: 0 };
    
    const totalExecutions = filteredPerformance.reduce((sum, w) => sum + w.total_executions, 0);
    const avgSuccessRate = filteredPerformance.reduce((sum, w) => sum + w.success_rate, 0) / filteredPerformance.length;
    const avgExecutionTime = filteredPerformance.reduce((sum, w) => sum + w.avg_execution_time, 0) / filteredPerformance.length;
    
    return { avgSuccessRate, totalExecutions, avgExecutionTime };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Métricas de Workflows</h2>
          <Badge variant="outline">{performance.length} workflows</Badge>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(stats.avgSuccessRate)}`}>
              {stats.avgSuccessRate.toFixed(1)}%
            </div>
            <Progress value={stats.avgSuccessRate} className="mt-2" />
            <div className="mt-2">
              {getSuccessRateBadge(stats.avgSuccessRate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ejecuciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              En las últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgExecutionTime.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">
              Tiempo de ejecución promedio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rendimiento por Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-muted-foreground text-xs" />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-green-600">Éxito: {data.success_rate}%</p>
                            <p className="text-sm text-blue-600">Tiempo: {data.avg_execution_time}s</p>
                            <p className="text-sm text-purple-600">Ejecuciones: {data.total_executions}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="success_rate" fill="#10B981" name="Tasa de Éxito (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de rendimiento disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Rendimiento Detallado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando métricas...</p>
            </div>
          ) : filteredPerformance.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay workflows</h3>
              <p className="text-muted-foreground">
                No hay datos de rendimiento disponibles para los filtros seleccionados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Tasa de Éxito</TableHead>
                  <TableHead>Tiempo Promedio</TableHead>
                  <TableHead>Total Ejecuciones</TableHead>
                  <TableHead>Última Ejecución</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerformance.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div className="font-medium">{workflow.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`font-medium ${getSuccessRateColor(workflow.success_rate)}`}>
                          {workflow.success_rate.toFixed(1)}%
                        </div>
                        {getSuccessRateBadge(workflow.success_rate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{workflow.avg_execution_time.toFixed(2)}s</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{workflow.total_executions.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workflow.last_execution).toLocaleString('es-AR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {workflow.success_rate >= 95 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : workflow.success_rate >= 85 ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {workflow.success_rate >= 95 ? 'Estable' : 
                           workflow.success_rate >= 85 ? 'Atención' : 'Crítico'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Workflows Recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ejecuciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecentWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay ejecuciones recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecentWorkflows.slice(0, 10).map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(workflow.status)}
                    <div>
                      <div className="font-medium">{workflow.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workflow.timestamp).toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{workflow.execution_time.toFixed(2)}s</div>
                      <div className="text-xs text-muted-foreground">Tiempo</div>
                    </div>
                    {getStatusBadge(workflow.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowMetrics;