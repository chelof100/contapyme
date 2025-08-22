import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Settings,
  LogOut,
  Menu,
  X,
  Warehouse,
  ChefHat,
  Users,
  Target,
  Calendar,
  Megaphone,
  TrendingUp,
  User,
  Folder,
  ChevronDown,
  ChevronRight,
  Activity,
  Shield,
  UserCog
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut, profile } = useAuth();
  const { recetasEnabled } = useConfig();
  const { healthStatus, history, loading, error, isRunning } = useHealthCheck();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['contabilidad', 'crm', 'admin']);

  // Debug: Log valores para identificar el problema
  console.log('🔍 [Layout] Debug values:', {
    recetasEnabled: recetasEnabled,
    recetasEnabledType: typeof recetasEnabled,
    profile: profile,
    userRole: profile?.role
  });

  // Función para verificar si el usuario es admin
  const isAdmin = () => {
    return profile?.role === 'admin' || profile?.role === 'developer';
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const navigationStructure = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Contabilidad',
      section: 'contabilidad',
      icon: FileText,
      children: [
        { name: 'Facturas', href: '/facturas', icon: FileText },
        { name: 'Órdenes de Compra', href: '/ordenes-compra', icon: ShoppingCart },
        { name: 'Órdenes de Recepción', href: '/ordenes-recepcion', icon: Package },
        { name: 'Pagos', href: '/pagos', icon: CreditCard },
      ]
    },
    { name: 'Stock', href: '/stock', icon: Warehouse },
    // Corregido: Manejo seguro del spread operator
    ...(recetasEnabled ? [{ name: 'Recetas', href: '/recetas', icon: ChefHat }] : []),
    {
      name: 'CRM',
      section: 'crm',
      icon: Users,
      children: [
        { name: 'Clientes', href: '/crm/clientes', icon: Users },
        { name: 'Oportunidades', href: '/crm/oportunidades', icon: Target },
        { name: 'Actividades', href: '/crm/actividades', icon: Calendar },
        { name: 'Campañas', href: '/crm/campanas', icon: Megaphone },
      ]
    },
    {
      name: 'ERP',
      section: 'erp',
      icon: TrendingUp,
      children: [
        { name: 'Finanzas', href: '/erp/finanzas', icon: TrendingUp },
        { name: 'Empleados', href: '/erp/empleados', icon: User },
        { name: 'Proyectos', href: '/erp/proyectos', icon: Folder },
      ]
    },
    // Corregido: Manejo seguro del spread operator con verificación de isAdmin
    ...(isAdmin() && typeof isAdmin === 'function' ? [{
      name: 'Administración',
      section: 'admin',
      icon: Shield,
      children: [
        { name: 'Gestión de Usuarios', href: '/admin/usuarios', icon: UserCog },
      ]
    }] : []),
    { name: 'Configuración', href: '/configuracion', icon: Settings },
    { name: '🧪 Testing', href: '/testing', icon: Settings },
    { name: '📊 Monitoreo', href: '/monitoreo', icon: Activity }
  ];



  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const isSectionActive = (section: any) => {
    if (section.href) {
      return isActive(section.href);
    }
    if (section.children) {
      return section.children.some((child: any) => isActive(child.href));
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-lg">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-blue-900">OnePyme</h1>
            </div>
            <div className="mt-5 flex-1 px-3">
              <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{profile?.role === 'developer' ? 'OnePyme System' : 'Empresa'}</p>
                <p className="text-xs text-blue-600">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIndicator
                                status={healthStatus ? 'healthy' : 'unknown'}
            label={healthStatus ? 'Sistema OK' : 'Verificando'}
                    variant="badge"
                    size="sm"
                  />
                </div>
              </div>
              <nav className="space-y-1">
                {navigationStructure.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <Collapsible 
                        open={expandedSections.includes(item.section!)}
                        onOpenChange={() => toggleSection(item.section!)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            className={`${
                              isSectionActive(item)
                                ? 'bg-blue-100 text-blue-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                          >
                            <div className="flex items-center">
                              <item.icon
                                className={`${
                                  isSectionActive(item) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                                } mr-3 h-5 w-5 flex-shrink-0`}
                              />
                              {item.name}
                            </div>
                            {expandedSections.includes(item.section!) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 ml-6 mt-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.href}
                                                                                            className={`${
                                isActive(child.href)
                                  ? 'bg-blue-600 text-white border-r-2 border-blue-800 shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                            >
                              <child.icon
                                className={`${
                                  isActive(child.href) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                                } mr-3 h-4 w-4 flex-shrink-0`}
                              />
                              {child.name}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Link
                        to={item.href!}
                        className={`${
                          isActive(item.href!)
                            ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                      >
                        <item.icon
                          className={`${
                            isActive(item.href!) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          } mr-3 h-5 w-5 flex-shrink-0`}
                        />
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 px-3">
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-blue-600 hover:text-white transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full"
              >
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <img 
                  src="/srcassets/OnePyme Logo.png" 
                  alt="OnePyme Logo" 
                  className="h-8 w-auto"
                />
              </div>
              <div className="mt-5 flex-1 px-3">
                <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                  <p className="text-sm font-medium text-blue-900">{profile?.role === 'developer' ? 'OnePyme System' : 'Empresa'}</p>
                  <p className="text-xs text-blue-600">{user?.email}</p>
                </div>
                <nav className="space-y-1">
                  {navigationStructure.map((item) => (
                    <div key={item.name}>
                      {item.children ? (
                        <div className="space-y-1">
                          <div className="px-2 py-2 text-sm font-medium text-gray-500">
                            {item.name}
                          </div>
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              to={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`${
                                isActive(child.href)
                                  ? 'bg-blue-600 text-white border-r-2 border-blue-800 shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              } group flex items-center px-2 py-2 text-sm font-medium rounded-md ml-4 transition-colors`}
                            >
                              <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          to={item.href!}
                          onClick={() => setSidebarOpen(false)}
                          className={`${
                            isActive(item.href!)
                              ? 'bg-blue-600 text-white border-r-2 border-blue-800 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                        >
                          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <div className="w-14 flex-shrink-0" />
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-white shadow-sm lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="/srcassets/OnePyme Logo.png" 
                alt="OnePyme Logo" 
                className="h-6 w-auto"
              />
              <StatusIndicator
                status={healthStatus ? 'healthy' : 'unknown'}
                variant="icon"
                size="sm"
                tooltip={
                  healthStatus 
                    ? 'Sistema funcionando correctamente'
                    : 'Estado desconocido'
                }
              />
            </div>
            <div className="w-8" />
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;