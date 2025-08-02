import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Users, 
  Target, 
  Calendar,
  DollarSign,
  User,
  Folder,
  TestTube,
  Play,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useSupabaseData';
import { useCRMDashboard } from '@/hooks/useCRMData';
import { useERPDashboard } from '@/hooks/useERPData';
import { toast } from 'sonner';

const TestingDashboard = () => {
  const { user, profile } = useAuth();
  const dashboardData = useDashboardData();
  const crmData = useCRMDashboard();
  const erpData = useERPDashboard();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  const testSuites = [
    {
      id: 'auth',
      name: 'Sistema de Autenticación',
      icon: Users,
      tests: [
        { id: 'user_logged_in', name: 'Usuario autenticado', check: () => !!user },
        { id: 'profile_exists', name: 'Perfil de usuario existe', check: () => !!profile },
        { id: 'empresa_assigned', name: 'Empresa asignada', check: () => !!profile?.empresa_id },
        { id: 'role_assigned', name: 'Rol asignado', check: () => !!profile?.role },
      ]
    },
    {
      id: 'accounting',
      name: 'Módulos Contables',
      icon: Database,
      tests: [
        { id: 'facturas_loaded', name: 'Facturas cargadas', check: () => !dashboardData.loading },
        { id: 'ordenes_loaded', name: 'Órdenes cargadas', check: () => !dashboardData.loading },
        { id: 'pagos_loaded', name: 'Pagos cargados', check: () => !dashboardData.loading },
        { id: 'stock_loaded', name: 'Stock cargado', check: () => !dashboardData.loading },
      ]
    },
    {
      id: 'crm',
      name: 'Módulos CRM',
      icon: Target,
      tests: [
        { id: 'clientes_module', name: 'Módulo Clientes', check: () => typeof crmData.clientes.total === 'number' },
        { id: 'oportunidades_module', name: 'Módulo Oportunidades', check: () => typeof crmData.oportunidades.abiertas === 'number' },
        { id: 'actividades_module', name: 'Módulo Actividades', check: () => typeof crmData.actividades.pendientes === 'number' },
        { id: 'pipeline_value', name: 'Valor Pipeline calculado', check: () => typeof crmData.oportunidades.valorTotal === 'number' },
      ]
    },
    {
      id: 'erp',
      name: 'Módulos ERP',
      icon: DollarSign,
      tests: [
        { id: 'finanzas_module', name: 'Módulo Finanzas', check: () => !erpData.loading },
        { id: 'empleados_module', name: 'Módulo Empleados', check: () => typeof erpData.empleados.total === 'number' },
        { id: 'proyectos_module', name: 'Módulo Proyectos', check: () => typeof erpData.proyectos.activos === 'number' },
        { id: 'cash_flow', name: 'Cash Flow calculado', check: () => typeof erpData.finanzas.cashFlowMes === 'number' },
      ]
    }
  ];

  const runTest = (testId: string, testFn: () => boolean) => {
    try {
      const result = testFn();
      setTestResults(prev => ({ ...prev, [testId]: result }));
      return result;
    } catch (error) {
      console.error(`Test ${testId} failed:`, error);
      setTestResults(prev => ({ ...prev, [testId]: false }));
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    const results: Record<string, boolean> = {};
    
    for (const suite of testSuites) {
      for (const test of suite.tests) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
        const result = runTest(test.id, test.check);
        results[test.id] = result;
      }
    }
    
    setTestResults(results);
    setIsRunningTests(false);
    
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = Object.values(results).filter(Boolean).length;
    
    if (passedTests === totalTests) {
      toast.success(`¡Todos los tests pasaron! (${passedTests}/${totalTests})`);
    } else {
      toast.error(`${passedTests}/${totalTests} tests pasaron. Revisa los fallos.`);
    }
  };

  const getTestIcon = (testId: string) => {
    if (isRunningTests) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (testResults[testId] === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (testResults[testId] === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const calculateProgress = () => {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const completedTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(Boolean).length;
    
    return {
      completion: (completedTests / totalTests) * 100,
      success: completedTests > 0 ? (passedTests / completedTests) * 100 : 0,
      total: totalTests,
      completed: completedTests,
      passed: passedTests
    };
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Testing</h1>
          <p className="mt-2 text-gray-600">Verificación completa del sistema CRM + ERP</p>
        </div>
        <Button onClick={runAllTests} disabled={isRunningTests}>
          <TestTube className="h-4 w-4 mr-2" />
          {isRunningTests ? 'Ejecutando Tests...' : 'Ejecutar Todos los Tests'}
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Progreso de Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{progress.total}</div>
                <div className="text-sm text-muted-foreground">Tests Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{progress.completed}</div>
                <div className="text-sm text-muted-foreground">Ejecutados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{progress.passed}</div>
                <div className="text-sm text-muted-foreground">Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{progress.completed - progress.passed}</div>
                <div className="text-sm text-muted-foreground">Fallidos</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso de Ejecución</span>
                <span>{progress.completion.toFixed(1)}%</span>
              </div>
              <Progress value={progress.completion} className="h-2" />
            </div>
            
            {progress.completed > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tasa de Éxito</span>
                  <span>{progress.success.toFixed(1)}%</span>
                </div>
                <Progress value={progress.success} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{user ? 'Conectado' : 'Desconectado'}</p>
                <p className="text-sm text-muted-foreground">Estado de Autenticación</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">Activa</p>
                <p className="text-sm text-muted-foreground">Base de Datos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{profile?.role || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Rol de Usuario</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Suites */}
      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {testSuites.map((suite) => (
            <TabsTrigger key={suite.id} value={suite.id}>
              <suite.icon className="h-4 w-4 mr-2" />
              {suite.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {testSuites.map((suite) => (
          <TabsContent key={suite.id} value={suite.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <suite.icon className="h-5 w-5" />
                  Tests de {suite.name}
                </CardTitle>
                <CardDescription>
                  Verificación de funcionalidad del módulo {suite.name.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTestIcon(test.id)}
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults[test.id] === true && (
                          <Badge variant="default">Pasó</Badge>
                        )}
                        {testResults[test.id] === false && (
                          <Badge variant="destructive">Falló</Badge>
                        )}
                        {testResults[test.id] === undefined && (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(test.id, test.check)}
                          disabled={isRunningTests}
                        >
                          Ejecutar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Datos de Autenticación</h4>
              <div className="text-sm space-y-1">
                <p><strong>Email:</strong> {user?.email || 'No disponible'}</p>
                <p><strong>ID:</strong> {user?.id || 'No disponible'}</p>
                <p><strong>Verificado:</strong> {user?.email_confirmed_at ? 'Sí' : 'No'}</p>
                <p><strong>Último login:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Datos del Perfil</h4>
              <div className="text-sm space-y-1">
                <p><strong>Nombre:</strong> {profile?.first_name} {profile?.last_name}</p>
                <p><strong>Username:</strong> {profile?.username || 'No disponible'}</p>
                <p><strong>Rol:</strong> {profile?.role || 'No asignado'}</p>
                <p><strong>Empresa ID:</strong> {profile?.empresa_id || 'No asignada'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Solución de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Problemas de Autenticación:</strong>
              <br />• Si no puedes registrar usuarios, verifica la configuración de email en Supabase
              <br />• Si los perfiles no se crean, ejecuta las migraciones de la base de datos
              <br />• Si hay errores de RLS, verifica que las políticas estén habilitadas
              <br /><br />
              <strong>🔧 Solución Rápida:</strong>
              <br />• Ve a Supabase Dashboard → Authentication → Settings
              <br />• Desactiva "Enable email confirmations"
              <br />• Registra usuarios sin confirmación de email
              <br />• Configura SMTP más tarde para producción
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>🔧 Solución Rápida para Login:</strong>
              <br />• Email: admin@contapyme.com
              <br />• Contraseña: admin123
              <br />• Rol: admin (acceso completo)
              <br /><br />
              <strong>Si el login de Supabase no funciona:</strong>
              <br />• Usa las credenciales de arriba (modo mock)
              <br />• Ve a Supabase Dashboard → Authentication
              <br />• Desactiva "Enable email confirmations"
              <br />• Registra usuarios sin confirmación
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestingDashboard;