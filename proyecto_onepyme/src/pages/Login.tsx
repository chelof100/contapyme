import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Key } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { signIn, signUp, user, session } = useAuth();
  const navigate = useNavigate();

  // ✅ VERIFICAR SI YA HAY SESIÓN ACTIVA
  useEffect(() => {
    if (user && session) {
      console.log('🔍 [Login] Usuario ya autenticado, redirigiendo...');
      navigate('/dashboard');
    }
  }, [user, session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ EVITAR LOGIN SI YA ESTÁ AUTENTICADO
    if (user && session) {
      console.log('🔍 [Login] Usuario ya autenticado, redirigiendo...');
      navigate('/dashboard');
      return;
    }

    console.log('🔍 [Login] handleLogin ejecutándose...');
    console.log('🔍 [Login] Email:', email);
    console.log('🔍 [Login] Password:', password ? '***' : 'vacío');
    setLoading(true);

    try {
      console.log('🔍 [Login] Llamando a signIn...');
      // ✅ CORRECCIÓN: Usar signIn en lugar de login
      await signIn(email, password);
      console.log('🔍 [Login] signIn exitoso, redirigiendo...');
      toast.success("Has iniciado sesión correctamente");
      console.log('🔍 [Login] navigate disponible:', !!navigate);
      console.log('🔍 [Login] navigate function:', navigate);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('❌ [Login] Error en login:', error);
      toast.error(error.message || "Credenciales inválidas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!username.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);

    try {
      // La función signUp retorna void, no necesitamos verificar result.error
      await signUp(email, password, {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });
      
      // Si llegamos aquí, el signUp fue exitoso
      toast.success("Usuario creado exitosamente. Revisa tu email para confirmar la cuenta.");
      setActiveTab('login');
      resetForm();
      
    } catch (error: any) {
      toast.error(error.message || "Error al crear el usuario. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setFirstName('');
    setLastName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/srcassets/OnePyme Logo.png" 
              alt="OnePyme Logo" 
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">OnePyme</CardTitle>
          <CardDescription>
            Sistema integral de gestión empresarial para PYMES
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" onClick={resetForm}>Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register" onClick={resetForm}>Crear Cuenta</TabsTrigger>
            </TabsList>

            {/* SOLAPA DE LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors" 
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            {/* SOLAPA DE REGISTRO */}
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Nombre de Usuario</Label>
                  <Input
                    id="register-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="usuario123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="register-firstname">Nombre</Label>
                    <Input
                      id="register-firstname"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-lastname">Apellido</Label>
                    <Input
                      id="register-lastname"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Pérez"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors" 
                  disabled={loading}
                >
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* NOTA INFORMATIVA */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Para cuentas de empresa, contacta al administrador del sistema
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;