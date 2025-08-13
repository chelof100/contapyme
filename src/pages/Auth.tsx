import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { AlertTriangle, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkingEmpresa, setCheckingEmpresa] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('login');

  // Detectar query parameter para abrir tab de registro
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  // Verificar si existe empresa antes de permitir registro
  const checkEmpresaExists = async () => {
    setCheckingEmpresa(true);
    try {
      const { data, error } = await supabase
        .from('empresa')
        .select('id, nombre')
        .limit(1);

      if (error) {
        console.error('Error checking empresa:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking empresa:', error);
      return false;
    } finally {
      setCheckingEmpresa(false);
    }
  };

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting login process for:', loginData.email);
      console.log('Starting login process for:', loginData.email);
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        console.error('Login failed:', error);
        console.error('Login failed:', error);
        setIsLoading(false);
        return;
      }

      console.log('Login successful, navigating to dashboard...');
      console.log('Login successful, navigating to dashboard...');
      toast.success("¡Bienvenido! Has iniciado sesión correctamente");
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login exception:', error);
      console.error('Login exception:', error);
      toast.error("Ocurrió un error inesperado");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!registerData.email || !registerData.firstName || !registerData.lastName) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    setIsLoading(true);

    try {
      // Verificar si existe empresa antes de permitir registro
      const empresaExists = await checkEmpresaExists();
      if (!empresaExists) {
        toast.error("No hay empresa configurada en el sistema. Contacta al administrador para configurar una empresa antes de crear usuarios.");
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(
        registerData.email, 
        registerData.password,
        {
          username: registerData.username,
          first_name: registerData.firstName,
          last_name: registerData.lastName
        }
      );
      
      if (error) {
        return;
      }

      // Switch to login tab
      const loginTab = document.querySelector('[data-value="login"]') as HTMLElement;
      loginTab?.click();
      
      toast.success("Cuenta creada exitosamente. Ahora puedes iniciar sesión.");
      
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">OnePYME</CardTitle>
          <CardDescription>
            Sistema integral de gestión empresarial para PYMES
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
              
              {/* Enlace para reset de password */}
              <div className="mt-4 text-center">
                <a 
                  href="/admin-reset-password"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  <Key className="h-4 w-4" />
                  Resetear Password de Admin
                </a>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800 font-medium">
                    <strong>Acceso de Desarrollador</strong>
                  </p>
                </div>
                <p className="text-xs text-amber-700">
                  Usa las credenciales de desarrollador para acceso completo al sistema.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nombre</Label>
                    <Input
                      id="first-name"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Apellido</Label>
                    <Input
                      id="last-name"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      placeholder="Pérez"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                    required
                    placeholder="juan.perez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || checkingEmpresa}
                >
                  {isLoading ? 'Creando cuenta...' : checkingEmpresa ? 'Verificando empresa...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;