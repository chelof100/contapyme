import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Users, 
  Target, 
  Calendar,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  User,
  Folder,
  Megaphone,
  ChefHat
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useSupabaseData';
import { useCRMDashboard } from '@/hooks/useCRMData';
import { useERPDashboard } from '@/hooks/useERPData';
import { useConfig } from '@/contexts/ConfigContext';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { StatusIndicator, ConnectionStatus, MultiServiceStatus } from '@/components/ui/StatusIndicator';

const Dashboard = () => {
  const { recetasEnabled } = useConfig();
  const dashboardData = useDashboardData();
  const crmData = useCRMDashboard();
  const erpData = useERPDashboard();
  const { healthStatus, history, loading, error, isRunning } = useHealthCheck();

  // Quick actions for different modules
  const quickActions = [
    { name: 'Nueva Factura', href: '/facturas', icon: FileText, color: 'bg-blue-500' },
    { name: 'Nuevo Cliente', href: '/crm/clientes', icon: Users, color: 'bg-green-500' },
    { name: 'Nueva Oportunidad', href: '/crm/oportunidades', icon: Target, color: 'bg-purple-500' },
    { name: 'Nuevo Proyecto', href: '/erp/proyectos', icon: Folder, color: 'bg-orange-500' },
    { name: 'Registrar Pago', href: '/pagos', icon: CreditCard, color: 'bg-indigo-500' },
    { name: 'Movimiento Stock', href: '/stock', icon: Package, color: 'bg-red-500' },
  ];

  // Recent activities simulation
  const recentActivities = [
    { type: 'factura', description: 'Factura 0001-00000123 emitida', time: '2 min ago', icon: FileText },
    { type: 'cliente', description: 'Nuevo cliente: Empresa SA', time: '15 min ago', icon: Users },
    { type: 'pago', description: 'Pago recibido: $50,000', time: '1 hora ago', icon: CreditCard },
    { type: 'oportunidad', description: 'Oportunidad movida a "Negociación"', time: '2 horas ago', icon: Target },
    { type: 'proyecto', description: 'Proyecto "Web App" completado', time: '3 horas ago', icon: Folder },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Vista general de tu negocio</p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Indicador de Estado del Sistema */}
          <div className="flex items-center gap-2">
            <StatusIndicator
              status={healthStatus ? 'healthy' : 'unknown'}
              label="Sistema"
              variant="badge"
              tooltip={
                healthStatus 
                  ? 'Sistema funcionando correctamente'
                  : 'Estado del sistema desconocido'
              }
            />
            {loading && (
              <span className="text-xs text-muted-foreground">
                Verificando...
              </span>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Reportes
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Acción Rápida
          </Button>
        </div>
      </div>

      {/* Alertas de Sistema */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error en el Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Link key={action.name} to={action.href}>
                <Button variant="outline" className="h-20 w-full flex-col gap-2 hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-center">{action.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Accounting Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Emitidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.facturas.emitidas}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.facturas.pendientes} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Abiertas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.ordenes.abiertas}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.ordenes.cerradas} cerradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.productos.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.productos.stockBajo} con stock bajo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos del Mes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pagos.total}</div>
            <p className="text-xs text-muted-foreground">
              ${dashboardData.pagos.monto.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>

        {/* CRM Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmData.clientes.activos}</div>
            <p className="text-xs text-muted-foreground">
              {crmData.clientes.prospectos} prospectos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline de Ventas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmData.oportunidades.abiertas}</div>
            <p className="text-xs text-muted-foreground">
              ${crmData.oportunidades.valorTotal.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crmData.actividades.pendientes}</div>
            <p className="text-xs text-muted-foreground">
              {crmData.actividades.vencidas} vencidas
            </p>
          </CardContent>
        </Card>

        {/* ERP Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${erpData.finanzas.cashFlowMes.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {erpData.finanzas.presupuestoVsReal.toFixed(1)}% vs presupuesto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{erpData.empleados.activos}</div>
            <p className="text-xs text-muted-foreground">
              {erpData.empleados.enLicencia} en licencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{erpData.proyectos.activos}</div>
            <p className="text-xs text-muted-foreground">
              {erpData.proyectos.facturacionPendiente.toFixed(1)} hs por facturar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{erpData.finanzas.rentabilidad.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {erpData.proyectos.rentabilidadPromedio.toFixed(1)}% proyectos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas y Notificaciones
            </CardTitle>
            <div className="flex items-center gap-2">
              <MultiServiceStatus
                services={[
                  { name: 'n8n', status: healthStatus ? 'healthy' : 'unhealthy' },
                  { name: 'Supabase', status: 'healthy' },
                  { name: 'Frontend', status: 'healthy' }
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Alertas de Health Check */}
            {error && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Error en el Sistema</span>
                </div>
                <Badge variant="destructive">Error</Badge>
              </div>
            )}
            
            {dashboardData.productos.stockBajo > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Stock Bajo</span>
                </div>
                <Badge variant="destructive">{dashboardData.productos.stockBajo}</Badge>
              </div>
            )}
            
            {crmData.actividades.vencidas > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Actividades Vencidas</span>
                </div>
                <Badge variant="secondary">{crmData.actividades.vencidas}</Badge>
              </div>
            )}
            
            {dashboardData.facturas.pendientes > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Facturas Pendientes</span>
                </div>
                <Badge variant="outline">{dashboardData.facturas.pendientes}</Badge>
              </div>
            )}
            
            {erpData.empleados.enLicencia > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Empleados en Licencia</span>
                </div>
                <Badge variant="secondary">{erpData.empleados.enLicencia}</Badge>
              </div>
            )}

            {dashboardData.productos.stockBajo === 0 && 
             crmData.actividades.vencidas === 0 && 
             dashboardData.facturas.pendientes === 0 && 
             erpData.empleados.enLicencia === 0 && 
             !error && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>¡Todo en orden! No hay alertas pendientes.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <activity.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento Ventas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Meta Mensual</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Conversión Pipeline</span>
                <span>32%</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Satisfacción Cliente</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Proyectos a Tiempo</span>
                <span>88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Utilización Empleados</span>
                <span>76%</span>
              </div>
              <Progress value={76} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Facturación vs Presupuesto</span>
                <span>94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salud Financiera</CardTitle>
            <div className="flex items-center gap-2">
              <StatusIndicator
                status={healthStatus ? 'healthy' : 'unhealthy'}
                label="Conectividad"
                variant="badge"
                size="sm"
              />
              {loading && (
                <span className="text-xs text-muted-foreground">
                  Verificando...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">A+</div>
              <p className="text-sm text-muted-foreground">Score Financiero</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Liquidez</span>
                <Badge variant="default">Excelente</Badge>
              </div>
              <div className="flex justify-between">
                <span>Rentabilidad</span>
                <Badge variant="default">Buena</Badge>
              </div>
              <div className="flex justify-between">
                <span>Crecimiento</span>
                <Badge variant="secondary">Estable</Badge>
              </div>
            </div>
            
            {/* Métricas de Sistema */}
            {history.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Métricas del Sistema</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Checks Totales:</span>
                    <span>{history.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo Respuesta:</span>
                    <span>{history[0]?.response_time_ms?.toFixed(0) || 'N/A'}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponibilidad:</span>
                    <span>{healthStatus ? '100' : '0'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Último Check:</span>
                    <span>
                      {history[0]?.last_check 
                        ? new Date(history[0].last_check).toLocaleTimeString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Estado de Módulos del Sistema
          </CardTitle>
          <CardDescription>
            Vista general del estado y funcionalidad de todos los módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Accounting Modules */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Contabilidad</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Facturas</span>
                  <Badge variant="default">Activo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Órdenes de Compra</span>
                  <Badge variant="default">Activo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Pagos</span>
                  <Badge variant="default">Activo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Stock</span>
                  <Badge variant="default">Activo</Badge>
                </div>
                {recetasEnabled && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">Recetas</span>
                    <Badge variant="default">Activo</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* CRM Modules */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">CRM</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Clientes</span>
                  <Badge className="bg-blue-100 text-blue-800">Nuevo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Oportunidades</span>
                  <Badge className="bg-blue-100 text-blue-800">Nuevo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Actividades</span>
                  <Badge className="bg-blue-100 text-blue-800">Nuevo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Campañas</span>
                  <Badge className="bg-blue-100 text-blue-800">Nuevo</Badge>
                </div>
              </div>
            </div>

            {/* ERP Modules */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">ERP</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Finanzas</span>
                  <Badge className="bg-purple-100 text-purple-800">Nuevo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Empleados</span>
                  <Badge className="bg-purple-100 text-purple-800">Nuevo</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Proyectos</span>
                  <Badge className="bg-purple-100 text-purple-800">Nuevo</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;