import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChefHat,
  ArrowRight
} from 'lucide-react';
import { useUsers, useClientes, useProductos } from '@/hooks/useSupabaseData';
import { useConfig } from '@/contexts/ConfigContext';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { StatusIndicator, ConnectionStatus, MultiServiceStatus } from '@/components/ui/StatusIndicator';

// Función para obtener el componente de icono
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    FileText,
    Users,
    Target,
    Folder,
    CreditCard,
    Package,
    ShoppingCart,
    ChefHat
  };
  return iconMap[iconName] || FileText;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { recetasEnabled } = useConfig();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: clientes, loading: clientesLoading } = useClientes();
  const { data: productos, loading: productosLoading } = useProductos();
  const { healthStatus, history, loading, error, isRunning } = useHealthCheck();
  const { quickActions, recentActivities, loading: analyticsLoading, trackAction } = useUserAnalytics();

  // Track page view when component mounts
  useEffect(() => {
    trackAction('page_view', 'dashboard', '/dashboard');
  }, [trackAction]);

  // Datos mock para el dashboard (temporal)
  const dashboardData = {
    crm: {
      clientes: { activos: clientes?.length || 0, prospectos: 0 },
      oportunidades: { abiertas: 0, valorTotal: 0 },
      actividades: { pendientes: 0, vencidas: 0 }
    },
    erp: {
      finanzas: { cashFlowMes: 0, presupuestoVsReal: 0, rentabilidad: 0 },
      empleados: { activos: users?.length || 0, enLicencia: 0 },
      proyectos: { activos: 0, facturacionPendiente: 0, rentabilidadPromedio: 0 }
    },
    productos: { stockBajo: productos?.filter(p => p.stock_actual < p.stock_minimo).length || 0 },
    facturas: { pendientes: 0 }
  };

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
            Nueva Actividad
          </Button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.crm.clientes.activos}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.crm.clientes.prospectos} prospectos
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Abiertas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.crm.oportunidades.abiertas}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                ${dashboardData.crm.oportunidades.valorTotal.toLocaleString('es-AR')}
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Actividades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.crm.actividades.pendientes}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.crm.actividades.vencidas} vencidas
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData.erp.finanzas.cashFlowMes.toLocaleString('es-AR')}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.erp.finanzas.presupuestoVsReal.toFixed(1)}% vs presupuesto
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda Fila de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Empleados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.erp.empleados.activos}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.erp.empleados.enLicencia} en licencia
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Proyectos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.erp.proyectos.activos}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.erp.proyectos.facturacionPendiente.toFixed(1)} hs por facturar
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidad */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.erp.finanzas.rentabilidad.toFixed(1)}%</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.erp.proyectos.rentabilidadPromedio.toFixed(1)}% proyectos
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos?.length || 0}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {dashboardData.productos.stockBajo} con stock bajo
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stock Bajo */}
          {dashboardData.productos.stockBajo > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Stock Bajo</span>
              </div>
              <Badge variant="secondary">{dashboardData.productos.stockBajo}</Badge>
            </div>
          )}
          
          {/* Actividades Vencidas */}
          {dashboardData.crm.actividades.vencidas > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Actividades Vencidas</span>
              </div>
              <Badge variant="secondary">{dashboardData.crm.actividades.vencidas}</Badge>
            </div>
          )}
          
          {/* Empleados en Licencia */}
          {dashboardData.erp.empleados.enLicencia > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Empleados en Licencia</span>
              </div>
              <Badge variant="secondary">{dashboardData.erp.empleados.enLicencia}</Badge>
            </div>
          )}

          {dashboardData.productos.stockBajo === 0 && 
          dashboardData.crm.actividades.vencidas === 0 && 
          dashboardData.facturas.pendientes === 0 && 
          dashboardData.erp.empleados.enLicencia === 0 && 
          !error && (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No hay alertas pendientes</p>
              <p className="text-xs">El sistema está funcionando correctamente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/crm/clientes')}>
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Nuevo Cliente</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/facturas')}>
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Nueva Factura</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/productos')}>
              <Package className="h-6 w-6 mb-2" />
              <span className="text-sm">Nuevo Producto</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/crm/actividades')}>
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">Nueva Actividad</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;